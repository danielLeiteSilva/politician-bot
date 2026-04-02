require('dotenv').config()
const express = require('express')
const Strategy = require('./strategy/Strategy')
const MessageStrategy = require('./strategy/MessageStrategy')
const app = express()
app.use(express.json())

app.post("/webhook", async (req, res) => {
  try {
    const strategy = new Strategy(req.body)
    await strategy.runner(MessageStrategy)
    res.status(200).json({ status: "ok" })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    res.status(500).json({ error: "Erro interno ao processar mensagem" })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor conectado na porta ${PORT}`))
