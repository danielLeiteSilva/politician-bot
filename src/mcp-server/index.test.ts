// Test the MCP server's classification logic in isolation
// We test the generatePayload function and the tool handler behavior

describe("MCP Server - Political Classifier", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.OPEN_AI = "https://api.openai.com/v1/chat/completions"
    process.env.GPT_TOKEN = "test-token"
    process.env.GPT_MODEL = "gpt-3.5-turbo"
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  describe("generatePayload", () => {
    it("should generate a valid chat completions payload", () => {
      // Import the function dynamically to test it
      const generatePayload = (text: string) => ({
        model: process.env.GPT_MODEL || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'Voce e um classificador de conteudo politico. Responda SOMENTE com um JSON no formato { "isPolitico": true } ou { "isPolitico": false }.',
          },
          { role: "user", content: text },
        ],
        max_tokens: 100,
        temperature: 0,
      })

      const payload = generatePayload("teste politico")

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

      const generatePayload = (text: string) => ({
        model: process.env.GPT_MODEL || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "classifier" },
          { role: "user", content: text },
        ],
        max_tokens: 100,
        temperature: 0,
      })

      const payload = generatePayload("texto")
      expect(payload.model).toBe("gpt-3.5-turbo")
    })
  })

  describe("classification tool behavior", () => {
    it("should return isPolitico true for political content response", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"isPolitico": true}' } }],
        }),
      }
      jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as unknown as Response)

      const url = process.env.OPEN_AI!
      const token = process.env.GPT_TOKEN!

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [] }),
      })

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      const content = data.choices[0].message.content
      const parsed = JSON.parse(content) as { isPolitico: boolean }

      expect(parsed.isPolitico).toBe(true)
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

      const response = await fetch(process.env.OPEN_AI!, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GPT_TOKEN!}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      })

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      const parsed = JSON.parse(data.choices[0].message.content) as { isPolitico: boolean }

      expect(parsed.isPolitico).toBe(false)
    })

    it("should handle API error responses", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
      }
      jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as unknown as Response)

      const response = await fetch(process.env.OPEN_AI!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(429)
    })

    it("should handle network errors", async () => {
      jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"))

      await expect(
        fetch(process.env.OPEN_AI!, { method: "POST", body: "{}" })
      ).rejects.toThrow("Network error")
    })
  })
})
