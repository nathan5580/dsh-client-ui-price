/**
 * DeepSeek pricing widget, browser half: one compact, colored chip beside the
 * session title reporting the live peak/valley billing regime, the current
 * model's per-1M rates, the session's accumulated cost, and the remaining
 * top-up. Data comes from the framework projection and snapshot seats plus the
 * host `llm.balance` RPC; this file only wires the registration.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type PriceKey } from './locales.ts';
import { type Config as PriceConfig } from './config.ts';
export type { PriceBadgeComponentProps, PriceBadgeInjected, } from './contract/slots.ts';
export type { PriceKey } from './locales.ts';
export type { Config as PriceConfig, ModelRate } from './config.ts';
export { applicableRate, displayModel, formatRate, formatUsd, isPeakAt, nextRegimeChange, sessionCostUsd, } from './pricing.ts';
export type { RegimeChange } from './pricing.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Price widget copy (header chip and tooltip). */
        price: PriceKey;
    }
}
/** Services required by the price widget plugin. */
export declare const inject: string[];
/**
 * Register the pricing chip into the session header's title-adjacent action
 * list. The seat is declared by ui-conversation; this contribution waits on
 * that declaration through the slots inject and disappears with it.
 * @param ctx - Client root context.
 * @param config - Validated plugin configuration (rates, peak window, toggles).
 */
export declare function apply(ctx: ClientContext, config: PriceConfig): void;
//# sourceMappingURL=index.d.ts.map