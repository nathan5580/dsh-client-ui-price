// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PriceBadge } from '../src/client/PriceBadge.tsx'
import type { PriceBadgeComponentProps } from '../src/client/contract/slots.ts'
import { Config } from '../src/client/config.ts'
import { en } from '../src/client/locales.ts'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const config = Config({})
const t: PriceBadgeComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key

interface MountOptions {
  at?: string
  model?: string | null
  usage?: unknown
  refresh?: () => Promise<unknown>
}

function mount(options: MountOptions = {}) {
  const at = options.at ?? '2026-08-16T12:00:00Z'
  // Fake only Date: the regime clock and balance poll stay deterministic while
  // real timers keep @testing-library's waitFor working.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(at))
  const refresh = options.refresh
    ?? (async () => ({ isAvailable: true, balances: [{ currency: 'USD', totalBalance: '12.5', grantedBalance: '2.5', toppedUpBalance: '10' }] }))
  const loadModel = options.model === null
    ? (async () => undefined)
    : (async () => ({ provider: 'deepseek-official', model: options.model ?? 'deepseek-v4-flash' }))
  const useProjection = (() => options.usage) as never
  const view = render(
    <PriceBadge
      sessionId="s-1"
      useProjection={useProjection}
      config={config}
      refreshBalance={refresh as never}
      loadModel={loadModel as never}
      t={t}
    />,
  )
  return { view, refresh }
}

describe('PriceBadge', () => {
  it('renders the valley regime in green outside peak hours', () => {
    mount({ at: '2026-08-16T12:00:00Z' })
    const chip = screen.getByRole('button')
    expect(chip.getAttribute('data-regime')).toBe('valley')
    expect(chip.textContent).toContain('Valley')
  })

  it('renders the peak regime in red inside peak hours', () => {
    mount({ at: '2026-08-16T02:00:00Z' })
    const chip = screen.getByRole('button')
    expect(chip.getAttribute('data-regime')).toBe('peak')
    expect(chip.textContent).toContain('Peak')
  })

  it('shows the model and the session cost from the token usage', async () => {
    mount({
      at: '2026-08-16T12:00:00Z',
      usage: { uncachedInputTokens: 1_000_000, outputTokens: 500_000, cacheReadTokens: 1_000_000, cacheWriteTokens: 1_000_000 },
    })
    await waitFor(() => {
      const chip = screen.getByRole('button')
      expect(chip.textContent).toContain('v4-flash')
      expect(chip.textContent).toContain('$0.78')
    })
  })

  it('renders the top-up once the balance read settles', async () => {
    mount({ at: '2026-08-16T12:00:00Z' })
    await waitFor(() => { expect(screen.getByRole('button').textContent).toContain('↑10USD') })
  })

  it('renders the unavailable state on a failed read', async () => {
    mount({ at: '2026-08-16T12:00:00Z', refresh: async () => { throw new Error('no key') } })
    await waitFor(() => { expect(screen.getByRole('button').textContent).toContain('· · ·') })
  })

  it('refreshes the balance on click', async () => {
    const refresh = vi.fn(async () => ({ isAvailable: true, balances: [{ currency: 'USD', totalBalance: '1', grantedBalance: '0', toppedUpBalance: '1' }] }))
    mount({ at: '2026-08-16T12:00:00Z', refresh })
    await waitFor(() => { expect(screen.getByRole('button').textContent).toContain('↑1USD') })
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => { expect(refresh).toHaveBeenCalledTimes(2) })
  })

  it('renders the session cost and the top-up as distinct badges', async () => {
    mount({
      at: '2026-08-16T12:00:00Z',
      usage: { uncachedInputTokens: 1_000_000, outputTokens: 500_000, cacheReadTokens: 1_000_000, cacheWriteTokens: 1_000_000 },
    })
    await waitFor(() => {
      const chip = screen.getByRole('button')
      const cost = chip.querySelector('[data-kind="cost"]')
      const balance = chip.querySelector('[data-kind="balance"]')
      expect(cost).not.toBeNull()
      expect(balance).not.toBeNull()
      expect(cost?.textContent).toContain('$0.78')
      expect(balance?.textContent).toContain('↑10USD')
      expect(cost?.getAttribute('data-kind')).not.toBe(balance?.getAttribute('data-kind'))
    })
  })

  it('still renders the regime when the session has no routable model selection', async () => {
    mount({ at: '2026-08-16T12:00:00Z', model: null })
    await waitFor(() => {
      const chip = screen.getByRole('button')
      expect(chip.getAttribute('data-regime')).toBe('valley')
      expect(chip.textContent).toContain('Valley')
      expect(chip.textContent).not.toContain('v4-flash')
    })
  })

  it('renders nothing when every segment is disabled', () => {
    const off = Config({ showRegime: false, showModel: false, showCost: false, showBalance: false })
    const emptySnapshot = { chat: { legacy: { nodes: [] } } } as never
    const view = render(
      <PriceBadge
        useSession={((selector: (snapshotValue: never) => unknown) => selector(emptySnapshot)) as never}
        useProjection={(() => undefined) as never}
        config={off}
        refreshBalance={(() => Promise.reject(new Error('unused'))) as never}
        t={t}
      />,
    )
    expect(view.container.textContent).toBe('')
  })
})
