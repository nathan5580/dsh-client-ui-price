window.__ModuleLoader__.load({
	id: "@nathan5580/dsh-client-ui-price",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/pricing.ts
		/**
		* Whether the given instant falls inside a peak window. Windows are half-open
		* UTC hour ranges ([start, end)); every hour outside them is off-peak — the
		* "valley" the widget names.
		* @param date - the instant to classify.
		* @param windows - half-open UTC hour windows, e.g. [[1, 4], [6, 10]].
		* @returns true when the instant is inside any window.
		*/
		function isPeakAt(date, windows) {
			const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
			return windows.some(([start, end]) => {
				if (start === end) return false;
				return hour >= start && hour < end;
			});
		}
		/**
		* The next instant the regime flips. Windows are whole-hour half-open ranges,
		* so a flip can only land at the top of an hour; the probe scans at most 26
		* hours (two window sets) and is guaranteed to find one.
		* @param date - the instant to start from.
		* @param windows - peak windows (see {@link isPeakAt}).
		* @returns the regime that starts at the next boundary.
		*/
		function nextRegimeChange(date, windows) {
			const current = isPeakAt(date, windows) ? "peak" : "valley";
			for (let offset = 0; offset < 26; offset += 1) {
				const probe = new Date(date);
				probe.setUTCHours(date.getUTCHours() + offset, 0, 0, 0);
				const regime = isPeakAt(probe, windows) ? "peak" : "valley";
				if (regime !== current) return {
					regime,
					at: probe
				};
			}
			return {
				regime: current === "peak" ? "valley" : "peak",
				at: new Date(date.getTime() + 24 * 36e5)
			};
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
		function applicableRate(model, rates, windows, peakMultiplier, date) {
			const base = rates[model];
			if (base === void 0) return void 0;
			if (!isPeakAt(date, windows)) return base;
			return {
				cacheHit: base.cacheHit * peakMultiplier,
				cacheMiss: base.cacheMiss * peakMultiplier,
				output: base.output * peakMultiplier
			};
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
		function sessionCostUsd(usage, rate) {
			const million = 1e6;
			const total = usage.uncachedInputTokens / million * rate.cacheMiss + usage.cacheWriteTokens / million * rate.cacheMiss + usage.cacheReadTokens / million * rate.cacheHit + usage.outputTokens / million * rate.output;
			return Math.round(total * 100) / 100;
		}
		/**
		* Compact USD amount: two decimals below $100, four below a cent (session
		* costs start small), whole dollars from $100 up.
		* @param value - the amount in USD.
		* @returns the display string with a $ prefix.
		*/
		function formatUsd(value) {
			if (!Number.isFinite(value) || value <= 0) return "$0.00";
			if (value < .01) return `$${value.toFixed(4)}`;
			if (value < 100) return `$${Math.round(value * 100) / 100}`;
			return `$${Math.round(value)}`;
		}
		/**
		* Compact per-1M-token rate: four decimals below a cent, two above.
		* @param value - the USD per 1M tokens.
		* @returns the display string with a $ prefix.
		*/
		function formatRate(value) {
			if (!Number.isFinite(value) || value <= 0) return "$0";
			return value < .01 ? `$${value.toFixed(4)}` : `$${Math.round(value * 100) / 100}`;
		}
		/**
		* Compact model label for the header chip: strips the provider-prefixed
		* catalog name ("deepseek-v4-flash" -> "v4-flash") so the chip stays short.
		* @param model - the wire model id.
		* @returns the display label.
		*/
		function displayModel(model) {
			return model.startsWith("deepseek-") ? model.slice(9) : model;
		}
		//#endregion
		//#region \0dsh-css:/Users/home/RiderProjects/dsh/packages/client/ui-price/src/client/PriceBadge.module.css.mjs
		const css = "._4u853a_chip{border:1px solid var(--dsh-price-border,#7f7f7f4d);height:20px;color:var(--dsh-color-text-secondary,#7f7f7fe6);white-space:nowrap;cursor:pointer;background:0 0;border-radius:999px;align-items:center;gap:5px;padding:0 8px;font-size:11px;line-height:1;transition:color .2s,border-color .2s,background .2s;display:inline-flex}._4u853a_chip[data-regime=peak]{color:var(--dsh-price-peak,#ff9d4d);border-color:var(--dsh-price-peak-border,#ff9d4d8c);background:var(--dsh-price-peak-bg,#ff9d4d1a)}._4u853a_chip[data-regime=valley]{color:var(--dsh-price-valley,#58c08a);border-color:var(--dsh-price-valley-border,#58c08a8c);background:var(--dsh-price-valley-bg,#58c08a1a)}._4u853a_chip:hover{filter:brightness(1.1)}._4u853a_dot{background:currentColor;border-radius:50%;width:6px;height:6px;animation:2s ease-in-out infinite _4u853a_pricePulse}@keyframes _4u853a_pricePulse{0%,to{opacity:1}50%{opacity:.3}}._4u853a_status{font-weight:600}._4u853a_meta{align-items:center;gap:5px;max-width:260px;display:inline-flex;overflow:hidden}._4u853a_model{opacity:.85}._4u853a_badge{white-space:nowrap;border-radius:6px;align-items:center;gap:2px;padding:1px 5px;font-weight:600;display:inline-flex}._4u853a_badge[data-kind=cost]{color:var(--dsh-price-cost,#e0a63e);background:var(--dsh-price-cost-bg,#e0a63e24)}._4u853a_badge[data-kind=balance]{color:var(--dsh-price-balance,#4db6e8);background:var(--dsh-price-balance-bg,#4db6e824)}";
		const tagId = "@nathan5580/dsh-client-ui-price/PriceBadge.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@nathan5580/dsh-client-ui-price";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PriceBadge_module_css_default = {
			"dot": "_4u853a_dot",
			"meta": "_4u853a_meta",
			"badge": "_4u853a_badge",
			"pricePulse": "_4u853a_pricePulse",
			"chip": "_4u853a_chip",
			"status": "_4u853a_status",
			"model": "_4u853a_model"
		};
		//#endregion
		//#region src/client/PriceBadge.tsx
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
		/** Regime clock tick: the peak/valley classification flips at hour boundaries. */
		const CLOCK_INTERVAL_MS = 6e4;
		/** Prefer the first USD bucket, then the first bucket overall. */
		function pickBalance(balance) {
			const bucket = balance.balances.find((b) => b.currency === "USD") ?? balance.balances[0];
			if (bucket === void 0) return null;
			return {
				currency: bucket.currency,
				toppedUp: Number.parseFloat(bucket.toppedUpBalance),
				total: Number.parseFloat(bucket.totalBalance)
			};
		}
		/** Compact money for the chip: 3.4 / 12.5 / 110 (no thousands separators). */
		function formatAmount(value) {
			if (Number.isNaN(value)) return "0";
			if (value >= 100) return String(Math.round(value));
			return String(Math.round(value * 10) / 10);
		}
		/**
		* Render this session's live pricing status beside its title.
		* @param props - composed slot props.
		* @returns the chip, or null when every display segment is disabled.
		*/
		const PriceBadge = (0, react.memo)(function PriceBadge({ sessionId, useProjection, config, refreshBalance, loadModel, t }) {
			const usage = useProjection === void 0 ? void 0 : useProjection("tokenUsage");
			const [now, setNow] = (0, react.useState)(() => /* @__PURE__ */ new Date());
			const [balance, setBalance] = (0, react.useState)({ kind: "loading" });
			const [model, setModel] = (0, react.useState)();
			const refreshRef = (0, react.useRef)(refreshBalance);
			refreshRef.current = refreshBalance;
			(0, react.useEffect)(() => {
				const timer = setInterval(() => {
					setNow(/* @__PURE__ */ new Date());
				}, CLOCK_INTERVAL_MS);
				return () => {
					clearInterval(timer);
				};
			}, []);
			const refresh = (0, react.useCallback)(async () => {
				try {
					const picked = pickBalance(await refreshRef.current());
					if (picked === null) {
						setBalance({ kind: "error" });
						return;
					}
					setBalance({
						kind: "ready",
						...picked
					});
				} catch {
					setBalance({ kind: "error" });
				}
			}, []);
			(0, react.useEffect)(() => {
				if (!config.showBalance) return;
				refresh();
				const timer = setInterval(() => {
					refresh();
				}, config.pollIntervalMs);
				return () => {
					clearInterval(timer);
				};
			}, [
				config.showBalance,
				config.pollIntervalMs,
				refresh
			]);
			const reloadModel = (0, react.useCallback)(() => {
				loadModel().then((next) => {
					setModel(next);
				});
			}, [loadModel]);
			(0, react.useEffect)(() => {
				if (!config.showModel) return;
				reloadModel();
			}, [
				config.showModel,
				reloadModel,
				sessionId
			]);
			const modelId = model !== void 0 && typeof model.model === "string" && model.model.length > 0 ? model.model : void 0;
			const peak = isPeakAt(now, config.peakHours);
			const next = (0, react.useMemo)(() => nextRegimeChange(now, config.peakHours), [now, config.peakHours]);
			const minutesToChange = Math.max(0, Math.ceil((next.at.getTime() - now.getTime()) / 6e4));
			const rate = (0, react.useMemo)(() => modelId === void 0 ? void 0 : applicableRate(modelId, config.rates, config.peakHours, config.peakMultiplier, now), [
				modelId,
				config,
				now
			]);
			const cost = usage !== void 0 && rate !== void 0 ? sessionCostUsd(usage, rate) : null;
			if (!config.showRegime && !config.showModel && !config.showCost && !config.showBalance) return null;
			const tooltipParts = [];
			if (config.showRegime) {
				tooltipParts.push(t(peak ? "price.peak" : "price.offPeak") + " · " + t("price.window") + ": " + config.peakHours.map(([start, end]) => start + ":00–" + end + ":00").join(" / "));
				tooltipParts.push(t("price.nextChange") + ": " + next.at.toISOString().slice(11, 16) + " UTC (~" + minutesToChange + " min)");
			}
			if (config.showModel && modelId !== void 0) tooltipParts.push(rate === void 0 ? modelId + " (" + t("price.rates") + ": —)" : modelId + " · " + t("price.rates") + ": " + t("price.cacheMiss") + " " + formatRate(rate.cacheMiss) + " · " + t("price.cacheHit") + " " + formatRate(rate.cacheHit) + " · " + t("price.output") + " " + formatRate(rate.output));
			if (config.showCost) tooltipParts.push(cost === null ? t("price.sessionCost") + ": —" : t("price.sessionCost") + ": " + formatUsd(cost));
			if (config.showBalance) {
				if (balance.kind === "ready") tooltipParts.push(t("price.balance") + ": " + formatAmount(balance.toppedUp) + " " + balance.currency + " (" + t("price.totalBalance") + ": " + formatAmount(balance.total) + ")");
				else if (balance.kind === "error") tooltipParts.push(t("price.unavailable"));
			}
			const metaNodes = [];
			const metaText = [];
			if (config.showModel && modelId !== void 0) {
				metaNodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: PriceBadge_module_css_default.model,
					children: displayModel(modelId)
				}, "model"));
				metaText.push(displayModel(modelId));
			}
			if (config.showCost && cost !== null) {
				metaNodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: PriceBadge_module_css_default.badge,
					"data-kind": "cost",
					title: t("price.sessionCost") + ": " + formatUsd(cost),
					children: ["Σ ", formatUsd(cost)]
				}, "cost"));
				metaText.push(formatUsd(cost));
			}
			if (config.showBalance) {
				if (balance.kind === "ready") {
					metaNodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: PriceBadge_module_css_default.badge,
						"data-kind": "balance",
						title: t("price.balance") + ": " + formatAmount(balance.toppedUp) + " " + balance.currency,
						children: [
							"↑",
							formatAmount(balance.toppedUp),
							balance.currency
						]
					}, "balance"));
					metaText.push("↑" + formatAmount(balance.toppedUp) + balance.currency);
				} else if (balance.kind === "error") {
					metaNodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: PriceBadge_module_css_default.badge,
						"data-kind": "balance",
						children: "· · ·"
					}, "balance"));
					metaText.push("· · ·");
				}
			}
			const label = [config.showRegime ? t(peak ? "price.peak" : "price.offPeak") : null, metaText.length > 0 ? metaText.join(" · ") : null].filter(Boolean).join(" · ");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: tooltipParts.join(" · "),
				delayMs: 500,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: PriceBadge_module_css_default.chip,
					"data-regime": peak ? "peak" : "valley",
					onClick: () => {
						refresh();
						if (config.showModel) reloadModel();
					},
					"aria-label": label,
					title: label,
					children: [
						config.showRegime && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: PriceBadge_module_css_default.dot,
							"aria-hidden": true
						}),
						config.showRegime && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: PriceBadge_module_css_default.status,
							children: t(peak ? "price.peak" : "price.offPeak")
						}),
						metaNodes.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: PriceBadge_module_css_default.meta,
							children: metaNodes
						})
					]
				})
			});
		});
		//#endregion
		//#region src/client/locales.ts
		/** `price` namespace dictionaries: widget copy. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"price.peak": "高峰",
			"price.offPeak": "谷时",
			"price.sessionCost": "会话费用",
			"price.balance": "剩余余额",
			"price.unavailable": "余额不可用",
			"price.loading": "查询中",
			"price.refresh": "刷新价格与余额",
			"price.rates": "单价（每百万 token）",
			"price.cacheHit": "缓存命中",
			"price.cacheMiss": "缓存未命中",
			"price.output": "输出",
			"price.totalBalance": "总计（含赠送）",
			"price.window": "高峰时段（UTC）",
			"price.nextChange": "下次变更"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"price.peak": "Peak",
			"price.offPeak": "Valley",
			"price.sessionCost": "Session cost",
			"price.balance": "Remaining top-up",
			"price.unavailable": "Top-up unavailable",
			"price.loading": "Checking…",
			"price.refresh": "Refresh pricing and balance",
			"price.rates": "Rates (per 1M tokens)",
			"price.cacheHit": "cache hit",
			"price.cacheMiss": "cache miss",
			"price.output": "output",
			"price.totalBalance": "Total (incl. granted)",
			"price.window": "Peak hours (UTC)",
			"price.nextChange": "Next change"
		};
		//#endregion
		//#region ../../../vendor/cosmokit/src/misc.ts
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		//#endregion
		//#region ../../../vendor/cosmokit/src/types.ts
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		let Binary;
		(function(_Binary) {
			_Binary.is = isArrayBufferLike;
			_Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			_Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			_Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			_Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			_Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			_Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		//#endregion
		//#region ../../../vendor/cosmokit/src/time.ts
		let Time;
		(function(_Time) {
			_Time.millisecond = 1;
			const second = _Time.second = 1e3;
			const minute = _Time.minute = second * 60;
			const hour = _Time.hour = minute * 60;
			const day = _Time.day = hour * 24;
			const week = _Time.week = day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			_Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			_Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / minute - offset) / 1440);
			}
			_Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * minute);
			}
			_Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * week || 0) + (parseFloat(capture[2]) * day || 0) + (parseFloat(capture[3]) * hour || 0) + (parseFloat(capture[4]) * minute || 0) + (parseFloat(capture[5]) * second || 0);
			}
			_Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			_Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= day - hour / 2) return Math.round(ms / day) + "d";
				else if (abs >= hour - minute / 2) return Math.round(ms / hour) + "h";
				else if (abs >= minute - second / 2) return Math.round(ms / minute) + "m";
				else if (abs >= second) return Math.round(ms / second) + "s";
				return ms + "ms";
			}
			_Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			_Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			_Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region ../../../vendor/schemastery/src/index.ts
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
		//#endregion
		//#region src/client/config.ts
		/**
		* Plugin configuration: the DeepSeek rate table, the peak/valley window, and
		* display toggles. Rates are deployment-varying list prices, so they are
		* config, never constants — DeepSeek adjusts them without notice and the
		* official page (api-docs.deepseek.com/quick_start/pricing) is the authority.
		*/
		/**
		* Official DeepSeek V4 off-peak list prices (effective 2026-08-16 16:00 UTC;
		* peak hours 01:00-04:00 and 06:00-10:00 UTC, off-peak at half of peak).
		* These are the defaults; a deployment overrides them in cordis.yml.
		*/
		const DEFAULT_RATES = {
			"deepseek-v4-flash": {
				cacheHit: .007,
				cacheMiss: .22,
				output: .66
			},
			"deepseek-v4-pro": {
				cacheHit: .022,
				cacheMiss: .66,
				output: 1.98
			}
		};
		const rateSchema = Schema.object({
			cacheHit: Schema.number().default(.007),
			cacheMiss: Schema.number().default(.22),
			output: Schema.number().default(.66)
		});
		/**
		* Schemastery schema: validates cordis.yml config and fills defaults. The
		* cast bridges Schemastery's tuple widening (tuple members come out optional)
		* to the exact `[number, number]` pair the config contract uses; validation
		* of the pair arity is unchanged.
		*/
		const Config = Schema.object({
			rates: Schema.dict(rateSchema).default(DEFAULT_RATES),
			peakHours: Schema.array(Schema.tuple([Schema.number(), Schema.number()])).default([[1, 4], [6, 10]]),
			peakMultiplier: Schema.number().default(2),
			showRegime: Schema.boolean().default(true),
			showModel: Schema.boolean().default(true),
			showCost: Schema.boolean().default(true),
			showBalance: Schema.boolean().default(true),
			pollIntervalMs: Schema.number().default(5 * 6e4)
		});
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin (widget copy). */
		const NS = "price";
		/** Services required by the price widget plugin. */
		const inject = [
			"slots",
			"locale",
			"connection"
		];
		/**
		* Register the pricing chip into the session header's title-adjacent action
		* list. The seat is declared by ui-conversation; this contribution waits on
		* that declaration through the slots inject and disappears with it.
		* @param ctx - Client root context.
		* @param config - Validated plugin configuration (rates, peak window, toggles).
		*/
		function apply(ctx, config) {
			const resolved = Config(config ?? {});
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-price: dictionaries");
			const connection = ctx.get("connection");
			const injectProps = (sessionId) => ({
				config: resolved,
				refreshBalance: async () => {
					const response = await connection.api.llm.balance({});
					if (!response.result.ok) throw new Error(response.result.error.message);
					return response.result.value.balance;
				},
				loadModel: async () => {
					const response = await connection.api.sessions.models({ sessionId });
					if (!response.result.ok) return void 0;
					return response.result.value.current;
				}
			});
			ctx.effect(() => ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "price",
				order: -5,
				locale: NS,
				inject: injectProps
			}, PriceBadge)), "ui-price: header slot");
		}
		//#endregion
		exports.applicableRate = applicableRate;
		exports.apply = apply;
		exports.displayModel = displayModel;
		exports.formatRate = formatRate;
		exports.formatUsd = formatUsd;
		exports.inject = inject;
		exports.isPeakAt = isPeakAt;
		exports.nextRegimeChange = nextRegimeChange;
		exports.sessionCostUsd = sessionCostUsd;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map