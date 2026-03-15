/**
 * Long-Term Memory
 * Stores and retrieves facts across sessions using SQLite.
 * remember / recall / list / forget — persistent facts across sessions.
 */

const { getDb } = require('./db')

function remember(fact, category = 'general') {
  const db = getDb()

  // Exact-match dedup — don't store the same fact twice
  const existing = db.prepare(
    'SELECT id FROM memories WHERE LOWER(fact) = LOWER(?)'
  ).get(fact)

  if (existing) return { stored: false, reason: 'Already remembered' }

  db.prepare(
    'INSERT INTO memories (fact, category) VALUES (?, ?)'
  ).run(fact, category)

  return { stored: true }
}

function recall(query) {
  const db = getDb()
  const rows = db.prepare(
    "SELECT * FROM memories WHERE fact LIKE ? ORDER BY created_at DESC LIMIT 10"
  ).all(`%${query}%`)
  return rows
}

function list() {
  const db = getDb()
  return db.prepare('SELECT * FROM memories ORDER BY category, created_at ASC').all()
}

function forget(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM memories WHERE id = ?').run(id)
  return result.changes > 0
}

function buildMemoryBlock() {
  const memories = list()
  if (!memories.length) return ''

  const lines = memories.map(m => `- [${m.category}] ${m.fact}`).join('\n')
  return `\nWhat you know about this user (remembered from past conversations):\n${lines}\n`
}

module.exports = { remember, recall, list, forget, buildMemoryBlock }
