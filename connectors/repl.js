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

  const prompt = () => {
    rl.question(chalk.green('You: '), async (input) => {
      const userInput = input.trim()

      if (!userInput) {
        prompt()
        return
      }

      // Built-in slash commands
      if (userInput === '/exit' || userInput === '/quit') {
        console.log(chalk.gray('\nGoodbye! 👋\n'))
        rl.close()
        process.exit(0)
      }

      if (userInput === '/new') {
        sessionId = history.newSessionId()
        console.log(chalk.gray('\n  ✨ New session started. Fresh context.\n'))
        prompt()
        return
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
        prompt()
        return
      }

      if (userInput === '/help') {
        console.log(chalk.gray('\n  Commands:'))
        console.log(chalk.gray('    /new      Start a new session'))
        console.log(chalk.gray('    /memory   List stored memories'))
        console.log(chalk.gray('    /exit     Quit Conan'))
        console.log(chalk.gray('    /help     Show this help\n'))
        prompt()
        return
      }

      // Spinner while waiting for AI response
      const spinner = ora({
        text:    'Thinking...',
        color:   'cyan',
        spinner: 'dots',
      }).start()

      try {
        const reply = await agent.chat(sessionId, userInput)
        spinner.stop()
        console.log('')
        console.log(chalk.cyan('Conan: ') + reply)
        console.log('')
      } catch (err) {
        spinner.stop()
        console.log('')
        console.log(chalk.red('Error: ') + err.message)
        console.log('')
      }

      prompt()
    })
  }

  prompt()
}

module.exports = { start }
