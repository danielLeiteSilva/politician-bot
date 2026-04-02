import { WhatsappService } from "../service/WhatsappService"
import { WebhookBody } from "../types"
import { ConditionMessageStrategy } from "./ConditionMessageStrategy"
import { GptStrategy } from "./GptStrategy"

export class MessageStrategy {
  private body: WebhookBody
  private gptStrategy: GptStrategy
  private whatsAppApi: WhatsappService
  private conditionStrategy: ConditionMessageStrategy

  constructor(body: WebhookBody) {
    this.body = body
    this.gptStrategy = new GptStrategy(body)
    this.whatsAppApi = new WhatsappService(body)
    this.conditionStrategy = new ConditionMessageStrategy(body)
  }

  async run(): Promise<void> {
    if (this.conditionStrategy.isCondition()) {
      const isPolitian = await this.gptStrategy.isPolitian()
      if (isPolitian) {
        await this.whatsAppApi.deleteMessage()
        await this.whatsAppApi.sendMessage()
      }
    }
  }
}
