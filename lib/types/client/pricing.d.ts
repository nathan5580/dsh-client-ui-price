/**
 * Pure pricing arithmetic for the DeepSeek peak/valley ("峰谷") billing scheme:
 * the regime clock, the applicable rate, and the session cost fold. Everything
 * here is a pure function of its inputs so the widget stays a thin renderer
 * and the math stays unit-testable.
 */
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client';
import type { ModelRate } from './config.ts';
/** One pending regime flip at the top of an hour. */
export interface RegimeChange {
    /** The regime that starts at {@link at}. */
    regime: 'peak' | 'valley';
    /** The instant the regime flips (top of the hour, UTC). */
    at: Date;
}
/**
 * Whether the given instant falls inside a peak window. Windows are half-open
 * UTC hour ranges ([start, end)); every hour outside them is off-peak — the
 * "valley" the widget names.
 * @param date - the instant to classify.
 * @param windows - half-open UTC hour windows, e.g. [[1, 4], [6, 10]].
 * @returns true when the instant is inside any window.
 */
export declare function isPeakAt(date: Date, windows: ReadonlyArray<readonly [number, number]>): boolean;
/**
 * The next instant the regime flips. Windows are whole-hour half-open ranges,
 * so a flip can only land at the top of an hour; the probe scans at most 26
 * hours (two window sets) and is guaranteed to find one.
 * @param date - the instant to start from.
 * @param windows - peak windows (see {@link isPeakAt}).
 * @returns the regime that starts at the next boundary.
 */
export declare function nextRegimeChange(date: Date, windows: ReadonlyArray<readonly [number, number]>): RegimeChange;
/**
 * The rate that applies to one model at one instant: the off-peak table entry,
 * or it multiplied by the peak factor while the instant is inside a peak
 * window.
 * @param model - the wire model id.
 * @param rates - the configured off-peak rate table.
 * @param windows - peak windows (see {@link isPeakAt}).
 * @param peakMultiplier - peak factor applied to off-peak rates.
 * @param date - the instant to classify.
 * @returns the applicable rate, or undefined when the model is unlisted.
 */
export declare function applicableRate(model: string, rates: Readonly<Record<string, ModelRate>>, windows: ReadonlyArray<readonly [number, number]>, peakMultiplier: number, date: Date): ModelRate | undefined;
/**
 * Estimate the USD cost of a session's billed tokens. Buckets are disjoint, so
 * the estimate is the straightforward sum of each bucket times its rate; cache
 * writes bill at the cache-miss rate (DeepSeek publishes no separate
 * cache-write price, and its adapter reports no cache-write metric).
 * @param usage - the session's token-usage projection value.
 * @param rate - the applicable per-1M-token rate.
 * @returns the estimated cost in USD, rounded to two decimals.
 */
export declare function sessionCostUsd(usage: TokenUsageProjection, rate: ModelRate): number;
/**
 * Compact USD amount: two decimals below $100, four below a cent (session
 * costs start small), whole dollars from $100 up.
 * @param value - the amount in USD.
 * @returns the display string with a $ prefix.
 */
export declare function formatUsd(value: number): string;
/**
 * Compact per-1M-token rate: four decimals below a cent, two above.
 * @param value - the USD per 1M tokens.
 * @returns the display string with a $ prefix.
 */
export declare function formatRate(value: number): string;
/**
 * Compact model label for the header chip: strips the provider-prefixed
 * catalog name ("deepseek-v4-flash" -> "v4-flash") so the chip stays short.
 * @param model - the wire model id.
 * @returns the display label.
 */
export declare function displayModel(model: string): string;
//# sourceMappingURL=pricing.d.ts.map