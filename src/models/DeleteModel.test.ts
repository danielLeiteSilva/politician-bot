import { DeleteModel } from "./DeleteModel"
import { WebhookBody } from "../types"

describe("DeleteModel", () => {
  it("should extract key properties from webhook body", () => {
    const body: WebhookBody = {
      event: "messages.upsert",
      data: {
        key: {
          remoteJid: "group123@g.us",
          fromMe: false,
          id: "msg-id-123",
          participant: "5511999999999@s.whatsapp.net",
        },
        message: { conversation: "test" },
      },
    }

    const model = new DeleteModel(body)

    expect(model.remoteJid).toBe("group123@g.us")
    expect(model.fromMe).toBe(false)
    expect(model.id).toBe("msg-id-123")
    expect(model.participant).toBe("5511999999999@s.whatsapp.net")
  })
})
