/**
 * Conan Daemon
 * Background process that fires reminders when their time comes.
 *
 * Checks the reminders table every 30 seconds.
 * Fires due reminders via:
 *   - macOS: osascript notification
 *   - Linux: notify-send
 *   - Fallback: console log
 *
 * Run:  conan daemon
 * Stop: Ctrl+C (or kill the process)
 */

const { getDb }        = require('./db')
const { getConanDir }  = require('./config')
const { execSync }     = require('child_process')
const path             = require('path')
const fs               = require('fs')

const POLL_INTERVAL_MS = 30 * 1000  // 30 seconds
const PID_FILE         = path.join(getConanDir(), 'daemon.pid')

// ─── Notification ────────────────────────────────────────────────────────────

function notify(message) {
  const platform = process.platform

  try {
    if (platform === 'darwin') {
      // macOS — native notification
      const escaped = message.replace(/"/g, '\\"').replace(/'/g, "\\'")
      execSync(
        `osascript -e 'display notification "${escaped}" with title "🔍 Conan Reminder" sound name "Ping"'`,
        { timeout: 5000 }
      )
    } else if (platform === 'linux') {
      const escaped = message.replace(/"/g, '\\"')
      execSync(`notify-send "🔍 Conan Reminder" "${escaped}"`, { timeout: 5000 })
    }
  } catch {
    // Notification failed — that's OK, we already logged to console
  }

  // Always log to console too (visible if terminal is open)
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  console.log(`\n  🔔 [${timestamp}] REMINDER: ${message}\n`)
}

// ─── Reminder check ──────────────────────────────────────────────────────────

function checkReminders() {
  try {
    const db  = getDb()
    const now = new Date().toISOString()

    // Find all unfired reminders that are due
    const due = db.prepare(`
      SELECT id, message, fire_at
      FROM reminders
      WHERE fired = 0 AND fire_at <= ?
      ORDER BY fire_at ASC
    `).all(now)

    if (due.length === 0) return

    const markFired = db.prepare('UPDATE reminders SET fired = 1 WHERE id = ?')

    for (const reminder of due) {
      notify(reminder.message)
      markFired.run(reminder.id)
    }
  } catch (err) {
    // DB might not be initialized yet — silently skip
    if (!err.message.includes('no such table')) {
      console.error(`  Daemon error: ${err.message}`)
    }
  }
}

// ─── PID file management ─────────────────────────────────────────────────────

function writePid() {
  fs.writeFileSync(PID_FILE, String(process.pid))
}

function clearPid() {
  try { fs.unlinkSync(PID_FILE) } catch {}
}

function isRunning() {
  if (!fs.existsSync(PID_FILE)) return false
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10)
  try {
    process.kill(pid, 0)  // signal 0 = existence check only
    return pid
  } catch {
    // Process doesn't exist — stale PID file
    clearPid()
    return false
  }
}

// ─── Start ───────────────────────────────────────────────────────────────────

function start() {
  const existingPid = isRunning()
  if (existingPid) {
    console.log(`\n  ⚠️  Conan daemon is already running (PID ${existingPid})\n`)
    console.log(`  Run "conan daemon stop" to stop it.\n`)
    process.exit(0)
  }

  writePid()

  console.log(`\n  🔍 Conan daemon started (PID ${process.pid})`)
  console.log(`  Checking reminders every 30 seconds...`)
  console.log(`  Press Ctrl+C to stop.\n`)

  // Check immediately on start
  checkReminders()

  // Then poll every 30s
  const interval = setInterval(checkReminders, POLL_INTERVAL_MS)

  // Graceful shutdown
  function shutdown() {
    clearInterval(interval)
    clearPid()
    console.log('\n  Daemon stopped.\n')
    process.exit(0)
  }

  process.on('SIGINT',  shutdown)
  process.on('SIGTERM', shutdown)
}

function stop() {
  const existingPid = isRunning()
  if (!existingPid) {
    console.log(`\n  No daemon is running.\n`)
    return
  }
  try {
    process.kill(existingPid, 'SIGTERM')
    clearPid()
    console.log(`\n  ✅ Daemon stopped (was PID ${existingPid})\n`)
  } catch (err) {
    console.log(`\n  ❌ Failed to stop daemon: ${err.message}\n`)
  }
}

function status() {
  const existingPid = isRunning()
  if (existingPid) {
    console.log(`\n  🟢 Conan daemon is running (PID ${existingPid})\n`)
  } else {
    console.log(`\n  🔴 Conan daemon is not running\n`)
  }

  // Show pending reminders
  try {
    const db = getDb()
    const pending = db.prepare(`
      SELECT id, message, fire_at
      FROM reminders
      WHERE fired = 0
      ORDER BY fire_at ASC
    `).all()

    if (pending.length > 0) {
      console.log(`  📋 Pending reminders (${pending.length}):`)
      pending.forEach(r => {
        const t = new Date(r.fire_at).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
        console.log(`    #${r.id} — ${t}: ${r.message}`)
      })
      console.log('')
    } else {
      console.log(`  No pending reminders.\n`)
    }
  } catch {}
}

module.exports = { start, stop, status, isRunning }
