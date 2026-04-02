import * as fs from "fs"
import * as path from "path"
import { WebhookBody } from "../types"

export class MessageModel {
  number: string
  options: { delay: number }
  textMessage: { text: string }

  constructor(body: WebhookBody) {
    this.number = body.data.key.remoteJid
    this.options = { delay: 0 }
    this.textMessage = { text: this.readMessage() }
  }

  readMessage(): string {
    const filePath = path.join(__dirname, "..", "..", "mensagem.json")
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    return data[0]["mensagem"]
  }
}
