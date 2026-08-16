/**
 * Price widget slot contract: the registrant-side props composition for the
 * conversation-owned `conversation.session.header.actions` hole rendered
 * beside the session title. The owner passes nothing; the framework session
 * kit supplies the snapshot and projection seats, and the registrant injects
 * the immutable config plus the balance read.
 */

import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls ui-conversation's SlotMap merge ('conversation.session.header.actions').
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { DeepSeekBalanceView } from '@deepseek-ai/dsh-client-connection/client'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { Config } from '../config.ts'

/** Registrant-private injected share: the frozen config and the host RPC bridge. */
export interface PriceBadgeInjected {
  /** Validated plugin configuration (rates, peak window, display toggles). */
  config: Config
  /**
   * Fetch the current DeepSeek balance from the host. Resolves to the wire
   * view on success; the widget surfaces rejection as a retryable state.
   */
  refreshBalance: () => Promise<DeepSeekBalanceView>
  /**
   * The session's current model selection (the authoritative model the
   * requests use, served by the host `session.models` RPC). Undefined when
   * the session has no routable selection.
   */
  loadModel: () => Promise<ModelSelection | undefined>
}

/** Full component props: framework session kit + locale seat + injected face. */
export type PriceBadgeComponentProps =
  PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<'price'>
  & InjectFace<PriceBadgeInjected>
