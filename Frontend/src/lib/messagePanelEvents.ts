export const MESSAGE_PANEL_OPEN_EVENT = 'mednexus:message-panel-open'
export const MESSAGES_UNREAD_CHANGED_EVENT = 'mednexus:messages-unread-changed'

export type MessagePanelOpenDetail = {
  vendorId?: number
  conversationId?: number
}

export type MessagesUnreadChangedDetail = {
  count: number
}

export function openMessagePanel(detail?: MessagePanelOpenDetail) {
  window.dispatchEvent(new CustomEvent<MessagePanelOpenDetail>(MESSAGE_PANEL_OPEN_EVENT, { detail }))
}

export function notifyMessagesUnreadChanged(count: number) {
  window.dispatchEvent(
    new CustomEvent<MessagesUnreadChangedDetail>(MESSAGES_UNREAD_CHANGED_EVENT, {
      detail: { count },
    }),
  )
}
