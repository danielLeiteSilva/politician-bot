import { ChatGptClient } from "./ChatGptClient"

describe("ChatGptClient", () => {
  let client: ChatGptClient

  beforeEach(() => {
    process.env.OPEN_AI = "https://api.openai.com/v1/chat/completions"
    process.env.GPT_TOKEN = "test-token"
    process.env.GPT_MODEL = "gpt-3.5-turbo"
    client = new ChatGptClient()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete process.env.OPEN_AI
    delete process.env.GPT_TOKEN
    delete process.env.GPT_MODEL
  })

  describe("generatePayload", () => {
    it("should generate a valid chat completions payload", () => {
      const payload = client.generatePayload("teste politico")

      expect(payload.model).toBe("gpt-3.5-turbo")
      expect(payload.messages).toHaveLength(2)
      expect(payload.messages[0].role).toBe("system")
      expect(payload.messages[1].role).toBe("user")
      expect(payload.messages[1].content).toBe("teste politico")
      expect(payload.max_tokens).toBe(100)
      expect(payload.temperature).toBe(0)
    })

    it("should use default model when GPT_MODEL is not set", () => {
      delete process.env.GPT_MODEL
      client = new ChatGptClient()
      const payload = client.generatePayload("texto")

      expect(payload.model).toBe("gpt-3.5-turbo")
    })
  })

  describe("gptAnalisysText", () => {
    it("should return isPolitico true for political content", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"isPolitico": true}' } }],
        }),
      }
      jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as unknown as Response)

      const result = await client.gptAnalisysText("Vamos votar no candidato X")

      expect(result.code).toBe(200)
      expect(result.message).toEqual({ isPolitico: true })
    })

    it("should return isPolitico false for non-political content", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"isPolitico": false}' } }],
        }),
      }
      jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as unknown as Response)

      const result = await client.gptAnalisysText("Bom dia pessoal")

      expect(result.code).toBe(200)
      expect(result.message).toEqual({ isPolitico: false })
    })

    it("should handle API error responses", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
      }
      jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as unknown as Response)

      const result = await client.gptAnalisysText("qualquer texto")

      expect(result.code).toBe(429)
      expect(result.message).toBe("Nao foi possivel processar a requisicao")
    })

    it("should handle network errors gracefully", async () => {
      jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"))

      const result = await client.gptAnalisysText("qualquer texto")

      expect(result.code).toBe(500)
      expect(result.message).toBe("Network error")
    })

    it("should handle non-Error exceptions", async () => {
      jest.spyOn(global, "fetch").mockRejectedValue("string error")

      const result = await client.gptAnalisysText("qualquer texto")

      expect(result.code).toBe(500)
      expect(result.message).toBe("Erro desconhecido")
    })
  })
})
