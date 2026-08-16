/**
 * Pure pricing arithmetic for the DeepSeek peak/valley ("峰谷") billing scheme:
 * the regime clock, the applicable rate, and the session cost fold. Everything
 * here is a pure function of its inputs so the widget stays a thin renderer
 * and the math stays unit-testable.
 */

import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'
import type { ModelRate } from './config.ts'

/** One pending regime flip at the top of an hour. */
export interface RegimeChange {
  /** The regime that starts at {@link at}. */
  regime: 'peak' | 'valley'
  /** The instant the regime flips (top of the hour, UTC). */
  at: Date
}

/**
 * Whether the given instant falls inside a peak window. Windows are half-open
 * UTC hour ranges ([start, end)); every hour outside them is off-peak — the
 * "valley" the widget names.
 * @param date - the instant to classify.
 * @param windows - half-open UTC hour windows, e.g. [[1, 4], [6, 10]].
 * @returns true when the instant is inside any window.
 */
export function isPeakAt(date: Date, windows: ReadonlyArray<readonly [number, number]>): boolean {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  return windows.some(([start, end]) => {
    if (start === end) return false
    return hour >= start && hour < end
  })
}

/**
 * The next instant the regime flips. Windows are whole-hour half-open ranges,
 * so a flip can only land at the top of an hour; the probe scans at most 26
 * hours (two window sets) and is guaranteed to find one.
 * @param date - the instant to start from.
 * @param windows - peak windows (see {@link isPeakAt}).
 * @returns the regime that starts at the next boundary.
 */
export function nextRegimeChange(date: Date, windows: ReadonlyArray<readonly [number, number]>): RegimeChange {
  const current = isPeakAt(date, windows) ? 'peak' : 'valley'
  for (let offset = 0; offset < 26; offset += 1) {
    const probe = new Date(date)
    probe.setUTCHours(date.getUTCHours() + offset, 0, 0, 0)
    const regime = isPeakAt(probe, windows) ? 'peak' : 'valley'
    if (regime !== current) return { regime, at: probe }
  }
  // Unreachable with sane windows; the daily repetition guarantees a flip.
  return { regime: current === 'peak' ? 'valley' : 'peak', at: new Date(date.getTime() + 24 * 3600_000) }
}

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
export function applicableRate(
  model: string,
  rates: Readonly<Record<string, ModelRate>>,
  windows: ReadonlyArray<readonly [number, number]>,
  peakMultiplier: number,
  date: Date,
): ModelRate | undefined {
  const base = rates[model]
  if (base === undefined) return undefined
  if (!isPeakAt(date, windows)) return base
  return {
    cacheHit: base.cacheHit * peakMultiplier,
    cacheMiss: base.cacheMiss * peakMultiplier,
    output: base.output * peakMultiplier,
  }
}


/**
 * Estimate the USD cost of a session's billed tokens. Buckets are disjoint, so
 * the estimate is the straightforward sum of each bucket times its rate; cache
 * writes bill at the cache-miss rate (DeepSeek publishes no separate
 * cache-write price, and its adapter reports no cache-write metric).
 * @param usage - the session's token-usage projection value.
 * @param rate - the applicable per-1M-token rate.
 * @returns the estimated cost in USD, rounded to two decimals.
 */
export function sessionCostUsd(usage: TokenUsageProjection, rate: ModelRate): number {
  const million = 1_000_000
  const total = usage.uncachedInputTokens / million * rate.cacheMiss
    + usage.cacheWriteTokens / million * rate.cacheMiss
    + usage.cacheReadTokens / million * rate.cacheHit
    + usage.outputTokens / million * rate.output
  return Math.round(total * 100) / 100
}

/**
 * Compact USD amount: two decimals below $100, four below a cent (session
 * costs start small), whole dollars from $100 up.
 * @param value - the amount in USD.
 * @returns the display string with a $ prefix.
 */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '$0.00'
  if (value < 0.01) return `$${value.toFixed(4)}`
  if (value < 100) return `$${Math.round(value * 100) / 100}`
  return `$${Math.round(value)}`
}

/**
 * Compact per-1M-token rate: four decimals below a cent, two above.
 * @param value - the USD per 1M tokens.
 * @returns the display string with a $ prefix.
 */
export function formatRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '$0'
  return value < 0.01 ? `$${value.toFixed(4)}` : `$${Math.round(value * 100) / 100}`
}

/**
 * Compact model label for the header chip: strips the provider-prefixed
 * catalog name ("deepseek-v4-flash" -> "v4-flash") so the chip stays short.
 * @param model - the wire model id.
 * @returns the display label.
 */
export function displayModel(model: string): string {
  const prefix = 'deepseek-'
  return model.startsWith(prefix) ? model.slice(prefix.length) : model
}
