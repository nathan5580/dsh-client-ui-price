import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { applicableRate, displayModel, formatRate, formatUsd, isPeakAt, nextRegimeChange, sessionCostUsd, } from "./pricing.js";
import css from './PriceBadge.module.css';
/** Regime clock tick: the peak/valley classification flips at hour boundaries. */
const CLOCK_INTERVAL_MS = 60_000;
/** Prefer the first USD bucket, then the first bucket overall. */
function pickBalance(balance) {
    const bucket = balance.balances.find(b => b.currency === 'USD') ?? balance.balances[0];
    if (bucket === undefined)
        return null;
    return {
        currency: bucket.currency,
        toppedUp: Number.parseFloat(bucket.toppedUpBalance),
        total: Number.parseFloat(bucket.totalBalance),
    };
}
/** Compact money for the chip: 3.4 / 12.5 / 110 (no thousands separators). */
function formatAmount(value) {
    if (Number.isNaN(value))
        return '0';
    if (value >= 100)
        return String(Math.round(value));
    return String(Math.round(value * 10) / 10);
}
/**
 * Render this session's live pricing status beside its title.
 * @param props - composed slot props.
 * @returns the chip, or null when every display segment is disabled.
 */
export const PriceBadge = memo(function PriceBadge({ sessionId, useProjection, config, refreshBalance, loadModel, t, }) {
    const usage = useProjection === undefined ? undefined : useProjection('tokenUsage');
    const [now, setNow] = useState(() => new Date());
    const [balance, setBalance] = useState({ kind: 'loading' });
    const [model, setModel] = useState();
    const refreshRef = useRef(refreshBalance);
    refreshRef.current = refreshBalance;
    useEffect(() => {
        const timer = setInterval(() => { setNow(new Date()); }, CLOCK_INTERVAL_MS);
        return () => { clearInterval(timer); };
    }, []);
    const refresh = useCallback(async () => {
        try {
            const view = await refreshRef.current();
            const picked = pickBalance(view);
            if (picked === null) {
                setBalance({ kind: 'error' });
                return;
            }
            setBalance({ kind: 'ready', ...picked });
        }
        catch {
            setBalance({ kind: 'error' });
        }
    }, []);
    useEffect(() => {
        if (!config.showBalance)
            return;
        void refresh();
        const timer = setInterval(() => { void refresh(); }, config.pollIntervalMs);
        return () => { clearInterval(timer); };
    }, [config.showBalance, config.pollIntervalMs, refresh]);
    // The session's model selection rides the host session.models RPC (the same
    // authority the composer's model seat renders); reload on session change and
    // on click together with the balance.
    const reloadModel = useCallback(() => {
        void loadModel().then(next => { setModel(next); });
    }, [loadModel]);
    useEffect(() => {
        if (!config.showModel)
            return;
        reloadModel();
    }, [config.showModel, reloadModel, sessionId]);
    const modelId = model !== undefined && typeof model.model === 'string' && model.model.length > 0 ? model.model : undefined;
    const peak = isPeakAt(now, config.peakHours);
    const next = useMemo(() => nextRegimeChange(now, config.peakHours), [now, config.peakHours]);
    const minutesToChange = Math.max(0, Math.ceil((next.at.getTime() - now.getTime()) / 60_000));
    const rate = useMemo(() => modelId === undefined
        ? undefined
        : applicableRate(modelId, config.rates, config.peakHours, config.peakMultiplier, now), [modelId, config, now]);
    const cost = usage !== undefined && rate !== undefined ? sessionCostUsd(usage, rate) : null;
    if (!config.showRegime && !config.showModel && !config.showCost && !config.showBalance)
        return null;
    const tooltipParts = [];
    if (config.showRegime) {
        tooltipParts.push(t(peak ? 'price.peak' : 'price.offPeak')
            + ' · ' + t('price.window') + ': ' + config.peakHours.map(([start, end]) => start + ':00–' + end + ':00').join(' / '));
        tooltipParts.push(t('price.nextChange') + ': ' + next.at.toISOString().slice(11, 16) + ' UTC (~' + minutesToChange + ' min)');
    }
    if (config.showModel && modelId !== undefined) {
        tooltipParts.push(rate === undefined
            ? modelId + ' (' + t('price.rates') + ': —)'
            : modelId + ' · ' + t('price.rates') + ': ' + t('price.cacheMiss') + ' ' + formatRate(rate.cacheMiss)
                + ' · ' + t('price.cacheHit') + ' ' + formatRate(rate.cacheHit)
                + ' · ' + t('price.output') + ' ' + formatRate(rate.output));
    }
    if (config.showCost) {
        tooltipParts.push(cost === null ? t('price.sessionCost') + ': —' : t('price.sessionCost') + ': ' + formatUsd(cost));
    }
    if (config.showBalance) {
        if (balance.kind === 'ready') {
            tooltipParts.push(t('price.balance') + ': ' + formatAmount(balance.toppedUp) + ' ' + balance.currency
                + ' (' + t('price.totalBalance') + ': ' + formatAmount(balance.total) + ')');
        }
        else if (balance.kind === 'error') {
            tooltipParts.push(t('price.unavailable'));
        }
    }
    // Distinct, labelled meta segments: the model stays plain text while the
    // session cost and the top-up render as separate tinted badges (amber for
    // money spent, cyan for money available), each carrying its own glyph.
    const metaNodes = [];
    const metaText = [];
    if (config.showModel && modelId !== undefined) {
        metaNodes.push(_jsx("span", { className: css.model, children: displayModel(modelId) }, "model"));
        metaText.push(displayModel(modelId));
    }
    if (config.showCost && cost !== null) {
        metaNodes.push(_jsxs("span", { className: css.badge, "data-kind": "cost", title: t('price.sessionCost') + ': ' + formatUsd(cost), children: ["\u03A3 ", formatUsd(cost)] }, "cost"));
        metaText.push(formatUsd(cost));
    }
    if (config.showBalance) {
        if (balance.kind === 'ready') {
            metaNodes.push(_jsxs("span", { className: css.badge, "data-kind": "balance", title: t('price.balance') + ': ' + formatAmount(balance.toppedUp) + ' ' + balance.currency, children: ["\u2191", formatAmount(balance.toppedUp), balance.currency] }, "balance"));
            metaText.push('↑' + formatAmount(balance.toppedUp) + balance.currency);
        }
        else if (balance.kind === 'error') {
            metaNodes.push(_jsx("span", { className: css.badge, "data-kind": "balance", children: "\u00B7 \u00B7 \u00B7" }, "balance"));
            metaText.push('· · ·');
        }
    }
    const label = [
        config.showRegime ? t(peak ? 'price.peak' : 'price.offPeak') : null,
        metaText.length > 0 ? metaText.join(' · ') : null,
    ].filter(Boolean).join(' · ');
    return (_jsx(Tooltip, { label: tooltipParts.join(' · '), delayMs: 500, children: _jsxs("button", { type: "button", className: css.chip, "data-regime": peak ? 'peak' : 'valley', onClick: () => { void refresh(); if (config.showModel)
                reloadModel(); }, "aria-label": label, title: label, children: [config.showRegime && _jsx("span", { className: css.dot, "aria-hidden": true }), config.showRegime && _jsx("span", { className: css.status, children: t(peak ? 'price.peak' : 'price.offPeak') }), metaNodes.length > 0 && _jsx("span", { className: css.meta, children: metaNodes })] }) }));
});
//# sourceMappingURL=PriceBadge.js.map