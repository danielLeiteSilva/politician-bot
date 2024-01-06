const request = require('request')

class ChatGptClient {
  constructor() {
    this.url = process.env.OPEN_AI
    this.token = process.env.GPT_TOKEN
  }

  generatePayloadText(text) {
    return {
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: text,
        max_tokens: 2048,
        temperature: 0,
        top_p: 1
      }),
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json"
      }
    }
  }

  gptAnalisysText(text) {
    return new Promise((resolve) => {
      try {
        request.post(this.url, this.generatePayloadText(text), (error, response, body) => {
          if (!error) {
            if (response.statusCode === 200) {
              const result = JSON.parse(body)["choices"][0]["text"]
              resolve({ message: JSON.parse(result), code: response.statusCode })
            } else {
              resolve({ message: "Not possible resolve request", code: response.statusCode })
            }
          } else {
            resolve({ message: error, code: response.statusCode })
          }
        })

      } catch (Exception) {
        resolve({ message: Exception, code: 404 })
      }
    })
  }
}

module.exports = ChatGptClient