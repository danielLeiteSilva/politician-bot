const ChatGptService = require("../service/ChatGptService")
const WhatsappService = require("../service/WhatsappService")
const ConditionMessageStrategy = require("./ConditionMessageStrategy")
const GptStrategy = require("./GptStrategy")

class MessageStrategy {
  constructor(body) {
    this.body = body
    this.gptStrategy = new GptStrategy(body)
    this.whatsAppApi = new WhatsappService(body)
    this.conditionStrategy = new ConditionMessageStrategy(body)
  }

  async run() {
    if (this.conditionStrategy.isCondition()) {
      const isPolitian = await this.gptStrategy.isPolitian()
      if (isPolitian) {
        await this.whatsAppApi.deleteMessage()
        await this.whatsAppApi.sendMessage()
      }
    }
  }
}

module.exports = MessageStrategy