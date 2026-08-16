/**
 * DeepSeek pricing widget, browser half: one compact, colored chip beside the
 * session title reporting the live peak/valley billing regime, the current
 * model's per-1M rates, the session's accumulated cost, and the remaining
 * top-up. Data comes from the framework projection and snapshot seats plus the
 * host `llm.balance` RPC; this file only wires the registration.
 */
import { PriceBadge } from "./PriceBadge.js";
import { en, zh } from "./locales.js";
import { Config } from "./config.js";
export { applicableRate, displayModel, formatRate, formatUsd, isPeakAt, nextRegimeChange, sessionCostUsd, } from "./pricing.js";
/** Dictionary namespace owned by this plugin (widget copy). */
const NS = 'price';
/** Services required by the price widget plugin. */
export const inject = ['slots', 'locale', 'connection'];
/**
 * Register the pricing chip into the session header's title-adjacent action
 * list. The seat is declared by ui-conversation; this contribution waits on
 * that declaration through the slots inject and disappears with it.
 * @param ctx - Client root context.
 * @param config - Validated plugin configuration (rates, peak window, toggles).
 */
export function apply(ctx, config) {
    const resolved = Config(config ?? {});
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-price: dictionaries');
    const connection = ctx.get('connection');
    // Session-scoped slot: the framework resolves and passes the session id.
    const injectProps = (sessionId) => ({
        config: resolved,
        refreshBalance: async () => {
            const response = await connection.api.llm.balance({});
            if (!response.result.ok) {
                throw new Error(response.result.error.message);
            }
            return response.result.value.balance;
        },
        loadModel: async () => {
            const response = await connection.api.sessions.models({ sessionId });
            if (!response.result.ok)
                return undefined;
            return response.result.value.current;
        },
    });
    ctx.effect(() => ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'price',
        // Negative band: static session context precedes interactive actions
        // (ui-agent-preset's label occupies -10; the chip sits after it).
        order: -5,
        locale: NS,
        inject: injectProps,
    }, PriceBadge)), 'ui-price: header slot');
}
//# sourceMappingURL=index.js.map