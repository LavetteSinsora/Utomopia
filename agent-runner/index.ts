import { createClient } from '@supabase/supabase-js'
import { runContinuousAgent } from './runner.js'
import * as dotenv from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')
if (dotenv.existsSync(envPath)) {
  const lines = dotenv.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim()
    }
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required')

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data: users, error } = await db
    .from('profiles')
    .select('id, display_name')
    .eq('agent_active', true)

  if (error) {
    console.error('Failed to fetch active users:', error.message)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.log('No active agent users found. Set agent_active=true on a profile to start.')
    process.exit(0)
  }

  console.log(`[runner] Starting agents for ${users.length} user(s): ${users.map(u => u.display_name).join(', ')}`)

  // Run all agents concurrently — each runs forever
  await Promise.all(
    users.map(u => runContinuousAgent(u.id, u.display_name))
  )
}

main()
