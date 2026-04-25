import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import * as path from "path"
import { logger } from "../utils/logger"

export interface ClassificationResult {
  isPolitico: boolean
  code: number
  error?: string
}

export class McpClassifierClient {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null
  private isConnected: boolean = false

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.debug("Cliente MCP já conectado")
      return
    }

    try {
      const serverPath = path.join(__dirname, "..", "mcp-server", "index.js")

      logger.info("Conectando ao MCP server", {
        serverPath
      })

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
      this.isConnected = true
      
      logger.info("Conectado ao MCP server com sucesso")
    } catch (error) {
      logger.error("Erro ao conectar ao MCP server", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  async classifyText(text: string): Promise<ClassificationResult> {
    if (!this.isConnected || !this.client) {
      logger.info("Reconectando ao MCP server")
      await this.connect()
    }

    try {
      logger.info("Classificando texto", {
        textLength: text.length,
        textPreview: text.substring(0, 100)
      })

      const result = await this.client!.callTool({
        name: "classify_political_content",
        arguments: { text },
      })

      logger.debug("Resposta recebida do MCP server", {
        result
      })

      if ("content" in result && Array.isArray(result.content)) {
        const textContent = result.content.find(
          (c: { type: string }) => c.type === "text"
        ) as { type: "text"; text: string } | undefined

        if (textContent) {
          try {
            const parsed = JSON.parse(textContent.text) as ClassificationResult
            
            logger.info("Classificação concluída", {
              isPolitico: parsed.isPolitico,
              code: parsed.code,
              hasError: !!parsed.error
            })
            
            return parsed
          } catch (parseError) {
            logger.error("Erro ao fazer parse da resposta MCP", {
              content: textContent.text,
              error: parseError instanceof Error ? parseError.message : "Erro desconhecido"
            })
            
            return { 
              isPolitico: false, 
              code: 500, 
              error: "Resposta inválida do MCP server",
              rawContent: textContent.text
            }
          }
        }
      }

      logger.error("Resposta inválida do MCP server", {
        result
      })

      return { 
        isPolitico: false, 
        code: 500, 
        error: "Resposta inválida do MCP server" 
      }
    } catch (error) {
      logger.error("Erro ao chamar MCP server", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        textLength: text.length
      })
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      return { 
        isPolitico: false, 
        code: 500, 
        error: errorMessage 
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        logger.info("Desconectando do MCP server")
        await this.client.close()
        this.client = null
        this.transport = null
        this.isConnected = false
        
        logger.info("Desconectado do MCP server com sucesso")
      }
    } catch (error) {
      logger.error("Erro ao desconectar do MCP server", {
        error: error instanceof Error ? error.message : "Erro desconhecido"
      })
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        return false
      }

      // Tenta fazer uma chamada simples para verificar se está funcionando
      await this.classifyText("health check")
      return true
    } catch (error) {
      logger.warn("Health check falhou", {
        error: error instanceof Error ? error.message : "Erro desconhecido"
      })
      return false
    }
  }
}