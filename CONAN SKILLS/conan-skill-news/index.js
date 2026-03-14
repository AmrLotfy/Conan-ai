/**
 * conan-skill-news
 * Top headlines via NewsAPI — supports Arabic sources and topic filtering.
 * Get a free key at: https://newsapi.org (100 req/day free)
 *
 * Config key: newsApiKey
 * Usage: conan config set newsApiKey YOUR_KEY
 */

const axios = require('axios')

// Arabic-friendly source mapping
const CATEGORY_SOURCES = {
  // Arabic tech/news sources available on NewsAPI
  arabic: 'al-jazeera-english,bbc-arabic',
  tech:   'techcrunch,the-verge,wired,ars-technica',
  world:  'bbc-news,reuters,al-jazeera-english,associated-press',
  sports: 'bbc-sport,espn,fox-sports',
  business: 'bloomberg,financial-times,the-wall-street-journal',
}

module.exports = {
  name: 'get_news',
  description: 'Get top news headlines by topic or category. Supports tech, world, sports, business news. Great for "what\'s happening in tech today?" or "latest news about AI".',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Topic or keywords to search news for (e.g. "artificial intelligence", "Egypt", "crypto"). Optional if category is provided.'
      },
      category: {
        type: 'string',
        enum: ['tech', 'world', 'sports', 'business', 'arabic'],
        description: 'News category filter. Use "arabic" for Arabic-language sources.'
      },
      count: {
        type: 'number',
        description: 'Number of headlines to return (1-5, default 5).'
      }
    }
  },

  async execute(args, context) {
    const { query, category, count = 5 } = args
    const apiKey = context?.config?.newsApiKey

    if (!apiKey) {
      return [
        '❌ NewsAPI key not configured.',
        '  Get a free key at: https://newsapi.org',
        '  Then run: conan config set newsApiKey YOUR_KEY'
      ].join('\n')
    }

    const maxCount = Math.min(Math.max(1, count), 5)

    try {
      let url
      const params = {
        apiKey,
        pageSize: maxCount,
        language: category === 'arabic' ? 'ar' : 'en',
      }

      if (query) {
        // Search by keyword
        url = 'https://newsapi.org/v2/everything'
        params.q          = query
        params.sortBy     = 'publishedAt'
        params.language   = 'en' // everything endpoint needs explicit lang
        if (category === 'arabic') params.language = 'ar'
      } else {
        // Top headlines by category
        url = 'https://newsapi.org/v2/top-headlines'
        if (category && category !== 'arabic') {
          params.category = category
          params.country  = 'us'
        } else if (category === 'arabic') {
          params.sources = CATEGORY_SOURCES.arabic
        } else {
          params.country = 'us'
        }
      }

      const response = await axios.get(url, { params, timeout: 15000 })
      const articles  = response.data.articles || []

      if (!articles.length) {
        const topic = query || category || 'general'
        return `No news found for "${topic}" right now. Try a different query.`
      }

      const label = query
        ? `📰 News about: **${query}**`
        : `📰 Top **${category || 'headlines'}** news`

      const lines = [label, '']

      articles.slice(0, maxCount).forEach((a, i) => {
        const source    = a.source?.name || 'Unknown'
        const published = a.publishedAt
          ? new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : ''
        const desc = a.description
          ? (a.description.length > 120 ? a.description.slice(0, 120).trim() + '...' : a.description)
          : ''

        lines.push(`${i + 1}. **${a.title}**`)
        lines.push(`   ${source}${published ? ' · ' + published : ''}`)
        if (desc) lines.push(`   ${desc}`)
        if (a.url) lines.push(`   🔗 ${a.url}`)
        lines.push('')
      })

      return lines.join('\n').trim()

    } catch (err) {
      if (err.response?.status === 401) {
        return '❌ Invalid NewsAPI key. Check your key at https://newsapi.org'
      }
      if (err.response?.status === 429) {
        return '❌ NewsAPI rate limit reached. Free tier: 100 requests/day.'
      }
      if (err.code === 'ECONNABORTED') {
        return '❌ News request timed out. Try again.'
      }
      return `❌ News fetch failed: ${err.message}`
    }
  }
}
