import { describe, expect, it } from 'vitest'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'
import { DEFAULT_RATES } from '../src/client/config.ts'
import {
  applicableRate, displayModel, formatRate, formatUsd, isPeakAt, latestModel,
  nextRegimeChange, sessionCostUsd,
} from '../src/client/pricing.ts'

/** The official DeepSeek peak windows: 01:00-04:00 and 06:00-10:00 UTC. */
const WINDOWS: ReadonlyArray<readonly [number, number]> = [[1, 4], [6, 10]]
const utc = (s: string): Date => new Date(s)

describe('isPeakAt', () => {
  it('classifies the official windows as half-open hour ranges', () => {
    expect(isPeakAt(utc('2026-08-16T00:59:59Z'), WINDOWS)).toBe(false)
    expect(isPeakAt(utc('2026-08-16T01:00:00Z'), WINDOWS)).toBe(true)
    expect(isPeakAt(utc('2026-08-16T03:59:59Z'), WINDOWS)).toBe(true)
    expect(isPeakAt(utc('2026-08-16T04:00:00Z'), WINDOWS)).toBe(false)
    expect(isPeakAt(utc('2026-08-16T05:59:59Z'), WINDOWS)).toBe(false)
    expect(isPeakAt(utc('2026-08-16T06:00:00Z'), WINDOWS)).toBe(true)
    expect(isPeakAt(utc('2026-08-16T09:59:59Z'), WINDOWS)).toBe(true)
    expect(isPeakAt(utc('2026-08-16T10:00:00Z'), WINDOWS)).toBe(false)
    expect(isPeakAt(utc('2026-08-16T23:59:59Z'), WINDOWS)).toBe(false)
  })

  it('honors custom windows', () => {
    expect(isPeakAt(utc('2026-08-16T12:00:00Z'), [[12, 14]])).toBe(true)
    expect(isPeakAt(utc('2026-08-16T11:59:59Z'), [[12, 14]])).toBe(false)
  })

  it('treats an empty window list as always valley', () => {
    expect(isPeakAt(utc('2026-08-16T02:00:00Z'), [])).toBe(false)
  })
})

describe('nextRegimeChange', () => {
  it('finds the next boundary inside a peak window', () => {
    const next = nextRegimeChange(utc('2026-08-16T01:30:00Z'), WINDOWS)
    expect(next.regime).toBe('valley')
    expect(next.at.toISOString()).toBe('2026-08-16T04:00:00.000Z')
  })

  it('finds the next boundary before the first peak window', () => {
    const next = nextRegimeChange(utc('2026-08-16T00:30:00Z'), WINDOWS)
    expect(next.regime).toBe('peak')
    expect(next.at.toISOString()).toBe('2026-08-16T01:00:00.000Z')
  })

  it('finds the next boundary after the last peak window (next day)', () => {
    const next = nextRegimeChange(utc('2026-08-16T11:00:00Z'), WINDOWS)
    expect(next.regime).toBe('peak')
    expect(next.at.toISOString()).toBe('2026-08-17T01:00:00.000Z')
  })

  it('reports the regime that starts at an exact boundary', () => {
    const next = nextRegimeChange(utc('2026-08-16T04:00:00Z'), WINDOWS)
    expect(next.regime).toBe('peak')
    expect(next.at.toISOString()).toBe('2026-08-16T06:00:00.000Z')
  })
})

describe('applicableRate', () => {
  it('returns the off-peak table entry outside peak hours', () => {
    const rate = applicableRate('deepseek-v4-flash', DEFAULT_RATES, WINDOWS, 2, utc('2026-08-16T12:00:00Z'))
    expect(rate).toEqual(DEFAULT_RATES['deepseek-v4-flash'])
  })

  it('applies the peak multiplier inside peak hours', () => {
    const rate = applicableRate('deepseek-v4-flash', DEFAULT_RATES, WINDOWS, 2, utc('2026-08-16T02:00:00Z'))
    expect(rate).toEqual({ cacheHit: 0.014, cacheMiss: 0.44, output: 1.32 })
  })

  it('returns undefined for an unlisted model', () => {
    expect(applicableRate('gpt-5', DEFAULT_RATES, WINDOWS, 2, utc('2026-08-16T02:00:00Z'))).toBeUndefined()
  })
})

describe('sessionCostUsd', () => {
  const usage: TokenUsageProjection = {
    uncachedInputTokens: 1_000_000,
    outputTokens: 500_000,
    cacheReadTokens: 1_000_000,
    cacheWriteTokens: 1_000_000,
  }

  it('sums each bucket at its rate', () => {
    // 0.22 (uncached) + 0.33 (output) + 0.007 (cache read) + 0.22 (cache write) = 0.777 -> 0.78
    expect(sessionCostUsd(usage, { cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 })).toBe(0.78)
  })

  it('is zero for an empty log', () => {
    expect(sessionCostUsd(
      { uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      { cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 },
    )).toBe(0)
  })
})

describe('latestModel', () => {
  it('returns the last completed request provenance', () => {
    expect(latestModel([
      { provenance: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } },
      { provenance: { provider: 'deepseek-official', model: 'deepseek-v4-pro' } },
    ])).toEqual({ provider: 'deepseek-official', model: 'deepseek-v4-pro' })
  })

  it('skips nodes without provenance', () => {
    expect(latestModel([{}, { provenance: { provider: 'p', model: 'm' } }]))
      .toEqual({ provider: 'p', model: 'm' })
  })

  it('returns undefined for an empty list', () => {
    expect(latestModel([])).toBeUndefined()
  })
})

describe('formatUsd / formatRate / displayModel', () => {
  it('formats amounts by magnitude', () => {
    expect(formatUsd(0)).toBe('$0.00')
    expect(formatUsd(0.007)).toBe('$0.0070')
    expect(formatUsd(0.5)).toBe('$0.5')
    expect(formatUsd(123.4)).toBe('$123')
  })

  it('formats per-1M rates compactly', () => {
    expect(formatRate(0.007)).toBe('$0.0070')
    expect(formatRate(0.22)).toBe('$0.22')
    expect(formatRate(1.32)).toBe('$1.32')
  })

  it('strips the deepseek- prefix from model ids', () => {
    expect(displayModel('deepseek-v4-flash')).toBe('v4-flash')
    expect(displayModel('other')).toBe('other')
  })
})
