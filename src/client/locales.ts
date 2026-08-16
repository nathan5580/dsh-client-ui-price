/** `price` namespace dictionaries: widget copy. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'price.peak': '高峰',
  'price.offPeak': '谷时',
  'price.sessionCost': '会话费用',
  'price.balance': '剩余余额',
  'price.unavailable': '余额不可用',
  'price.loading': '查询中',
  'price.refresh': '刷新价格与余额',
  'price.rates': '单价（每百万 token）',
  'price.cacheHit': '缓存命中',
  'price.cacheMiss': '缓存未命中',
  'price.output': '输出',
  'price.totalBalance': '总计（含赠送）',
  'price.window': '高峰时段（UTC）',
  'price.nextChange': '下次变更',
} satisfies Record<string, string>

/** The price namespace key union. */
export type PriceKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'price.peak': 'Peak',
  'price.offPeak': 'Valley',
  'price.sessionCost': 'Session cost',
  'price.balance': 'Remaining top-up',
  'price.unavailable': 'Top-up unavailable',
  'price.loading': 'Checking…',
  'price.refresh': 'Refresh pricing and balance',
  'price.rates': 'Rates (per 1M tokens)',
  'price.cacheHit': 'cache hit',
  'price.cacheMiss': 'cache miss',
  'price.output': 'output',
  'price.totalBalance': 'Total (incl. granted)',
  'price.window': 'Peak hours (UTC)',
  'price.nextChange': 'Next change',
} satisfies Record<PriceKey, string>
