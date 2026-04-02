const DeleteModel = require('../models/DeleteModel')
const MessageModel = require('../models/MessageModel')

class WhatsappService {
  constructor(body) {
    this.body = body
  }

  getHeaders() {
    return {
      'apikey': process.env.API_KEY_WHATSAPP,
      'Content-Type': 'application/json'
    }
  }

  buildSendMessagePayload() {
    const { ...content } = new MessageModel(this.body)
    return JSON.stringify(content)
  }

  buildDeleteMessagePayload() {
    const { ...deleteModel } = new DeleteModel(this.body)
    return JSON.stringify(deleteModel)
  }

  async sendMessage() {
    const url = `${process.env.API_ROUTE}${process.env.SEND_MESSAGE}${process.env.INSTANCE_API}`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: this.buildSendMessagePayload()
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

  async deleteMessage() {
    const url = `${process.env.API_ROUTE}${process.env.DELETE_ALL_MESSAGE}${process.env.INSTANCE_API}`

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
        body: this.buildDeleteMessagePayload()
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

module.exports = WhatsappService
