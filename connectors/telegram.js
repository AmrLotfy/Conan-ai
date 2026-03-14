/**
 * Telegram Connector
 * Runs Conan as a Telegram bot via long polling (no server needed).
 *
 * Setup:
 *   1. Create a bot via @BotFather on Telegram → get token
 *   2. conan config set telegramToken YOUR_TOKEN
 *   3. conan serve --telegram
 *
 * Each Telegram user/chat gets its own session ID.
 * The agent loop, skills, and memory all work the same as in the REPL.
 */

const { Bot }    = require('grammy')
const chalk      = require('chalk')
const agent      = require('../core/agent')
const history    = require('../core/history')
const config     = require('../core/config')
const { getDb }  = require('../core/db')

// Active sessions: chatId → sessionId
const sessions = new Map()

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, history.newSessionId())
  }
  return sessions.get(chatId)
}

// ─── Reminder checker — same as REPL, sends notifications via Telegram ────────
function startReminderChecker(bot, chatIds) {
  const check = () => {
    try {
      const db  = getDb()
      const now = new Date().toISOString()
      const due = db.prepare(
        `SELECT * FROM reminders WHERE fired = 0 AND fire_at <= ? ORDER BY fire_at ASC`
      ).all(now)

      for (const r of due) {
        db.prepare('UPDATE reminders SET fired = 1 WHERE id = ?').run(r.id)
        // Notify all active chats
        for (const chatId of chatIds) {
          bot.api.sendMessage(chatId, `⏰ *Reminder:* ${r.message}`, { parse_mode: 'Markdown' })
            .catch(() => {})
        }
        console.log(chalk.yellow(`  ⏰ Reminder fired: ${r.message}`))
      }
    } catch {
      // silently ignore
    }
  }

  check()
  return setInterval(check, 30_000)
}

async function start() {
  const cfg = config.load()

  if (!cfg.telegramToken) {
    console.log(chalk.red('\n  ❌ Telegram token not configured.'))
    console.log(chalk.gray('  Get a token from @BotFather on Telegram, then run:'))
    console.log(chalk.gray('  conan config set telegramToken YOUR_TOKEN\n'))
    process.exit(1)
  }

  const bot = new Bot(cfg.telegramToken)
  const activeChatIds = new Set()

  // ── /start command ──────────────────────────────────────────────────────────
  bot.command('start', async (ctx) => {
    activeChatIds.add(ctx.chat.id)
    await ctx.reply(
      '🔍 *Conan AI Agent* — ready.\n\n' +
      'I remember you, search the web, set reminders, and more.\n\n' +
      'Just talk to me naturally. Type /help to see commands.',
      { parse_mode: 'Markdown' }
    )
  })

  // ── /new command — fresh session ────────────────────────────────────────────
  bot.command('new', async (ctx) => {
    sessions.set(ctx.chat.id, history.newSessionId())
    await ctx.reply('✨ New session started. Fresh context.')
  })

  // ── /memory command ─────────────────────────────────────────────────────────
  bot.command('memory', async (ctx) => {
    const memory = require('../core/memory')
    const all    = memory.list()
    if (!all.length) {
      return ctx.reply('No memories stored yet.')
    }
    const lines = all.map(m => `• [${m.id}] ${m.fact}`).join('\n')
    await ctx.reply(`🧠 *Memories:*\n\n${lines}`, { parse_mode: 'Markdown' })
  })

  // ── /help command ───────────────────────────────────────────────────────────
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🔍 *Conan Commands:*\n\n' +
      '/new — Start a fresh session\n' +
      '/memory — List stored memories\n' +
      '/help — Show this help\n\n' +
      'Just send any message to chat!',
      { parse_mode: 'Markdown' }
    )
  })

  // ── Main message handler ────────────────────────────────────────────────────
  bot.on('message:text', async (ctx) => {
    const chatId  = ctx.chat.id
    const text    = ctx.message.text

    // Skip commands (already handled above)
    if (text.startsWith('/')) return

    activeChatIds.add(chatId)
    const sessionId = getSession(chatId)

    // Show typing indicator
    await ctx.replyWithChatAction('typing')

    try {
      const reply = await agent.chat(sessionId, text)
      await ctx.reply(reply)
    } catch (err) {
      await ctx.reply(`❌ Error: ${err.message}`)
    }
  })

  // ── Error handler ───────────────────────────────────────────────────────────
  bot.catch((err) => {
    console.error(chalk.red(`  Telegram error: ${err.message}`))
  })

  // ── Start polling ───────────────────────────────────────────────────────────
  console.log(chalk.cyan('\n  🔍 Conan Telegram bot starting...\n'))

  await bot.init()
  const botInfo = bot.botInfo
  console.log(`  Bot: ${chalk.white('@' + botInfo.username)}`)
  console.log(`  Name: ${chalk.white(botInfo.first_name)}`)
  console.log(chalk.gray('\n  Listening for messages (long polling)...'))
  console.log(chalk.gray('  Press Ctrl+C to stop.\n'))

  // Start reminder checker (notifies all active chats)
  const reminderInterval = startReminderChecker(bot, activeChatIds)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    clearInterval(reminderInterval)
    await bot.stop()
    console.log(chalk.gray('\n  Bot stopped.\n'))
    process.exit(0)
  })

  await bot.start()
}

module.exports = { start }
