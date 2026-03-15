/**
 * Agent Loop — Heart of Conan
 *
 * 1. Build messages (system prompt + history + user message)
 * 2. Call LLM with tools
 * 3. If tool call → execute skill → feed result back → repeat
 * 4. If text response → return it
 * Max 5 iterations to prevent infinite loops.
 */

const llm           = require('./llm')
const history       = require('./history')
const SkillRegistry = require('./skill-registry')
const { buildSystemPrompt } = require('./prompt-builder')
const memory        = require('./memory')
const config        = require('./config')

// Built-in skills
const timeTool     = require('../skills/builtin/time')
const memoryTool   = require('../skills/builtin/memory')
const reminderTool = require('../skills/builtin/reminder')
const urlTool      = require('../skills/builtin/url-reader')

const MAX_ITERATIONS = 5

function buildRegistry() {
  const registry = new SkillRegistry()

  // Built-ins — always registered
  registry
    .register(timeTool)
    .register(memoryTool)
    .register(reminderTool)
    .register(urlTool)

  // External skills — loaded from config
  const cfg = config.load()
  const installedSkills = cfg.skills || []

  for (const pkgName of installedSkills) {
    try {
      const skill = require(pkgName)
      // Support both single skill and array of skills
      if (Array.isArray(skill)) {
        skill.forEach(s => registry.register(s))
      } else {
        registry.register(skill)
      }
    } catch (err) {
      // Skill package not found — silently skip
      // User can run `conan skill list` to see what's broken
    }
  }

  return registry
}

async function chat(sessionId, userMessage) {
  // Save user message to history
  history.saveMessage(sessionId, 'user', userMessage)

  // Build registry + tools
  const registry = buildRegistry()
  const tools    = registry.toolDefinitions()

  // Build context object passed to skills
  const context = { config: config.load(), memory }

  // Build active skill names for system prompt
  const activeSkillNames = registry.list().map(s => s.name)

  // Build messages array
  const systemPrompt = buildSystemPrompt(activeSkillNames)
  const chatHistory  = history.getHistory(sessionId, 20)

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
  ]

  let iterations = 0

  while (iterations < MAX_ITERATIONS) {
    iterations++

    const data   = await llm.call(messages, tools)
    const choice = data.choices?.[0]
    const msg    = choice?.message

    if (!msg) throw new Error('Empty response from LLM')

    const toolCalls = msg.tool_calls
    const content   = msg.content

    // Add assistant message to running messages
    const assistantMsg = { role: 'assistant', content: content || '' }
    if (toolCalls) assistantMsg.tool_calls = toolCalls
    messages.push(assistantMsg)

    // If no tool calls — we have the final answer
    if (!toolCalls || toolCalls.length === 0) {
      const finalText = content || 'Done.'
      history.saveMessage(sessionId, 'assistant', finalText)
      return finalText
    }

    // Execute each tool call
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name
      const args     = JSON.parse(toolCall.function.arguments || '{}')

      let result
      try {
        if (registry.has(toolName)) {
          result = await registry.execute(toolName, args, context)
        } else {
          result = `Tool "${toolName}" is not available.`
        }
      } catch (err) {
        result = `Tool error: ${err.message}`
      }

      // Feed tool result back into messages
      messages.push({
        role:         'tool',
        tool_call_id: toolCall.id,
        name:         toolName,
        content:      String(result),
      })
    }
  }

  return 'I reached the maximum number of steps. Please try rephrasing your question.'
}

module.exports = { chat, buildRegistry }
