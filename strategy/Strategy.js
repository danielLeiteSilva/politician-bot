class Strategy {
  constructor(body) {
    this.body = body
  }
  runner = async (instance) => {
    await new instance(this.body).run()
  }
}

module.exports = Strategy