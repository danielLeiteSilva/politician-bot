import { ConditionMessageStrategy } from "./ConditionMessageStrategy"
import { WebhookBody } from "../types"

function createBody(overrides: Partial<WebhookBody> = {}): WebhookBody {
  return {
    event: "messages.upsert",
    data: {
      key: {
        remoteJid: "group@g.us",
        fromMe: false,
        id: "msg-1",
        participant: "5511999999999@s.whatsapp.net",
      },
      message: { conversation: "ola" },
      ...overrides.data,
    },
    ...overrides,
  } as WebhookBody
}

describe("ConditionMessageStrategy", () => {
  afterEach(() => {
    delete process.env.MONITORED_USERS
  })

  describe("readUsers", () => {
    it("should return empty array when MONITORED_USERS is not set", () => {
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.readUsers()).toEqual([])
    })

    it("should parse comma-separated MONITORED_USERS", () => {
      process.env.MONITORED_USERS = "user1@s.whatsapp.net, user2@s.whatsapp.net"
      const strategy = new ConditionMessageStrategy(createBody())

      expect(strategy.readUsers()).toEqual([
        "user1@s.whatsapp.net",
        "user2@s.whatsapp.net",
      ])
    })
  })

  describe("isEvent", () => {
    it("should return true for messages.upsert event", () => {
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.isEvent()).toBe(true)
    })

    it("should return false for other events", () => {
      const strategy = new ConditionMessageStrategy(
        createBody({ event: "messages.delete" })
      )
      expect(strategy.isEvent()).toBe(false)
    })
  })

  describe("isContext", () => {
    it("should return true when messageContextInfo is undefined", () => {
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.isContext()).toBe(true)
    })

    it("should return false when messageContextInfo is present", () => {
      const body = createBody()
      body.data.messageContextInfo = { some: "data" }
      const strategy = new ConditionMessageStrategy(body)
      expect(strategy.isContext()).toBe(false)
    })
  })

  describe("isUser", () => {
    it("should return true when MONITORED_USERS is not set (monitors all)", () => {
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.isUser()).toBe(true)
    })

    it("should return true when participant is in MONITORED_USERS", () => {
      process.env.MONITORED_USERS = "5511999999999@s.whatsapp.net"
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.isUser()).toBe(true)
    })

    it("should return false when participant is not in MONITORED_USERS", () => {
      process.env.MONITORED_USERS = "5511888888888@s.whatsapp.net"
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.isUser()).toBe(false)
    })
  })

  describe("isCondition", () => {
    it("should return true when all conditions are met", () => {
      const strategy = new ConditionMessageStrategy(createBody())
      expect(strategy.isCondition()).toBe(true)
    })

    it("should return false when event is wrong", () => {
      const strategy = new ConditionMessageStrategy(
        createBody({ event: "other" })
      )
      expect(strategy.isCondition()).toBe(false)
    })
  })
})
