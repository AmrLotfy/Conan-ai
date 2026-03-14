/**
 * LLM Client
 * Supports three providers: OpenRouter, OpenAI, Anthropic.
 * Provider is auto-detected from config.provider (default: openrouter).
 */

const axios  = require('axios')
const config = require('./config')

const PROVIDERS = {
  openrouter: {
    url:        'https://openrouter.ai/api/v1/chat/completions',
    keyField:   'openrouterKey',
    keyError:   'OpenRouter API key not set. Run: conan init',
    headers:    (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://github.com/AmrLotfy/Conan-ai',
      'X-Title':       'Conan AI Agent',
    }),
    // OpenRouter needs the model in the payload as-is (e.g. "openai/gpt-4o-mini")
    buildPayload: (model, messages, tools, toolChoice) => {
      const payload = { model, messages, temperature: 0.1 }
      if (tools.length > 0) { payload.tools = tools; payload.tool_choice = toolChoice }
      return payload
    },
  },

  openai: {
    url:        'https://api.openai.com/v1/chat/completions',
    keyField:   'openaiKey',
    keyError:   'OpenAI API key not set. Run: conan init',
    headers:    (key) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    }),
    // OpenAI model names don't need a prefix (e.g. "gpt-4o-mini" not "openai/gpt-4o-mini")
    buildPayload: (model, messages, tools, toolChoice) => {
      const cleanModel = model.replace(/^openai\//, '')
      const payload = { model: cleanModel, messages, temperature: 0.1 }
      if (tools.length > 0) { payload.tools = tools; payload.tool_choice = toolChoice }
      return payload
    },
  },

  anthropic: {
    url:        'https://api.anthropic.com/v1/messages',
    keyField:   'anthropicKey',
    keyError:   'Anthropic API key not set. Run: conan init',
    headers:    (key) => ({
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    }),
    // Anthropic has a different API shape — system message is separate, tools format differs
    buildPayload: (model, messages, tools, toolChoice) => {
      const cleanModel = model.replace(/^anthropic\//, '')
      // Extract system message
      const systemMsg = messages.find(m => m.role === 'system')
      const chatMsgs  = messages.filter(m => m.role !== 'system')

      const payload = {
        model:      cleanModel,
        max_tokens: 4096,
        messages:   chatMsgs,
      }
      if (systemMsg) payload.system = systemMsg.content

      if (tools.length > 0) {
        // Convert OpenAI tool format to Anthropic format
        payload.tools = tools.map(t => ({
          name:         t.function.name,
          description:  t.function.description,
          input_schema: t.function.parameters,
        }))
        if (toolChoice !== 'auto') payload.tool_choice = { type: 'auto' }
      }
      return payload
    },
    // Anthropic response shape is different — normalize it to OpenAI shape
    normalizeResponse: (data) => {
      const content    = data.content || []
      const textBlock  = content.find(b => b.type === 'text')
      const toolBlocks = content.filter(b => b.type === 'tool_use')

      const message = { role: 'assistant', content: textBlock?.text || null }

      if (toolBlocks.length > 0) {
        message.tool_calls = toolBlocks.map((b, i) => ({
          id:       b.id || `call_${i}`,
          type:     'function',
          function: { name: b.name, arguments: JSON.stringify(b.input) },
        }))
      }

      return { choices: [{ message, finish_reason: data.stop_reason }] }
    },
  },
}

async function call(messages, tools = [], toolChoice = 'auto') {
  const cfg      = config.load()
  const provider = cfg.provider || 'openrouter'
  const model    = cfg.model    || 'openai/gpt-4o-mini'

  const p = PROVIDERS[provider]
  if (!p) throw new Error(`Unknown provider: "${provider}". Valid options: openrouter, openai, anthropic`)

  const key = cfg[p.keyField]
  if (!key) throw new Error(p.keyError)

  const payload  = p.buildPayload(model, messages, tools, toolChoice)
  const response = await axios.post(p.url, payload, {
    headers: p.headers(key),
    timeout: 60000,
  })

  // Normalize Anthropic's response shape to match OpenAI/OpenRouter
  if (p.normalizeResponse) {
    return p.normalizeResponse(response.data)
  }

  return response.data
}

module.exports = { call }
