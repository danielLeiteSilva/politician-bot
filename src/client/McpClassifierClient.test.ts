import { McpClassifierClient } from "./McpClassifierClient"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

jest.mock("@modelcontextprotocol/sdk/client/index.js")
jest.mock("@modelcontextprotocol/sdk/client/stdio.js")

describe("McpClassifierClient", () => {
  let mockCallTool: jest.Mock
  let mockConnect: jest.Mock
  let mockClose: jest.Mock

  beforeEach(() => {
    mockCallTool = jest.fn()
    mockConnect = jest.fn().mockResolvedValue(undefined)
    mockClose = jest.fn().mockResolvedValue(undefined)

    ;(Client as jest.MockedClass<typeof Client>).mockImplementation(
      () =>
        ({
          callTool: mockCallTool,
          connect: mockConnect,
          close: mockClose,
        }) as unknown as Client
    )
    ;(StdioClientTransport as jest.MockedClass<typeof StdioClientTransport>).mockImplementation(
      () => ({}) as unknown as StdioClientTransport
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should classify political content as isPolitico true", async () => {
    mockCallTool.mockResolvedValue({
      content: [
        { type: "text", text: JSON.stringify({ isPolitico: true, code: 200 }) },
      ],
    })

    const client = new McpClassifierClient()
    const result = await client.classifyText("Vote no candidato X")

    expect(result.isPolitico).toBe(true)
    expect(result.code).toBe(200)
    expect(mockCallTool).toHaveBeenCalledWith({
      name: "classify_political_content",
      arguments: { text: "Vote no candidato X" },
    })
  })

  it("should classify non-political content as isPolitico false", async () => {
    mockCallTool.mockResolvedValue({
      content: [
        { type: "text", text: JSON.stringify({ isPolitico: false, code: 200 }) },
      ],
    })

    const client = new McpClassifierClient()
    const result = await client.classifyText("Bom dia pessoal")

    expect(result.isPolitico).toBe(false)
    expect(result.code).toBe(200)
  })

  it("should handle MCP server errors", async () => {
    mockCallTool.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            isPolitico: false,
            code: 500,
            error: "API error",
          }),
        },
      ],
      isError: true,
    })

    const client = new McpClassifierClient()
    const result = await client.classifyText("qualquer texto")

    expect(result.isPolitico).toBe(false)
    expect(result.code).toBe(500)
    expect(result.error).toBe("API error")
  })

  it("should handle invalid response format", async () => {
    mockCallTool.mockResolvedValue({
      content: [],
    })

    const client = new McpClassifierClient()
    const result = await client.classifyText("qualquer texto")

    expect(result.isPolitico).toBe(false)
    expect(result.code).toBe(500)
    expect(result.error).toBe("Resposta invalida do MCP server")
  })

  it("should handle connection errors", async () => {
    mockCallTool.mockRejectedValue(new Error("Connection failed"))

    const client = new McpClassifierClient()
    const result = await client.classifyText("qualquer texto")

    expect(result.isPolitico).toBe(false)
    expect(result.code).toBe(500)
    expect(result.error).toBe("Connection failed")
  })

  it("should handle non-Error exceptions", async () => {
    mockCallTool.mockRejectedValue("unknown error")

    const client = new McpClassifierClient()
    const result = await client.classifyText("qualquer texto")

    expect(result.isPolitico).toBe(false)
    expect(result.code).toBe(500)
    expect(result.error).toBe("Erro desconhecido")
  })

  it("should disconnect properly", async () => {
    mockCallTool.mockResolvedValue({
      content: [
        { type: "text", text: JSON.stringify({ isPolitico: false, code: 200 }) },
      ],
    })

    const client = new McpClassifierClient()
    await client.classifyText("texto")
    await client.disconnect()

    expect(mockClose).toHaveBeenCalled()
  })

  it("should auto-connect on first call", async () => {
    mockCallTool.mockResolvedValue({
      content: [
        { type: "text", text: JSON.stringify({ isPolitico: false, code: 200 }) },
      ],
    })

    const client = new McpClassifierClient()
    await client.classifyText("texto")

    expect(Client).toHaveBeenCalledWith({
      name: "politician-bot",
      version: "2.0.0",
    })
    expect(mockConnect).toHaveBeenCalled()
  })
})
