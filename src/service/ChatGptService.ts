import { McpClassifierClient, ClassificationResult } from "../client/McpClassifierClient"

export class ChatGptService {
  private mcpClient: McpClassifierClient

  constructor(mcpClient?: McpClassifierClient) {
    this.mcpClient = mcpClient || new McpClassifierClient()
  }

  async gptResultAnalisys(information: string): Promise<ClassificationResult> {
    const result = await this.mcpClient.classifyText(information)
    console.log(`**RESULT** ${JSON.stringify(result)}`)
    return result
  }

  async disconnect(): Promise<void> {
    await this.mcpClient.disconnect()
  }
}
