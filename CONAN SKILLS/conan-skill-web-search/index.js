/**
 * conan-skill-web-search
 * Web search via Tavily API — real-time results, source URLs, clean summaries.
 * Get a free key at: https://tavily.com (1000 calls/month free)
 *
 * Config key: tavilyKey
 * Usage: conan config set tavilyKey YOUR_KEY
 */

const axios = require('axios')

module.exports = {
  name: 'web_search',
  description: 'Search the web for real-time information, news, facts, or any topic. Returns relevant results with sources.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up on the web.'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (1-5, default 3).'
      }
    },
    required: ['query']
  },

  async execute(args, context) {
    const { query, max_results = 3 } = args
    const apiKey = context?.config?.tavilyKey

    if (!apiKey) {
      return [
        '❌ Tavily API key not configured.',
        '  Get a free key at: https://tavily.com',
        '  Then run: conan config set tavilyKey YOUR_KEY'
      ].join('\n')
    }

    try {
      const response = await axios.post(
        'https://api.tavily.com/search',
        {
          api_key:     apiKey,
          query:       query,
          max_results: Math.min(Math.max(1, max_results), 5),
          search_depth: 'basic',
          include_answer: true,
        },
        { timeout: 15000 }
      )

      const data    = response.data
      const results = data.results || []

      if (!results.length) {
        return `No results found for: "${query}"`
      }

      const lines = []

      // Direct answer if Tavily provides one
      if (data.answer) {
        lines.push(`**Answer:** ${data.answer}`)
        lines.push('')
      }

      lines.push(`**Search results for:** ${query}\n`)

      results.forEach((r, i) => {
        lines.push(`${i + 1}. **${r.title}**`)
        if (r.content) {
          // Trim to ~200 chars for conciseness
          const snippet = r.content.length > 200
            ? r.content.slice(0, 200).trim() + '...'
            : r.content.trim()
          lines.push(`   ${snippet}`)
        }
        lines.push(`   🔗 ${r.url}`)
        lines.push('')
      })

      return lines.join('\n').trim()

    } catch (err) {
      if (err.response?.status === 401) {
        return '❌ Invalid Tavily API key. Check your key at https://tavily.com'
      }
      if (err.response?.status === 429) {
        return '❌ Tavily rate limit reached. Free tier: 1000 calls/month.'
      }
      if (err.code === 'ECONNABORTED') {
        return '❌ Web search timed out. Try again.'
      }
      return `❌ Web search failed: ${err.message}`
    }
  }
}
