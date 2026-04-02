import { ChatGptService } from "../service/ChatGptService"
import { WebhookBody } from "../types"

export class GptStrategy {
  private body: WebhookBody
  private chatGptService: ChatGptService

  constructor(body: WebhookBody, chatGptService?: ChatGptService) {
    this.body = body
    this.chatGptService = chatGptService || new ChatGptService()
  }

  async isPolitian(): Promise<boolean> {
    try {
      const message = this.body.data.message.conversation
      if (!message) return false

      const result = await this.chatGptService.gptResultAnalisys(message)
      if (result.code === 200) {
        return result.isPolitico
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar conteudo politico:", error)
      return false
    }
  }
}
