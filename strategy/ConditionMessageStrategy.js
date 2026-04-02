class ConditionStrategy {
  constructor(body) {
    this.body = body
  }

  readUsers() {
    const usersEnv = process.env.MONITORED_USERS
    if (usersEnv) {
      return usersEnv.split(",").map(user => user.trim())
    }
    return []
  }

  isCondition() {
    return this.isEvent()
      && this.isContext()
      && this.isUser()
  }

  isEvent() {
    return this.body.event === "messages.upsert"
  }

  isContext() {
    return this.body.data.messageContextInfo === undefined
  }

  isUser() {
    const users = this.readUsers()
    if (users.length === 0) return true
    return users.some(user => user === this.body.data.key.participant)
  }
}

module.exports = ConditionStrategy
