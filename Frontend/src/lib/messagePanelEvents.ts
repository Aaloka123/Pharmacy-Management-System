export const MESSAGE_PANEL_OPEN_EVENT = 'mednexus:message-panel-open'

export type MessagePanelOpenDetail = {
  vendorId?: number
  conversationId?: number
}

export function openMessagePanel(detail?: MessagePanelOpenDetail) {
  window.dispatchEvent(new CustomEvent<MessagePanelOpenDetail>(MESSAGE_PANEL_OPEN_EVENT, { detail }))
}
