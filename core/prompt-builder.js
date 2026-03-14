/**
 * System Prompt Builder
 * Builds the system prompt injected at the start of every LLM call.
 * Injects: user name, current time, timezone, long-term memories, active skills.
 */

const memory = require('./memory')
const config = require('./config')

function buildSystemPrompt(activeSkillNames = []) {
  const cfg  = config.load()
  const name = cfg.name || 'there'
  const tz   = cfg.timezone || 'UTC'

  // Current date/time in user's timezone
  const now = new Date().toLocaleString('en-US', {
    timeZone:     tz,
    weekday:      'long',
    year:         'numeric',
    month:        'short',
    day:          '2-digit',
    hour:         '2-digit',
    minute:       '2-digit',
    timeZoneName: 'short',
  })

  // Long-term memory block
  const memoryBlock = memory.buildMemoryBlock()

  // Active skills list
  const skillsLine = activeSkillNames.length > 0
    ? `\nActive skills: ${activeSkillNames.join(', ')}\n`
    : ''

  return (
    `You are Conan, a personal AI agent built for ${name}.\n` +
    `Current date/time: ${now}\n` +
    memoryBlock +
    skillsLine +
    `- Reply in the same language the user used.\n` +
    `- Be concise. Answer only what was asked.\n` +
    `- Before asking the user for any information, check the memory block above first. If it's already known, use it — never ask for something you already know.\n` +
    `- When asked who you are or what you can do, introduce yourself naturally as Conan — a personal AI agent. Mention active skills if any.\n` +
    `- Do NOT introduce yourself or add greetings when the user hasn't asked.\n` +
    `- When a tool is available, always call it — never infer from memory or previous answers.\n` +
    `- Memory tool: call remember() proactively when the user shares something personal (name, job, preferences, schedules). ` +
    `Call list() when asked "what do you know about me?". Call forget() when asked to forget something.\n` +
    `- Memory IDs are internal — NEVER show them to the user.\n` +
    `- Reminder tool: call set_reminder whenever the user asks to be reminded at a specific time. ` +
    `Compute absolute datetime from relative times (e.g. "in 2 hours") using the current time above.\n`
  )
}

module.exports = { buildSystemPrompt }
