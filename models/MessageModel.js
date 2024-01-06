const fs = require('fs')
const path = require('path')
class MessageModel{
  constructor(body) { 
    this.number = body.data.key.remoteJid
    this.options = {
      delay: 0
    }
    this.textMessage = {
      text: this.readMessage()
    }
  }

  readMessage(){
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'mensagem.json')))[0]["mensagem"]
  }
}

module.exports = MessageModel