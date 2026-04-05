import Anthropic from '@anthropic-ai/sdk'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadContextRepo } from './context-loader.js'
import { buildSystemPrompt } from './prompts/system.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MCP_SERVER_PATH = path.resolve(__dirname, '../mcp-server/index.ts')

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type MessageParam = Anthropic.MessageParam
type ToolUseBlock = Anthropic.ToolUseBlock
type ToolResultBlockParam = Anthropic.ToolResultBlockParam

interface McpTool {
  name: string
  description?: string
  input_schema: Record<string, unknown>
}

interface McpResponse {
  content: Array<{ type: string; text?: string }>
}

// Spawns the MCP server as a child process and returns a simple call interface
function spawnMcpClient(userId: string) {
  const child = spawn('npx', ['tsx', MCP_SERVER_PATH], {
    env: {
      ...process.env,
      ACTING_USER_ID: userId,
    },
    stdio: ['pipe', 'pipe', 'inherit'], // stdin/stdout piped, stderr inherited
  })

  let buffer = ''
  let requestId = 0
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()

  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line)
        if (msg.id !== undefined && pending.has(msg.id)) {
          const p = pending.get(msg.id)!
          pending.delete(msg.id)
          if (msg.error) p.reject(new Error(msg.error.message ?? 'MCP error'))
          else p.resolve(msg.result)
        }
      } catch { /* non-JSON stderr noise */ }
    }
  })

  function send(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++requestId
      pending.set(id, { resolve, reject })
      const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params })
      child.stdin.write(msg + '\n')
    })
  }

  async function initialize() {
    await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'utomopia-agent-runner', version: '1.0.0' },
    })
    await send('notifications/initialized', {})
  }

  async function listTools(): Promise<McpTool[]> {
    const result = await send('tools/list', {}) as { tools: McpTool[] }
    return result.tools
  }

  async function callTool(name: string, args: Record<string, unknown>): Promise<McpResponse> {
    const result = await send('tools/call', { name, arguments: args }) as McpResponse
    return result
  }

  function close() {
    child.kill()
  }

  return { initialize, listTools, callTool, close }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function summarizeHistory(messages: MessageParam[]): Promise<string> {
  // Simple truncation: take last 10 messages as summary context
  const recent = messages.slice(-10)
  return `[Prior context truncated. Recent exchanges: ${recent.map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).join(' | ')}]`
}

export async function runContinuousAgent(userId: string, displayName: string): Promise<never> {
  const context = loadContextRepo(userId)
  const systemPrompt = buildSystemPrompt(context, userId, displayName)

  console.log(`[agent:${displayName}] Starting continuous session`)

  // Outer loop: restart session after context blowup or extended rest
  while (true) {
    const mcp = spawnMcpClient(userId)
    try {
      await mcp.initialize()
      const rawTools = await mcp.listTools()

      // Convert MCP tool format to Anthropic tool format
      const tools: Anthropic.Tool[] = rawTools.map(t => ({
        name: t.name,
        description: t.description ?? '',
        input_schema: t.input_schema as Anthropic.Tool['input_schema'],
      }))

      const messages: MessageParam[] = [{
        role: 'user',
        content: 'The platform is live. Act as yourself. Keep going.',
      }]

      // Inner loop: agentic tool-use loop
      let iterations = 0
      while (true) {
        iterations++

        const response = await claude.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8096,
          system: systemPrompt,
          messages,
          tools,
        })

        messages.push({ role: 'assistant', content: response.content })

        if (response.stop_reason === 'tool_use') {
          const toolUseBlocks = response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use')
          const toolResults: ToolResultBlockParam[] = []

          for (const block of toolUseBlocks) {
            console.log(`[agent:${displayName}] → ${block.name}`, JSON.stringify(block.input).slice(0, 120))
            try {
              const result = await mcp.callTool(block.name, block.input as Record<string, unknown>)
              const text = result.content[0]?.text ?? 'No result'
              console.log(`[agent:${displayName}] ← ${text.slice(0, 80)}`)
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: text })
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err)
              console.error(`[agent:${displayName}] Tool error: ${errMsg}`)
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error: ${errMsg}`, is_error: true })
            }
          }

          messages.push({ role: 'user', content: toolResults })

        } else if (response.stop_reason === 'end_turn') {
          // Agent naturally finished — rest 30s then nudge to check for new activity
          console.log(`[agent:${displayName}] Resting for 30s...`)
          await sleep(30_000)
          messages.push({ role: 'user', content: 'Resume. Check for anything new on the platform.' })

        } else {
          // max_tokens hit — summarize and restart inner loop to avoid context blowup
          console.log(`[agent:${displayName}] Context limit hit after ${iterations} iterations, summarizing...`)
          const summary = await summarizeHistory(messages)
          mcp.close()

          // Restart with fresh session
          await sleep(2_000)
          messages.length = 0
          messages.push({ role: 'user', content: `${summary}\n\nContinue acting as yourself.` })
          break // Break inner loop to restart mcp client
        }
      }
    } catch (err) {
      console.error(`[agent:${displayName}] Session error:`, err)
      mcp.close()
      await sleep(10_000) // Back off before retrying
    }
  }
}
