/**
 * Plugin configuration: the DeepSeek rate table, the peak/valley window, and
 * display toggles. Rates are deployment-varying list prices, so they are
 * config, never constants — DeepSeek adjusts them without notice and the
 * official page (api-docs.deepseek.com/quick_start/pricing) is the authority.
 */
import Schema from '@deepseek-ai/schemastery';
/**
 * Official DeepSeek V4 off-peak list prices (effective 2026-08-16 16:00 UTC;
 * peak hours 01:00-04:00 and 06:00-10:00 UTC, off-peak at half of peak).
 * These are the defaults; a deployment overrides them in cordis.yml.
 */
export const DEFAULT_RATES = {
    'deepseek-v4-flash': { cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 },
    'deepseek-v4-pro': { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 },
};
const rateSchema = Schema.object({
    cacheHit: Schema.number().default(0.007),
    cacheMiss: Schema.number().default(0.22),
    output: Schema.number().default(0.66),
});
/**
 * Schemastery schema: validates cordis.yml config and fills defaults. The
 * cast bridges Schemastery's tuple widening (tuple members come out optional)
 * to the exact `[number, number]` pair the config contract uses; validation
 * of the pair arity is unchanged.
 */
export const Config = Schema.object({
    rates: Schema.dict(rateSchema).default(DEFAULT_RATES),
    peakHours: Schema.array(Schema.tuple([Schema.number(), Schema.number()])).default([[1, 4], [6, 10]]),
    peakMultiplier: Schema.number().default(2),
    showRegime: Schema.boolean().default(true),
    showModel: Schema.boolean().default(true),
    showCost: Schema.boolean().default(true),
    showBalance: Schema.boolean().default(true),
    pollIntervalMs: Schema.number().default(5 * 60_000),
});
//# sourceMappingURL=config.js.map