/**
 * Built-in: Time Tool
 * Returns current date/time in user's configured timezone.
 */

const config = require('../../core/config')

module.exports = {
  name: 'get_current_time',
  description: 'Get the current date and time in the user\'s local timezone.',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Optional IANA timezone override (e.g. "America/New_York"). Defaults to user timezone.'
      }
    },
    required: []
  },
  async execute(args) {
    const cfg = config.load()
    const tz  = args.timezone || cfg.timezone || 'UTC'

    const now = new Date().toLocaleString('en-US', {
      timeZone:     tz,
      weekday:      'long',
      year:         'numeric',
      month:        'long',
      day:          '2-digit',
      hour:         '2-digit',
      minute:       '2-digit',
      second:       '2-digit',
      timeZoneName: 'short',
    })

    return `Current time in ${tz}: ${now}`
  }
}
