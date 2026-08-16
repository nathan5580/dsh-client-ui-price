/** Price widget slot registration and its connection-backed callback. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { apply, inject } from '../src/client/index.ts'
import type { PriceBadgeInjected } from '../src/client/contract/slots.ts'
import { Config } from '../src/client/config.ts'
import { PriceBadge } from '../src/client/PriceBadge.tsx'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.provide('locale', new LocaleRuntime(ctx))
  const api = {
    llm: {
      balance: vi.fn<() => Promise<{ rpcId: never; result: { ok: boolean; value?: unknown; error?: unknown } }>>(async () => ({
        rpcId: 'rpc' as never,
        result: {
          ok: true,
          value: { balance: { isAvailable: true, balances: [{ currency: 'USD', totalBalance: '12.5', grantedBalance: '2.5', toppedUpBalance: '10.0' }] } },
        },
      })),
    },
  }
  ctx.provide('connection', { api } as never)
  const slots = ctx.get('slots') as SlotRegistry
  // Declare the owner seat exactly as ui-conversation does.
  slots.register(
    { name: 'root', children: { conversation: { kind: 'single', scope: 'root' } } } as never,
    () => null,
  )
  slots.register(
    { name: 'conversation', children: { 'conversation.session.header.actions': { kind: 'list', scope: 'session' } } } as never,
    () => null,
  )
  return { ctx, slots, api }
}

describe('ui-price apply', () => {
  it('declares only the services it uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'connection'])
  })

  it('registers the chip into the header action seat', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }, Config({})).await()
    const entry = b.slots.entries('conversation.session.header.actions')[0]!
    expect(entry.component).toBe(PriceBadge)
    expect(entry.options).toMatchObject({ id: 'price', order: -5 })
    expect(entry.locale).toBe('price')
    const injected = (entry.inject as unknown as () => PriceBadgeInjected)()
    // The schema fills the official defaults for a config-less mount.
    expect(injected.config.rates['deepseek-v4-flash']).toEqual({ cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 })
    await expect(injected.refreshBalance()).resolves.toEqual({
      isAvailable: true,
      balances: [{ currency: 'USD', totalBalance: '12.5', grantedBalance: '2.5', toppedUpBalance: '10.0' }],
    })
    expect(b.api.llm.balance).toHaveBeenCalledWith({})
  })

  it('surfaces an RPC error as a rejection for the widget state', async () => {
    const b = await bench()
    b.api.llm.balance.mockResolvedValue({
      rpcId: 'rpc' as never,
      result: { ok: false, error: { code: 'balance-unavailable', message: 'no key', details: { reason: 'no key' } } },
    })
    await b.ctx.plugin({ inject: [...inject], apply }, Config({})).await()
    const entry = b.slots.entries('conversation.session.header.actions')[0]!
    const injected = (entry.inject as unknown as () => PriceBadgeInjected)()
    await expect(injected.refreshBalance()).rejects.toThrow('no key')
  })

  it('waits for the owner declaration instead of failing early', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.provide('locale', new LocaleRuntime(ctx))
    ctx.provide('connection', { api: { llm: { balance: vi.fn() } } } as never)
    const fiber = ctx.plugin({ inject: [...inject], apply }, Config({}))
    await fiber.await()
    // The inject seat stays pending until a declaration lands; applying does
    // not throw, and the widget only registers once the owner declares it.
    const slots = ctx.get('slots') as SlotRegistry
    expect(slots.entries('conversation.session.header.actions')).toHaveLength(0)
    slots.register(
      { name: 'root', children: { conversation: { kind: 'single', scope: 'root' } } } as never,
      () => null,
    )
    slots.register(
      { name: 'conversation', children: { 'conversation.session.header.actions': { kind: 'list', scope: 'session' } } } as never,
      () => null,
    )
    await Promise.resolve()
    await Promise.resolve()
    expect(slots.entries('conversation.session.header.actions')).toHaveLength(1)
    await fiber.dispose()
  })

  it('removes the entry on teardown', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply }, Config({}))
    await fiber.await()
    expect(b.slots.entries('conversation.session.header.actions')).toHaveLength(1)
    await fiber.dispose()
    expect(b.slots.entries('conversation.session.header.actions')).toHaveLength(0)
  })
})
