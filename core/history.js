/**
 * Chat History
 * Persists messages per session in SQLite.
 * Keeps last 20 messages to stay within context limits.
 */

const { getDb } = require('./db')

function saveMessage(sessionId, role, content) {
  const db = getDb()
  db.prepare(
    'INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)'
  ).run(sessionId, role, content)
}

function getHistory(sessionId, limit = 20) {
  const db = getDb()
  const rows = db.prepare(`
    SELECT role, content FROM chat_history
    WHERE session_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(sessionId, limit)

  // Return in chronological order (oldest first)
  return rows.reverse()
}

function clearHistory(sessionId) {
  const db = getDb()
  db.prepare('DELETE FROM chat_history WHERE session_id = ?').run(sessionId)
}

function newSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

module.exports = { saveMessage, getHistory, clearHistory, newSessionId }
