/**
 * Built-in: Reminder Tool
 * Stores reminders in SQLite. A background checker fires them.
 */

const { getDb } = require('../../core/db')

module.exports = {
  name: 'set_reminder',
  description: 'Set a reminder for a specific date and time. The user will be notified when the time comes.',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The reminder message to show when it fires.'
      },
      fire_at: {
        type: 'string',
        description: 'ISO 8601 datetime when the reminder should fire (e.g. "2026-03-15T09:00:00").'
      }
    },
    required: ['message', 'fire_at']
  },
  async execute(args) {
    const { message, fire_at } = args

    if (!message) return 'Error: message is required.'
    if (!fire_at) return 'Error: fire_at datetime is required.'

    const db = getDb()
    db.prepare(
      'INSERT INTO reminders (message, fire_at) VALUES (?, ?)'
    ).run(message, fire_at)

    // Format friendly confirmation
    const fireDate = new Date(fire_at)
    const friendly = fireDate.toLocaleString('en-US', {
      weekday: 'short',
      month:   'short',
      day:     'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
    })

    return `✅ Reminder set for ${friendly}: "${message}"`
  }
}
