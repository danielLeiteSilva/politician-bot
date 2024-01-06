const ChatGptService = require("../service/ChatGptService")

class GptStrategy{
  constructor(body) {
    this.body = body
    this.chatGptService = new ChatGptService()
  }

  async isPolitian(){
    const result = await this.chatGptService.gptResultAnalisys(this.body.data.message.conversation)
    if(result.code === 200){
      return result.message.isPolitico
    }
    return false
  }
}

module.exports = GptStrategy