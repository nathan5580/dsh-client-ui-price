/**
 * The session-header pricing chip: one compact, colored button beside the
 * session title whose live status is the DeepSeek billing regime — "peak"
 * (01:00-04:00 / 06:00-10:00 UTC, hot red) or "valley" (off-peak, cool green).
 * The regime flips within a minute of the hour boundary, and the tooltip adds
 * the next change, the current model's live per-1M rates, the accumulated
 * session cost, and the remaining top-up. Clicking refreshes the balance read.
 *
 * Data rides the framework seats only: the token-usage projection (provider
 * billed buckets), the conversation snapshot (request provenance), and the
 * injected balance RPC. No model request, no wire reads beyond the balance.
 */
import type { PriceBadgeComponentProps } from './contract/slots.ts';
/**
 * Render this session's live pricing status beside its title.
 * @param props - composed slot props.
 * @returns the chip, or null when every display segment is disabled.
 */
export declare const PriceBadge: import("react").MemoExoticComponent<({ sessionId, useProjection, config, refreshBalance, loadModel, t, }: PriceBadgeComponentProps) => import("react").JSX.Element | null>;
//# sourceMappingURL=PriceBadge.d.ts.map