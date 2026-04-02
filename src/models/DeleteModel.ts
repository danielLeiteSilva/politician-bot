import { WebhookBody } from "../types"

export class DeleteModel {
  remoteJid: string
  fromMe: boolean
  id: string
  participant: string

  constructor(body: WebhookBody) {
    this.remoteJid = body.data.key.remoteJid
    this.fromMe = body.data.key.fromMe
    this.id = body.data.key.id
    this.participant = body.data.key.participant
  }
}
