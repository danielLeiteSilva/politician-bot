import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import * as path from "path"

export interface ClassificationResult {
  isPolitico: boolean
  code: number
  error?: string
}

export class McpClassifierClient {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null

  async connect(): Promise<void> {
    const serverPath = path.join(__dirname, "..", "mcp-server", "index.js")

    this.transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
      env: {
        ...process.env as Record<string, string>,
      },
    })

    this.client = new Client({
      name: "politician-bot",
      version: "2.0.0",
    })

    await this.client.connect(this.transport)
  }

  async classifyText(text: string): Promise<ClassificationResult> {
    if (!this.client) {
      await this.connect()
    }

    try {
      const result = await this.client!.callTool({
        name: "classify_political_content",
        arguments: { text },
      })

      if ("content" in result && Array.isArray(result.content)) {
        const textContent = result.content.find(
          (c: { type: string }) => c.type === "text"
        ) as { type: "text"; text: string } | undefined

        if (textContent) {
          return JSON.parse(textContent.text) as ClassificationResult
        }
      }

      return { isPolitico: false, code: 500, error: "Resposta invalida do MCP server" }
    } catch (error) {
      console.error("Erro ao chamar MCP server:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      return { isPolitico: false, code: 500, error: errorMessage }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.transport = null
    }
  }
}
