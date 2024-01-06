const ChatGptClient = require("../client/ChatGptClient");

class ChatGptService {
  constructor() {
    this.chatGptClient = new ChatGptClient()
  }

  _getDescription(informacao) {
    return `

        ${informacao}

        Analise a frase a cima e responda com um JSON e SOMENTE UM JSON dizendo se é um conteúdo político com os parametro abaixo:
        
        isPolitico - booleano
      
      `
  }

  async gptResultAnalisys(information) {

    const description = this._getDescription(information)
    const result = await this.chatGptClient.gptAnalisysText(description)
    console.log(`**RESULT** ${JSON.stringify(result)}`)
    return result

  }
}

module.exports = ChatGptService