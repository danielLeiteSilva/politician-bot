import { Strategy } from "./Strategy"
import { WebhookBody } from "../types"

describe("Strategy", () => {
  it("should instantiate and run the given strategy class", async () => {
    const mockRun = jest.fn().mockResolvedValue(undefined)
    const MockStrategy = jest.fn().mockImplementation(() => ({
      run: mockRun,
    }))

    const body: WebhookBody = {
      event: "messages.upsert",
      data: {
        key: {
          remoteJid: "group@g.us",
          fromMe: false,
          id: "msg-1",
          participant: "user@s.whatsapp.net",
        },
        message: { conversation: "test" },
      },
    }

    const strategy = new Strategy(body)
    await strategy.runner(MockStrategy)

    expect(MockStrategy).toHaveBeenCalledWith(body)
    expect(mockRun).toHaveBeenCalled()
  })

  it("should propagate errors from strategy run", async () => {
    const MockStrategy = jest.fn().mockImplementation(() => ({
      run: jest.fn().mockRejectedValue(new Error("strategy error")),
    }))

    const body: WebhookBody = {
      event: "messages.upsert",
      data: {
        key: {
          remoteJid: "group@g.us",
          fromMe: false,
          id: "msg-1",
          participant: "user@s.whatsapp.net",
        },
        message: { conversation: "test" },
      },
    }

    const strategy = new Strategy(body)
    await expect(strategy.runner(MockStrategy)).rejects.toThrow("strategy error")
  })
})
