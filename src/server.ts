import "dotenv/config"
import express, { Request, Response } from "express"
import { Strategy } from "./strategy/Strategy"
import { MessageStrategy } from "./strategy/MessageStrategy"

const app = express()
app.use(express.json())

app.post("/webhook", async (req: Request, res: Response) => {
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

export { app }
