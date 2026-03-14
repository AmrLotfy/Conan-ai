/**
 * SQLite Database
 * Single connection to ~/.conan/conan.db
 * Tables: memories, chat_history, reminders
 */

const Database = require('better-sqlite3')
const path     = require('path')
const { getConanDir } = require('./config')

let _db = null

function getDb() {
  if (_db) return _db

  const dbPath = path.join(getConanDir(), 'conan.db')
  _db = new Database(dbPath)

  // Enable WAL mode for better performance
  _db.pragma('journal_mode = WAL')

  // Create tables if they don't exist
  _db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      fact       TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      message       TEXT NOT NULL,
      fire_at       TEXT NOT NULL,
      fired         INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  return _db
}

module.exports = { getDb }
