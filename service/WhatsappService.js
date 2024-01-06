const request = require('request')
const DeleteModel = require('../models/DeleteModel')
const MessageModel = require('../models/MessageModel')
class WhatsappService {

  constructor(body) {
    this.body = body
  }

  HEADERS() {
    return {
      'apikey': process.env.API_KEY_WHATSAPP,
      'Content-Type': 'application/json'
    }
  }

  SEND_MESSAGE(){
    const {...content} = new MessageModel(this.body)
    console.log(content)
    return {
      body: JSON.stringify(content),
      headers: this.HEADERS()
    }
  }


  DELETE_MESSAGE(){
    const {...deleteModel} = new DeleteModel(this.body)
    return {
      body: JSON.stringify(deleteModel),
      headers: this.HEADERS()
    }
  }

  sendMessage() {
    return new Promise((resolve, reject) => {
      request.post(`${process.env.API_ROUTE}${process.env.SEND_MESSAGE}${process.env.INSTANCE_API}`, this.SEND_MESSAGE(), (error, response, body) => {
        if (!error) {
          if (response.statusCode === 200 || response.statusCode === 201) {
            return resolve(body)
          } else {
            return reject(response.statusCode)
          }
        } else {
          return reject(error)
        }
      })
    })
  }

  deleteMessage() {
    return new Promise((resolve, reject) => {
      request.delete(`${process.env.API_ROUTE}${process.env.DELETE_ALL_MESSAGE}${process.env.INSTANCE_API}`, this.DELETE_MESSAGE(), (error, response, body) => {
        if (!error) {
          if (response.statusCode === 200 || response.statusCode === 201) {
            return resolve(body)
          } else {
            return reject(response.statusCode)
          }
        } else {
          return reject(error)
        }
      })
    })
  }
}


module.exports = WhatsappService