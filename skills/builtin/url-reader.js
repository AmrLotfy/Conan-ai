/**
 * Built-in: URL Reader
 * Fetches a public URL and extracts plain text content.
 * No API key required — uses axios + basic HTML stripping.
 */

const axios = require('axios')

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 8000) // Limit to 8k chars to stay within context
}

module.exports = {
  name: 'read_url',
  description: 'Fetch and read the text content of any public URL. Use this when the user shares a link and wants you to read, summarize, or extract information from it.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The full URL to fetch (must start with http:// or https://).'
      }
    },
    required: ['url']
  },
  async execute(args) {
    const { url } = args

    if (!url || !url.startsWith('http')) {
      return 'Error: A valid URL starting with http:// or https:// is required.'
    }

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ConanAgent/1.0)',
          'Accept':     'text/html,application/xhtml+xml',
        },
        maxContentLength: 2 * 1024 * 1024, // 2MB max
      })

      const contentType = response.headers['content-type'] || ''

      if (contentType.includes('application/json')) {
        return JSON.stringify(response.data, null, 2).slice(0, 8000)
      }

      if (contentType.includes('text')) {
        return stripHtml(String(response.data))
      }

      return `Could not read content of type: ${contentType}`
    } catch (err) {
      if (err.response) {
        return `Failed to fetch URL (HTTP ${err.response.status}): ${url}`
      }
      return `Failed to fetch URL: ${err.message}`
    }
  }
}
