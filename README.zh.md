# @nathan5580/dsh-client-ui-price

会话标题旁的一枚实时 DeepSeek 计费状态徽章：一个紧凑的彩色按钮，显示**当前是否处于高峰时段或“谷时”（闲时）**、本会话所用模型及其现行每百万 token 单价、会话累计费用以及剩余余额。点击可刷新余额；悬停查看明细。

高峰时段为 DeepSeek 官方窗口 01:00–04:00 与 06:00–10:00（UTC）（高峰价格为闲时的 2 倍，2026-08-16 起生效，见 [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)）。徽章**实时更新**：一分钟一次的时钟会在整点边界后一分钟内翻转颜色，提示中还会显示下次变更时间。

| 时段 | 徽章 |
|---|---|
| 高峰（01:00–04:00 / 06:00–10:00 UTC） | 暖红色胶囊加脉冲圆点，“高峰” |
| 谷时（其余所有小时） | 冷绿色胶囊，“谷时” |

## 安装

本组件是纯浏览器端客户端插件，无需宿主代码。

### 作为 overlay 覆盖层

```sh
dsh web --patch node_modules/@nathan5580/dsh-client-ui-price/cordis.patch.yml
```

仓库内调试：

```sh
pnpm dsh web --patch packages/client/ui-price/cordis.patch.yml
```

### 作为 profile bundle（持久生效）

将本包加入 profile 依赖，并在 profile 清单的 `dsh.profile.bundles` 中声明；其 `dsh.bundle.patch` 会在该 profile 每次启动时插入 `ui-price` 配置行。

### 通过 npm / GitHub

```sh
npm install @nathan5580/dsh-client-ui-price
# 或直接从公开仓库安装
npm install github:nathan5580/dsh-client-ui-price
```

余额读取由宿主 `llm.balance` RPC（随 Web 组合内置）提供，API key 永不进入浏览器——由宿主解析。

## 配置

全部字段均可选；默认值即 DeepSeek V4 官方闲时价格与官方高峰窗口。

| 字段 | 默认值 | 含义 |
|---|---|---|
| `rates` | v4-flash / v4-pro 闲时价格 | 每模型每百万 token 美元单价：`cacheHit`、`cacheMiss`、`output` |
| `peakHours` | `[[1, 4], [6, 10]]` | 视为高峰的半开 UTC 小时区间 |
| `peakMultiplier` | `2` | 高峰价格 = 闲时价格 × 该系数 |
| `showRegime` | `true` | 显示彩色高峰/谷时状态 |
| `showModel` | `true` | 显示当前模型 id |
| `showCost` | `true` | 显示当前会话累计费用 |
| `showBalance` | `true` | 显示剩余余额 |
| `pollIntervalMs` | `300000` | 余额刷新间隔 |

```yaml
- id: ui-price
  name: '@deepseek-ai/dsh-client-ui-price'
  config:
    peakHours: [[1, 4], [6, 10]]
    rates:
      deepseek-v4-flash: { cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 }
      deepseek-v4-pro:   { cacheHit: 0.022, cacheMiss: 0.66, output: 1.98 }
```

## 数据来源

- **时段**：当前 UTC 时间对配置窗口的纯函数判定（`pricing.ts`，各边界均有单元测试）。
- **模型**：会话快照中最近一次已完成请求的来源信息。
- **会话费用**：provider 上报的 token 用量投影（`uncachedInputTokens`、`cacheReadTokens`、`cacheWriteTokens`、`outputTokens`）× 适用单价。缓存写入按缓存未命中价计费（DeepSeek 未公布单独的缓存写入价）。
- **余额**：宿主 `llm.balance` RPC（`GET {baseURL}/user/balance`），轮询且可手动刷新。

费用是**参考值，不是账单记录**：token 桶是 provider 精确用量，但单价是你配置的挂牌价，DeepSeek 可能随时调整。

## Model Experience

无：本组件只在浏览器中渲染账单读数与框架投影，不触达任何模型请求。

#### KV Cache effect

无：本包既不组装也不发送 provider 请求。

## 已知限制与后续工作

- **费用为估算**——单价存于配置（部署自管），调价需改配置；token 桶来自 provider 自身用量报告。
- **模型按会话取最近一次请求**——中途切换模型的会话，其历史费用会按最新模型单价计算。
- **余额读取是宿主 RPC 的尽力而为**——端点不可达或未认证时显示不可用状态，并在下次轮询重试。
- **费用段依赖 `dsh-token-meter`**——内置组合已挂载；未挂载时费用段自动隐藏（与会话统计行行为一致）。

## License

MIT
