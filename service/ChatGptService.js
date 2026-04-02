const ChatGptClient = require("../client/ChatGptClient")

class ChatGptService {
  constructor() {
    this.chatGptClient = new ChatGptClient()
  }

  async gptResultAnalisys(information) {
    const result = await this.chatGptClient.gptAnalisysText(information)
    console.log(`**RESULT** ${JSON.stringify(result)}`)
    return result
  }
}

module.exports = ChatGptService
