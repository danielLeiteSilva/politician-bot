import { DeleteModel } from "../models/DeleteModel"
import { MessageModel } from "../models/MessageModel"
import { WebhookBody } from "../types"

export class WhatsappService {
  private body: WebhookBody

  constructor(body: WebhookBody) {
    this.body = body
  }

  private getHeaders(): Record<string, string> {
    return {
      apikey: process.env.API_KEY_WHATSAPP || "",
      "Content-Type": "application/json",
    }
  }

  private buildSendMessagePayload(): string {
    const model = new MessageModel(this.body)
    return JSON.stringify({
      number: model.number,
      options: model.options,
      textMessage: model.textMessage,
    })
  }

  private buildDeleteMessagePayload(): string {
    const model = new DeleteModel(this.body)
    return JSON.stringify({
      remoteJid: model.remoteJid,
      fromMe: model.fromMe,
      id: model.id,
      participant: model.participant,
    })
  }

  async sendMessage(): Promise<unknown> {
    const url = `${process.env.API_ROUTE}${process.env.SEND_MESSAGE}${process.env.INSTANCE_API}`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: this.buildSendMessagePayload(),
      })

      if (response.ok) {
        return await response.json()
      }

      throw new Error(`Erro ao enviar mensagem: status ${response.status}`)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      throw error
    }
  }

  async deleteMessage(): Promise<unknown> {
    const url = `${process.env.API_ROUTE}${process.env.DELETE_ALL_MESSAGE}${process.env.INSTANCE_API}`

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
        body: this.buildDeleteMessagePayload(),
      })

      if (response.ok) {
        return await response.json()
      }

      throw new Error(`Erro ao deletar mensagem: status ${response.status}`)
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error)
      throw error
    }
  }
}
