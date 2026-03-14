/**
 * LLM Client
 * Calls OpenRouter API with messages + tools.
 * Model is configurable via config.json.
 */

const axios  = require('axios')
const config = require('./config')

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function call(messages, tools = [], toolChoice = 'auto') {
  const cfg   = config.load()
  const model = cfg.model || 'openai/gpt-4o-mini'
  const key   = cfg.openrouterKey

  if (!key) {
    throw new Error('OpenRouter API key not set. Run: conan init')
  }

  const payload = {
    model,
    messages,
    temperature: 0.1,
  }

  if (tools.length > 0) {
    payload.tools       = tools
    payload.tool_choice = toolChoice
  }

  const response = await axios.post(OPENROUTER_URL, payload, {
    headers: {
      'Authorization':  `Bearer ${key}`,
      'Content-Type':   'application/json',
      'HTTP-Referer':   'https://github.com/conan-ai',
      'X-Title':        'Conan AI Agent',
    },
    timeout: 60000,
  })

  return response.data
}

module.exports = { call }
