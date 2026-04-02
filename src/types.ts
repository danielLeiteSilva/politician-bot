export interface WebhookKey {
  remoteJid: string
  fromMe: boolean
  id: string
  participant: string
}

export interface WebhookMessage {
  conversation?: string
}

export interface WebhookData {
  key: WebhookKey
  message: WebhookMessage
  messageContextInfo?: unknown
}

export interface WebhookBody {
  event: string
  data: WebhookData
}
