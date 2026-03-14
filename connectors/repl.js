/**
 * Terminal REPL Connector
 * Interactive chat loop in the terminal.
 * Reads user input → calls agent → prints response → repeat.
 */

const readline = require('readline')
const chalk    = require('chalk')
const ora      = require('ora')
const agent    = require('../core/agent')
const history  = require('../core/history')
const config   = require('../core/config')

function printWelcome(cfg) {
  console.log('')
  console.log(chalk.cyan.bold('  ╔═══════════════════════════════╗'))
  console.log(chalk.cyan.bold('  ║       🔍 CONAN AI AGENT       ║'))
  console.log(chalk.cyan.bold('  ╚═══════════════════════════════╝'))
  console.log(chalk.gray(`  Model: ${cfg.model || 'openai/gpt-4o-mini'}`))
  console.log(chalk.gray(`  Timezone: ${cfg.timezone || 'UTC'}`))
  console.log(chalk.gray(`  Type ${chalk.white('/exit')} to quit, ${chalk.white('/new')} for new session, ${chalk.white('/memory')} to list memories`))
  console.log('')
}

async function start() {
  const cfg = config.load()

  printWelcome(cfg)

  // Generate a session ID for this conversation
  let sessionId = history.newSessionId()

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  })

  // Keep the process alive — readline closes when stdin ends (e.g. pipe)
  rl.on('close', () => {
    process.exit(0)
  })

  const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve))

  const loop = async () => {
    while (true) {
      let userInput
      try {
        userInput = (await askQuestion(chalk.green('You: '))).trim()
      } catch {
        break
      }

      if (!userInput) continue

      // Built-in slash commands
      if (userInput === '/exit' || userInput === '/quit') {
        console.log(chalk.gray('\nGoodbye! 👋\n'))
        rl.close()
        process.exit(0)
      }

      if (userInput === '/new') {
        sessionId = history.newSessionId()
        console.log(chalk.gray('\n  ✨ New session started. Fresh context.\n'))
        continue
      }

      if (userInput === '/memory') {
        const memory = require('../core/memory')
        const all    = memory.list()
        if (!all.length) {
          console.log(chalk.gray('\n  No memories stored yet.\n'))
        } else {
          console.log(chalk.gray('\n  📝 Memories:'))
          all.forEach(m => {
            console.log(chalk.gray(`    [${m.id}] [${m.category}] ${m.fact}`))
          })
          console.log('')
        }
        continue
      }

      if (userInput === '/help') {
        console.log(chalk.gray('\n  Commands:'))
        console.log(chalk.gray('    /new      Start a new session'))
        console.log(chalk.gray('    /memory   List stored memories'))
        console.log(chalk.gray('    /exit     Quit Conan'))
        console.log(chalk.gray('    /help     Show this help\n'))
        continue
      }

      // Pause readline so spinner doesn't conflict with stdin
      rl.pause()

      // Simple "thinking" indicator — no spinner library to avoid conflicts
      process.stdout.write(chalk.gray('  thinking...\n'))

      try {
        const reply = await agent.chat(sessionId, userInput)
        // Clear the thinking line and print response
        process.stdout.write('\x1B[1A\x1B[2K') // move up + clear line
        console.log('')
        console.log(chalk.cyan('Conan: ') + reply)
        console.log('')
      } catch (err) {
        process.stdout.write('\x1B[1A\x1B[2K')
        console.log('')
        console.log(chalk.red('Error: ') + err.message)
        console.log('')
      }

      // Resume readline for next input
      rl.resume()
    }
  }

  loop()
}

module.exports = { start }
