# Politician Bot

Bot de WhatsApp que detecta e remove automaticamente mensagens com conteudo politico em grupos, utilizando um **MCP Server** (Model Context Protocol) para classificacao via ChatGPT.

## Como funciona

```
WhatsApp Group ──> Webhook ──> Filtro ──> MCP Client ──> MCP Server ──> ChatGPT
                   (POST)      (evento,    (chama tool)   (classify_     (classifica
                                contexto,                  political_     conteudo)
                                usuario)                   content)
                                                                  ↓
                                                           Acao (deleta + aviso)
```

1. **Webhook** — O servidor recebe eventos de mensagens do WhatsApp via `POST /webhook`
2. **Filtro** — Verifica se o evento e uma mensagem nova (`messages.upsert`), se nao e uma mensagem de contexto e se o usuario esta na lista de monitoramento
3. **MCP Client** — Envia o texto para o MCP Server via protocolo MCP (stdio transport)
4. **MCP Server** — Expoe a tool `classify_political_content` que chama a API do ChatGPT e retorna `{ isPolitico: true/false, code: number }`
5. **Acao** — Se classificado como politico, o bot deleta a mensagem original e envia um aviso no grupo

### Arquitetura MCP

O bot utiliza o **Model Context Protocol (MCP)** para desacoplar a logica de classificacao:

- **MCP Server** (`src/mcp-server/index.ts`) — Servidor que expoe a tool `classify_political_content`. Encapsula toda a comunicacao com a API da OpenAI
- **MCP Client** (`src/client/McpClassifierClient.ts`) — Cliente que se conecta ao MCP Server via stdio e chama a tool de classificacao
- **ChatGptService** (`src/service/ChatGptService.ts`) — Servico que usa o MCP Client para classificar conteudo

**Vantagens:**
- Desacoplamento — O bot nao precisa saber qual LLM esta sendo usado
- Reutilizacao — Outros projetos podem consumir o mesmo MCP Server
- Testabilidade — Facil mockar o MCP Client nos testes
- Flexibilidade — Troque de OpenAI para outro provedor sem alterar o bot

## Requisitos

- **Node.js** >= 18.0.0
- Conta na **OpenAI** com chave de API
- Instancia da **WhatsApp API** (ex: Evolution API, CodeChat)

## Instalacao

```bash
# Clonar o repositorio
git clone https://github.com/danielLeiteSilva/politician-bot.git
cd politician-bot

# Instalar dependencias
npm install

# Copiar arquivo de variaveis de ambiente
cp .env.example .env

# Editar o .env com suas credenciais
```

## Configuracao

Edite o arquivo `.env` com as variaveis abaixo:

| Variavel | Descricao | Exemplo |
|---|---|---|
| `OPEN_AI` | URL da API do ChatGPT | `https://api.openai.com/v1/chat/completions` |
| `GPT_TOKEN` | Chave de API da OpenAI | `sk-...` |
| `GPT_MODEL` | Modelo do ChatGPT | `gpt-3.5-turbo` |
| `API_KEY_WHATSAPP` | Chave de API do WhatsApp | — |
| `API_ROUTE` | URL base da API do WhatsApp | `https://sua-api.com` |
| `SEND_MESSAGE` | Rota para enviar mensagem | `/message/sendText/` |
| `DELETE_ALL_MESSAGE` | Rota para deletar mensagem | `/chat/deleteMessageForEveryone/` |
| `INSTANCE_API` | ID da instancia do WhatsApp | — |
| `MONITORED_USERS` | Numeros monitorados (separados por virgula) | `5511999999999@s.whatsapp.net` |
| `PORT` | Porta do servidor | `3000` |

> Se `MONITORED_USERS` estiver vazio, **todos** os usuarios do grupo serao monitorados.

## Executando

```bash
# Modo producao (requer build)
npm run build
npm start

# Modo desenvolvimento (com hot-reload)
npm run dev
```

O servidor inicia na porta configurada (padrao: `3000`).

## Endpoint

### `POST /webhook`

