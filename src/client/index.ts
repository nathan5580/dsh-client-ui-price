/**
 * DeepSeek pricing widget, browser half: one compact, colored chip beside the
 * session title reporting the live peak/valley billing regime, the current
 * model's per-1M rates, the session's accumulated cost, and the remaining
 * top-up. Data comes from the framework projection and snapshot seats plus the
 * host `llm.balance` RPC; this file only wires the registration.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { PriceBadgeInjected } from './contract/slots.ts'
import { PriceBadge } from './PriceBadge.tsx'
import { en, zh, type PriceKey } from './locales.ts'
import { Config, type Config as PriceConfig } from './config.ts'

export type {
  PriceBadgeComponentProps, PriceBadgeInjected,
} from './contract/slots.ts'
export type { PriceKey } from './locales.ts'
export type { Config as PriceConfig, ModelRate } from './config.ts'
export {
  applicableRate, displayModel, formatRate, formatUsd, isPeakAt, latestModel,
  nextRegimeChange, sessionCostUsd,
} from './pricing.ts'
export type { ModelCarrier, RegimeChange } from './pricing.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Price widget copy (header chip and tooltip). */
    price: PriceKey
  }
}

/** Dictionary namespace owned by this plugin (widget copy). */
const NS = 'price'

/** Services required by the price widget plugin. */
export const inject = ['slots', 'locale', 'connection']

/**
 * Register the pricing chip into the session header's title-adjacent action
 * list. The seat is declared by ui-conversation; this contribution waits on
 * that declaration through the slots inject and disappears with it.
 * @param ctx - Client root context.
 * @param config - Validated plugin configuration (rates, peak window, toggles).
 */
export function apply(ctx: ClientContext, config: PriceConfig): void {
  const resolved = Config(config ?? {}) as PriceConfig
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-price: dictionaries')

  const connection = ctx.get('connection') as ConnectionHandle
  const injectProps = (): PriceBadgeInjected => ({
    config: resolved,
    refreshBalance: async () => {
      const response = await connection.api.llm.balance({})
      if (!response.result.ok) {
        throw new Error(response.result.error.message)
      }
      return response.result.value.balance
    },
  })

  ctx.effect(
    () => ctx.slots.inject('conversation.session.header.actions',
      () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'price',
        // Negative band: static session context precedes interactive actions
        // (ui-agent-preset's label occupies -10; the chip sits after it).
        order: -5,
        locale: NS,
        inject: injectProps,
      }, PriceBadge)),
    'ui-price: header slot',
  )
}
