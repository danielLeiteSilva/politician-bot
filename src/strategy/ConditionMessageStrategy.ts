import { WebhookBody } from "../types"

export class ConditionMessageStrategy {
  private body: WebhookBody

  constructor(body: WebhookBody) {
    this.body = body
  }

  readUsers(): string[] {
    const usersEnv = process.env.MONITORED_USERS
    if (usersEnv) {
      return usersEnv.split(",").map((user) => user.trim())
    }
    return []
  }

  isCondition(): boolean {
    return this.isEvent() && this.isContext() && this.isUser()
  }

  isEvent(): boolean {
    return this.body.event === "messages.upsert"
  }

  isContext(): boolean {
    return this.body.data.messageContextInfo === undefined
  }

  isUser(): boolean {
    const users = this.readUsers()
    if (users.length === 0) return true
    return users.some((user) => user === this.body.data.key.participant)
  }
}