Recebe eventos de mensagens do WhatsApp e processa automaticamente.

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "120363000000000000@g.us",
      "fromMe": false,
      "id": "3EB0A0000000000000",
      "participant": "5511999999999@s.whatsapp.net"
    },
    "message": {
      "conversation": "Texto da mensagem enviada no grupo"
    }
  }
}
```

**Campos do body:**

| Campo | Tipo | Descricao |
|---|---|---|
| `event` | `string` | Tipo do evento. Apenas `messages.upsert` e processado |
| `data.key.remoteJid` | `string` | ID do grupo ou conversa |
| `data.key.fromMe` | `boolean` | Se a mensagem foi enviada pelo proprio bot |
| `data.key.id` | `string` | ID unico da mensagem |
| `data.key.participant` | `string` | Numero do remetente (formato WhatsApp) |
| `data.message.conversation` | `string` | Texto da mensagem |
| `data.messageContextInfo` | `object \| undefined` | Informacoes de contexto (mensagens com contexto sao ignoradas) |

**Respostas:**

| Status | Body | Descricao |
|---|---|---|
| `200` | `{ "status": "ok" }` | Webhook processado com sucesso |
| `500` | `{ "error": "Erro interno ao processar mensagem" }` | Erro interno do servidor |

**Fluxo de processamento:**

1. Verifica se `event === "messages.upsert"`
2. Verifica se `messageContextInfo` e `undefined` (ignora mensagens de contexto/citacao)
3. Verifica se o `participant` esta na lista `MONITORED_USERS` (ou aceita todos se vazio)
4. Envia o texto para o ChatGPT para classificacao
5. Se `isPolitico === true`:
   - Deleta a mensagem original via API do WhatsApp
   - Envia mensagem de aviso no grupo

**Mensagem de aviso enviada:**

> Conteudo politico
>
> Essa mensagem contem conteudo politico. Para um bom convivio, evite esse tipo de conteudo.

## Testes

```bash
# Executar testes
npm test

# Executar com cobertura
npm run test:coverage
```

**Suites de teste:**

| Modulo | Testes | O que testa |
|---|---|---|
| `McpClassifierClient` | 8 | Classificacao via MCP, erros, conexao, desconexao |
| `ChatGptClient` | 7 | Payload, respostas OK/erro, erros de rede |
| `MCP Server` | 4 | Payload, classificacao politica, erros de API e rede |
| `DeleteModel` | 1 | Extracao de propriedades do webhook |
| `ConditionMessageStrategy` | 11 | readUsers, isEvent, isContext, isUser, isCondition |
| `GptStrategy` | 5 | Classificacao politica, mensagem undefined, erros |
| `Strategy` | 2 | Execucao e propagacao de erros |
| `MessageStrategy` | 3 | Fluxo completo, condicoes nao atendidas |

## Estrutura do projeto

```
politician-bot/
├── src/
│   ├── server.ts                  # Servidor Express + endpoint webhook
│   ├── types.ts                   # Interfaces TypeScript (WebhookBody, etc.)
│   ├── client/
│   │   ├── ChatGptClient.ts       # Cliente HTTP para a API do ChatGPT (legado)
│   │   ├── ChatGptClient.test.ts
│   │   ├── McpClassifierClient.ts # Cliente MCP para classificacao politica
│   │   └── McpClassifierClient.test.ts
│   ├── mcp-server/
│   │   ├── index.ts               # MCP Server com tool classify_political_content
│   │   └── index.test.ts
│   ├── models/
│   │   ├── DeleteModel.ts         # Modelo para deletar mensagem
│   │   ├── DeleteModel.test.ts
│   │   └── MessageModel.ts        # Modelo para enviar mensagem de aviso
│   ├── service/
│   │   ├── ChatGptService.ts      # Servico de analise via MCP Client
│   │   └── WhatsappService.ts     # Servico de envio/delecao no WhatsApp
│   └── strategy/
│       ├── Strategy.ts            # Runner de estrategias
│       ├── Strategy.test.ts
│       ├── MessageStrategy.ts     # Estrategia principal (orquestra o fluxo)
│       ├── MessageStrategy.test.ts
│       ├── ConditionMessageStrategy.ts  # Filtro de condicoes
│       ├── ConditionMessageStrategy.test.ts
│       ├── GptStrategy.ts         # Classificacao via GPT
│       └── GptStrategy.test.ts
├── mensagem.json                  # Texto da mensagem de aviso
├── .env.example                   # Variaveis de ambiente necessarias
├── package.json
├── tsconfig.json
├── tsconfig.test.json
└── jest.config.ts
```

## Scripts disponiveis

| Script | Comando | Descricao |
|---|---|---|
| `build` | `npm run build` | Compila TypeScript para `dist/` |
| `start` | `npm start` | Inicia o servidor (requer build) |
| `dev` | `npm run dev` | Inicia com ts-node (desenvolvimento) |
| `test` | `npm test` | Executa testes unitarios |
| `test:coverage` | `npm run test:coverage` | Executa testes com relatorio de cobertura |

## Tecnologias

- **TypeScript** — Tipagem estatica
- **Express** — Servidor HTTP
- **MCP SDK** — Model Context Protocol para integracao com LLMs
- **OpenAI API** — Classificacao de conteudo via ChatGPT (dentro do MCP Server)
- **Zod** — Validacao de schemas para tools MCP
- **Jest** — Testes unitarios
- **Node.js fetch** — Requisicoes HTTP (nativo do Node 18+)

## Licenca

ISC
