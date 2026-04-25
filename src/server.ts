import "dotenv/config"
import express, { Request, Response } from "express"
import { Strategy } from "./strategy/Strategy"
import { MessageStrategy } from "./strategy/MessageStrategy"
import { logger } from "./utils/logger"

const app = express()
app.use(express.json())

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  })
  next()
})

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

app.post("/webhook", async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    logger.info("Iniciando processamento do webhook", {
      body: req.body,
      timestamp: new Date().toISOString()
    })

    // Validação básica do payload
    if (!req.body || typeof req.body !== 'object') {
      logger.error("Payload inválido recebido", { body: req.body })
      return res.status(400).json({ 
        error: "Payload inválido",
        code: "INVALID_PAYLOAD"
      })
    }

    const strategy = new Strategy(req.body)
    await strategy.runner(MessageStrategy)
    
    const duration = Date.now() - startTime
    logger.info("Webhook processado com sucesso", {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
    
    res.status(200).json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    logger.error("Erro ao processar webhook", {
      error: errorMessage,
      stack: errorStack,
      body: req.body,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
    
    res.status(500).json({ 
      error: "Erro interno ao processar mensagem",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    })
  }
})

// Middleware de tratamento de erros global
app.use((error: Error, req: Request, res: Response, next: any) => {
  logger.error("Erro não tratado no servidor", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })
  
  res.status(500).json({
    error: "Erro interno do servidor",
    code: "SERVER_ERROR",
    timestamp: new Date().toISOString()
  })
})

// Middleware para rotas não encontradas
app.use((req: Request, res: Response) => {
  logger.warn("Rota não encontrada", {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })
  
  res.status(404).json({
    error: "Rota não encontrada",
    code: "NOT_FOUND",
    timestamp: new Date().toISOString()
  })
})

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  logger.info(`Servidor iniciado com sucesso`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM, iniciando graceful shutdown')
  server.close(() => {
    logger.info('Servidor encerrado com sucesso')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('Recebido SIGINT, iniciando graceful shutdown')
  server.close(() => {
    logger.info('Servidor encerrado com sucesso')
    process.exit(0)
  })
})

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada', {
    reason: String(reason),
    promise: String(promise),
    timestamp: new Date().toISOString()
  })
  process.exit(1)
})

export { app }