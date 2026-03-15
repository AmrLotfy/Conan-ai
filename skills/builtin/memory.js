/**
 * Built-in: Memory Tool
 * remember / recall / list / forget
 */

const memoryStore = require('../../core/memory')

module.exports = {
  name: 'memory',
  description: 'Manage long-term memory. Actions: remember (store a fact), recall (search facts), list (all facts), forget (delete by ID).',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['remember', 'recall', 'list', 'forget'],
        description: 'The memory action to perform.'
      },
      fact: {
        type: 'string',
        description: 'The fact to remember (required for action=remember).'
      },
      category: {
        type: 'string',
        enum: ['general', 'preference', 'work', 'schedule', 'contact'],
        description: 'Category for the fact (for action=remember). Default: general.'
      },
      query: {
        type: 'string',
        description: 'Search query (required for action=recall).'
      },
      id: {
        type: 'number',
        description: 'Memory ID to delete (required for action=forget).'
      }
    },
    required: ['action']
  },
  async execute(args) {
    const { action, fact, category, query, id } = args

    switch (action) {
      case 'remember': {
        if (!fact) return 'Error: fact is required for remember action.'
        const result = memoryStore.remember(fact, category || 'general')
        return result.stored
          ? `✅ Remembered: "${fact}"`
          : `Already knew that: "${fact}"`
      }

      case 'recall': {
        if (!query) return 'Error: query is required for recall action.'
        const results = memoryStore.recall(query)
        if (!results.length) return `No memories found matching "${query}".`
        return results.map(m => `[${m.id}] [${m.category}] ${m.fact}`).join('\n')
      }

      case 'list': {
        const all = memoryStore.list()
        if (!all.length) return "I don't have any memories stored yet."
        return all.map(m => `[${m.id}] [${m.category}] ${m.fact}`).join('\n')
      }

      case 'forget': {
        if (!id) return 'Error: id is required for forget action.'
        const deleted = memoryStore.forget(id)
        return deleted ? `✅ Forgot memory #${id}.` : `Memory #${id} not found.`
      }

      default:
        return `Unknown action: ${action}`
    }
  }
}
