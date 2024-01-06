require('dotenv').config()
const express = require('express')
const Strategy = require('./strategy/Strategy')
const MessageStrategy = require('./strategy/MessageStrategy')
const app = express()
app.use(express.json())

app.post("/webhook", async (req, res) => {
  const strategy = new Strategy(req.body)
  strategy.runner(MessageStrategy)
})

app.listen(3000, () => console.log('Connected'))