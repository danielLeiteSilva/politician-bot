class DeleteModel{
  constructor(body) {
      this.remoteJid = body.data.key.remoteJid
      this.fromMe = body.data.key.fromMe
      this.id = body.data.key.id
      this.participant = body.data.key.participant
  }
}

module.exports = DeleteModel