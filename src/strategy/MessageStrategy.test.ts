import { MessageStrategy } from "./MessageStrategy"
import { ConditionMessageStrategy } from "./ConditionMessageStrategy"
import { GptStrategy } from "./GptStrategy"
import { WhatsappService } from "../service/WhatsappService"
import { WebhookBody } from "../types"

jest.mock("./ConditionMessageStrategy")
jest.mock("./GptStrategy")
jest.mock("../service/WhatsappService")

function createBody(): WebhookBody {
  return {
    event: "messages.upsert",
    data: {
      key: {
        remoteJid: "group@g.us",
        fromMe: false,
        id: "msg-1",
        participant: "5511999999999@s.whatsapp.net",
      },
      message: { conversation: "Vote no candidato" },
    },
  }
}

describe("MessageStrategy", () => {
  let mockIsCondition: jest.Mock
  let mockIsPolitian: jest.Mock
  let mockDeleteMessage: jest.Mock
  let mockSendMessage: jest.Mock

  beforeEach(() => {
    mockIsCondition = jest.fn()
    mockIsPolitian = jest.fn()
    mockDeleteMessage = jest.fn().mockResolvedValue(undefined)
    mockSendMessage = jest.fn().mockResolvedValue(undefined)

    ;(ConditionMessageStrategy as jest.MockedClass<typeof ConditionMessageStrategy>).mockImplementation(
      () => ({ isCondition: mockIsCondition }) as unknown as ConditionMessageStrategy
    )
    ;(GptStrategy as jest.MockedClass<typeof GptStrategy>).mockImplementation(
      () => ({ isPolitian: mockIsPolitian }) as unknown as GptStrategy
    )
    ;(WhatsappService as jest.MockedClass<typeof WhatsappService>).mockImplementation(
      () =>
        ({
          deleteMessage: mockDeleteMessage,
          sendMessage: mockSendMessage,
        }) as unknown as WhatsappService
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should delete and send warning when condition met and content is political", async () => {
    mockIsCondition.mockReturnValue(true)
    mockIsPolitian.mockResolvedValue(true)

    const strategy = new MessageStrategy(createBody())
    await strategy.run()

    expect(mockDeleteMessage).toHaveBeenCalled()
    expect(mockSendMessage).toHaveBeenCalled()
  })

  it("should not delete when condition met but content is not political", async () => {
    mockIsCondition.mockReturnValue(true)
    mockIsPolitian.mockResolvedValue(false)

    const strategy = new MessageStrategy(createBody())
    await strategy.run()

    expect(mockDeleteMessage).not.toHaveBeenCalled()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it("should not check GPT when condition is not met", async () => {
    mockIsCondition.mockReturnValue(false)

    const strategy = new MessageStrategy(createBody())
    await strategy.run()

    expect(mockIsPolitian).not.toHaveBeenCalled()
    expect(mockDeleteMessage).not.toHaveBeenCalled()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})
