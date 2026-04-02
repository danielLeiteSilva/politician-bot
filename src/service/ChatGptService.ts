import { ChatGptClient, GptResponse } from "../client/ChatGptClient"

export class ChatGptService {
  private chatGptClient: ChatGptClient

  constructor() {
    this.chatGptClient = new ChatGptClient()
  }

  async gptResultAnalisys(information: string): Promise<GptResponse> {
    const result = await this.chatGptClient.gptAnalisysText(information)
    console.log(`**RESULT** ${JSON.stringify(result)}`)
    return result
  }
}
