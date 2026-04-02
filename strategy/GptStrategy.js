const ChatGptService = require("../service/ChatGptService")

class GptStrategy {
  constructor(body) {
    this.body = body
    this.chatGptService = new ChatGptService()
  }

  async isPolitian() {
    try {
      const message = this.body.data.message.conversation
      if (!message) return false

      const result = await this.chatGptService.gptResultAnalisys(message)
      if (result.code === 200) {
        return result.message.isPolitico
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar conteudo politico:", error)
      return false
    }
  }
}

module.exports = GptStrategy
