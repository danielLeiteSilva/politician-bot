import "dotenv/config"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { logger } from "../utils/logger"

const server = new McpServer({
  name: "political-classifier",
  version: "1.0.0",
})

interface ChatCompletionPayload {
  model: string
  messages: Array<{ role: string; content: string }>
  max_tokens: number
  temperature: number
}

function generatePayload(text: string): ChatCompletionPayload {
  return {
    model: process.env.GPT_MODEL || "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          'Voce e um classificador de conteudo politico. Responda SOMENTE com um JSON no formato { "isPolitico": true } ou { "isPolitico": false }.',
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 100,
    temperature: 0,
  }
}

server.tool(
  "classify_political_content",
  "Classifica se um texto contem conteudo politico usando ChatGPT",
  { text: z.string().describe("Texto a ser classificado") },
  async ({ text }) => {
    const url = process.env.OPEN_AI || "https://api.openai.com/v1/chat/completions"
    const token = process.env.GPT_TOKEN || ""

    // Validação de configuração
    if (!token) {
      logger.error("Token GPT não configurado")
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              isPolitico: false,
              code: 500,
              error: "Token GPT não configurado",
            }),
          },
        ],
        isError: true,
      }
    }

    try {
      logger.info("Iniciando classificação de conteúdo político", {
        textLength: text.length,
        model: process.env.GPT_MODEL || "gpt-3.5-turbo"
      })

      const payload = generatePayload(text)
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>
        }
        
        logger.info("Resposta recebida da OpenAI", {
          status: response.status,
          choicesCount: data.choices.length
        })

        const content: string = data.choices[0]?.message?.content || ""
        
        if (!content) {
          logger.error("Conteúdo vazio recebido da OpenAI")
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  isPolitico: false,
                  code: 500,
                  error: "Resposta vazia da OpenAI",
                }),
              },
            ],
            isError: true,
          }
        }

        try {
          const parsed = JSON.parse(content) as { isPolitico: boolean }
          
          logger.info("Classificação concluída com sucesso", {
            isPolitico: parsed.isPolitico,
            content: content.substring(0, 100)
          })
          
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ 
                  isPolitico: parsed.isPolitico, 
                  code: response.status 
                }),
              },
            ],
          }
        } catch (parseError) {
          logger.error("Erro ao fazer parse da resposta JSON", {
            content,
            error: parseError instanceof Error ? parseError.message : "Erro desconhecido"
          })
          
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  isPolitico: false,
                  code: 500,
                  error: "Resposta inválida do servidor",
                  rawContent: content
                }),
              },
            ],
            isError: true,
          }
        }
      }

      const errorText = await response.text()
      logger.error("Erro na requisição para OpenAI", {
        status: response.status,
        statusText: response.statusText,
        errorText
      })

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              isPolitico: false,
              code: response.status,
              error: `Erro na API OpenAI: ${response.status} - ${errorText}`,
            }),
          },
        ],
        isError: true,
      }
    } catch (error) {
      logger.error("Erro ao consultar ChatGPT", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : undefined,
        textLength: text.length
      })
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ 
              isPolitico: false, 
              code: 500, 
              error: errorMessage 
            }),
          },
        ],
        isError: true,
      }
    }
  }
)

async function main(): Promise<void> {
  try {
    logger.info("Iniciando MCP server", {
      name: "political-classifier",
      version: "1.0.0"
    })

    const transport = new StdioServerTransport()
    await server.connect(transport)
    
    logger.info("MCP server conectado com sucesso")
  } catch (error) {
    logger.error("Erro ao iniciar MCP server", {
      error: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined
    })
    process.exit(1)
  }
}

main().catch((error) => {
  logger.error("Erro fatal no MCP server", {
    error: error instanceof Error ? error.message : "Erro desconhecido",
    stack: error instanceof Error ? error.stack : undefined
  })
  process.exit(1)
})