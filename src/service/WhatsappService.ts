import { DeleteModel } from "../models/DeleteModel"
import { MessageModel } from "../models/MessageModel"
import { WebhookBody } from "../types"
import { logger } from "../utils/logger"

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
    try {
      const model = new MessageModel(this.body)
      return JSON.stringify({
        number: model.number,
        options: model.options,
        textMessage: model.textMessage,
      })
    } catch (error) {
      logger.error("Erro ao construir payload de envio de mensagem", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        body: this.body
      })
      throw new Error("Falha ao construir payload de envio")
    }
  }

  private buildDeleteMessagePayload(): string {
    try {
      const model = new DeleteModel(this.body)
      return JSON.stringify({
        remoteJid: model.remoteJid,
        fromMe: model.fromMe,
        id: model.id,
        participant: model.participant,
      })
    } catch (error) {
      logger.error("Erro ao construir payload de deleção de mensagem", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        body: this.body
      })
      throw new Error("Falha ao construir payload de deleção")
    }
  }

  async sendMessage(): Promise<unknown> {
    const url = `${process.env.API_ROUTE}${process.env.SEND_MESSAGE}${process.env.INSTANCE_API}`
    
    if (!process.env.API_ROUTE || !process.env.SEND_MESSAGE || !process.env.INSTANCE_API) {
      const error = "Variáveis de ambiente da API WhatsApp não configuradas"
      logger.error(error, {
        API_ROUTE: !!process.env.API_ROUTE,
        SEND_MESSAGE: !!process.env.SEND_MESSAGE,
        INSTANCE_API: !!process.env.INSTANCE_API
      })
      throw new Error(error)
    }

    try {
      logger.info("Enviando mensagem WhatsApp", {
        url,
        body: this.body
      })

      const payload = this.buildSendMessagePayload()
      
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: payload,
      })

      if (response.ok) {
        const result = await response.json()
        logger.info("Mensagem enviada com sucesso", {
          status: response.status,
          result
        })
        return result
      }

      const errorText = await response.text()
      logger.error("Erro ao enviar mensagem WhatsApp", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      throw new Error(`Erro ao enviar mensagem: status ${response.status} - ${errorText}`)
    } catch (error) {
      logger.error("Erro ao enviar mensagem", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        url
      })
      throw error
    }
  }

  async deleteMessage(): Promise<unknown> {
    const url = `${process.env.API_ROUTE}${process.env.DELETE_ALL_MESSAGE}${process.env.INSTANCE_API}`
    
    if (!process.env.API_ROUTE || !process.env.DELETE_ALL_MESSAGE || !process.env.INSTANCE_API) {
      const error = "Variáveis de ambiente da API WhatsApp não configuradas"
      logger.error(error, {
        API_ROUTE: !!process.env.API_ROUTE,
        DELETE_ALL_MESSAGE: !!process.env.DELETE_ALL_MESSAGE,
        INSTANCE_API: !!process.env.INSTANCE_API
      })
      throw new Error(error)
    }

    try {
      logger.info("Deletando mensagem WhatsApp", {
        url,
        body: this.body
      })

      const payload = this.buildDeleteMessagePayload()
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
        body: payload,
      })

      if (response.ok) {
        const result = await response.json()
        logger.info("Mensagem deletada com sucesso", {
          status: response.status,
          result
        })
        return result
      }

      const errorText = await response.text()
      logger.error("Erro ao deletar mensagem WhatsApp", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      throw new Error(`Erro ao deletar mensagem: status ${response.status} - ${errorText}`)
    } catch (error) {
      logger.error("Erro ao deletar mensagem", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        url
      })
      throw error
    }
  }
}