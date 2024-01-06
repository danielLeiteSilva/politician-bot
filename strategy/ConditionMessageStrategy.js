class ConditionStrategy {
  constructor(body) {
    this.body = body
  }
  readUsers() {
    return [
      "5511943666624@s.whatsapp.net",
      "5511981030433@s.whatsapp.net",
      "5511941434324@s.whatsapp.net"
    ]
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
    return this.readUsers().find(user => user === this.body.data.key.participant)
  }
}

module.exports = ConditionStrategy