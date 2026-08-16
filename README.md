# @deepseek-ai/dsh-client-ui-price

A live DeepSeek billing-status chip for the session header: one compact, colored button beside the session title that shows **whether you are in peak or "valley" (off-peak) hours right now**, the model the session is on with its current per-1M-token rates, the session's accumulated cost, and the remaining top-up. Click it to refresh the balance read; hover for the breakdown.

Peak hours are DeepSeek's official 01:00–04:00 and 06:00–10:00 UTC windows (peak rates are 2× off-peak, effective 2026-08-16; see [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)). The chip is **live**: a one-minute clock flips the color within a minute of the hour boundary, and the tooltip shows the next change.

| Regime | Chip |
|---|---|
| Peak (01:00–04:00 / 06:00–10:00 UTC) | warm red pill with a pulse dot, "Peak" |
| Valley (off-peak, every other hour) | cool green pill, "Valley" |

## Install

One command, then restart dsh:

```sh
dsh plugin --profile web add github:nathan5580/dsh-client-ui-price
dsh web   # the chip appears beside the session title once a session is open
```

The package declares `dsh.bundle`, so `dsh plugin add` wires it into the
profile's layer stack automatically. To use it from a source checkout instead,
run the overlay directly:

```sh
dsh web --patch ./cordis.patch.yml
```

## Configuration

All fields are optional; the defaults are the official DeepSeek V4 off-peak list prices and the official peak windows.

| Field | Default | Meaning |
|---|---|---|
| `rates` | v4-flash / v4-pro off-peak rates | USD per 1M tokens per model: `cacheHit`, `cacheMiss`, `output` |
| `peakHours` | `[[1, 4], [6, 10]]` | Half-open UTC hour windows treated as peak |
| `peakMultiplier` | `2` | Peak rate = off-peak rate × this factor |
| `showRegime` | `true` | Show the colored peak/valley status |
| `showModel` | `true` | Show the current model id |
| `showCost` | `true` | Show the session cost so far |
| `showBalance` | `true` | Show the remaining top-up |
| `pollIntervalMs` | `300000` | Balance refresh cadence |

```yaml
- id: ui-price
  name: '@nathan5580/dsh-client-ui-price'
  config:
    peakHours: [[1, 4], [6, 10]]
    rates:
      deepseek-v4-flash: { cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 }
      deepseek-v4-pro:   { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 }
```

## Data sources

- **Regime**: pure function of the current UTC time against the configured windows (`pricing.ts`, unit-tested at every boundary).
- **Model**: the session's current model selection, served by the host `session.models` RPC (the same authority the composer's model seat renders).
- **Session cost**: the provider-reported token-usage projection (`uncachedInputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `outputTokens`) times the applicable rate. Cache writes bill at the cache-miss rate (DeepSeek publishes no separate cache-write price).
- **Top-up**: the host's `llm.balance` RPC (`GET {baseURL}/user/balance`), polled and refreshable.

The cost is a **reference figure, not a billing record**: the token buckets are exact provider usage, but the rates are list prices you configure, and DeepSeek may adjust them without notice.

## Model Experience

None: the widget renders billing reads and framework projections in the browser; nothing here reaches a model request.

#### KV Cache effect

None: this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **The cost is an estimate** — rates live in config (deployment-owned), so a rate change needs a config edit; token buckets come from the provider's own usage report.
- **Model detection is per-session, last request wins** — a session that switches models prices the whole history at the latest model's rates.
- **The balance read is the host RPC's best effort** — an unreachable or unauthenticated endpoint renders the unavailable state and retries on the next poll.
- **The widget needs `dsh-token-meter`** for the cost segment (the shipped compositions mount it; without it the cost segment hides, exactly like the conversation stats line).

## License

MIT
