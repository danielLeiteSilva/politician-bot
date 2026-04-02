import { GptStrategy } from "./GptStrategy"
import { ChatGptService } from "../service/ChatGptService"
import { WebhookBody } from "../types"

jest.mock("../service/ChatGptService")

function createBody(conversation?: string): WebhookBody {
  return {
    event: "messages.upsert",
    data: {
      key: {
        remoteJid: "group@g.us",
        fromMe: false,
        id: "msg-1",
        participant: "5511999999999@s.whatsapp.net",
      },
      message: { conversation },
    },
  }
}

describe("GptStrategy", () => {
  let mockGptResultAnalisys: jest.Mock

  beforeEach(() => {
    mockGptResultAnalisys = jest.fn()
    ;(ChatGptService as jest.MockedClass<typeof ChatGptService>).mockImplementation(
      () =>
        ({
          gptResultAnalisys: mockGptResultAnalisys,
        }) as unknown as ChatGptService
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should return true when message is political", async () => {
    mockGptResultAnalisys.mockResolvedValue({
      isPolitico: true,
      code: 200,
    })

    const strategy = new GptStrategy(createBody("Vote no candidato"))
    const result = await strategy.isPolitian()

    expect(result).toBe(true)
    expect(mockGptResultAnalisys).toHaveBeenCalledWith("Vote no candidato")
  })

  it("should return false when message is not political", async () => {
    mockGptResultAnalisys.mockResolvedValue({
      isPolitico: false,
      code: 200,
    })

    const strategy = new GptStrategy(createBody("Bom dia"))
    const result = await strategy.isPolitian()

    expect(result).toBe(false)
  })

  it("should return false when message is undefined", async () => {
    const strategy = new GptStrategy(createBody(undefined))
    const result = await strategy.isPolitian()

    expect(result).toBe(false)
    expect(mockGptResultAnalisys).not.toHaveBeenCalled()
  })

  it("should return false when API returns error code", async () => {
    mockGptResultAnalisys.mockResolvedValue({
      isPolitico: false,
      code: 500,
      error: "Erro",
    })

    const strategy = new GptStrategy(createBody("qualquer texto"))
    const result = await strategy.isPolitian()

    expect(result).toBe(false)
  })

  it("should return false and log error on exception", async () => {
    mockGptResultAnalisys.mockRejectedValue(new Error("API down"))
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const strategy = new GptStrategy(createBody("qualquer texto"))
    const result = await strategy.isPolitian()

    expect(result).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
