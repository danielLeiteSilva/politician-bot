export interface GptResponse {
  message: { isPolitico: boolean } | string
  code: number
}

interface ChatCompletionPayload {
  model: string
  messages: Array<{ role: string; content: string }>
  max_tokens: number
  temperature: number
}

export class ChatGptClient {
  private url: string
  private token: string

  constructor() {
    this.url = process.env.OPEN_AI || "https://api.openai.com/v1/chat/completions"
    this.token = process.env.GPT_TOKEN || ""
  }

  generatePayload(text: string): ChatCompletionPayload {
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

  async gptAnalisysText(text: string): Promise<GptResponse> {
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.generatePayload(text)),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>
        }
        const content: string = data.choices[0].message.content
        return { message: JSON.parse(content), code: response.status }
      }

      return {
        message: "Nao foi possivel processar a requisicao",
        code: response.status,
      }
    } catch (error) {
      console.error("Erro ao consultar ChatGPT:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      return { message: errorMessage, code: 500 }
    }
  }
}
