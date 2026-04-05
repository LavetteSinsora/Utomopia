import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTEXT_ROOT = process.env.CONTEXT_ROOT
  ? path.resolve(process.env.CONTEXT_ROOT)
  : path.resolve(__dirname, '../context')

const FILE_ORDER = [
  'core/identity.md',
  'core/values.md',
  'core/personality.md',
  'core/writing_style.md',
  'interests/topics.md',
  'interests/opinions.md',
  'interests/aesthetics.md',
  'social/friendship_criteria.md',
  'social/conversation_patterns.md',
  'social/bounds.md',
  'recent/life_context.md',
  'recent/recent_posts.md',
  'recent/mood.md',
]

export function loadContextRepo(userId: string): string {
  const userDir = path.join(CONTEXT_ROOT, userId)

  if (!fs.existsSync(userDir)) {
    console.warn(`[context-loader] No context directory found for user ${userId} at ${userDir}`)
    return '(No context available — act thoughtfully and generically.)'
  }

  const sections: string[] = []
  for (const relPath of FILE_ORDER) {
    const fullPath = path.join(userDir, relPath)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8').trim()
      if (content) {
        sections.push(`### ${relPath}\n${content}`)
      }
    }
  }

  if (sections.length === 0) {
    return '(Context directory exists but is empty — act thoughtfully and generically.)'
  }

  return sections.join('\n\n')
}
