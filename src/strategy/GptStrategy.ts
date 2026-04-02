import { ChatGptService } from "../service/ChatGptService"
import { WebhookBody } from "../types"

export class GptStrategy {
  private body: WebhookBody
  private chatGptService: ChatGptService

  constructor(body: WebhookBody) {
    this.body = body
    this.chatGptService = new ChatGptService()
  }

  async isPolitian(): Promise<boolean> {
    try {
      const message = this.body.data.message.conversation
      if (!message) return false

      const result = await this.chatGptService.gptResultAnalisys(message)
      if (result.code === 200 && typeof result.message !== "string") {
        return result.message.isPolitico
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar conteudo politico:", error)
      return false
    }
  }
}
