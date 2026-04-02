import "dotenv/config"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

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

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatePayload(text)),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>
        }
        const content: string = data.choices[0].message.content
        const parsed = JSON.parse(content) as { isPolitico: boolean }
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ isPolitico: parsed.isPolitico, code: response.status }),
            },
          ],
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              isPolitico: false,
              code: response.status,
              error: "Nao foi possivel processar a requisicao",
            }),
          },
        ],
        isError: true,
      }
    } catch (error) {
      console.error("Erro ao consultar ChatGPT:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ isPolitico: false, code: 500, error: errorMessage }),
          },
        ],
        isError: true,
      }
    }
  }
)

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error("Erro ao iniciar MCP server:", error)
  process.exit(1)
})
