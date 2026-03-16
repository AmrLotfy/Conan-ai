#!/usr/bin/env node

/**
 * Conan CLI Entrypoint
 * Commands: init, chat, ask, skill, memory, config
 */

const { Command } = require('commander')
const chalk       = require('chalk')
const inquirer    = require('inquirer')
const config      = require('../core/config')

const { version } = require('../package.json')

const program = new Command()

program
  .name('conan')
  .description('🔍 Conan — Personal AI Agent Framework')
  .version(version)

// ─── conan init ──────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Set up Conan for the first time')
  .action(async () => {
    console.log('')
    console.log(chalk.cyan.bold('  🔍 Welcome to Conan — Personal AI Agent'))
    console.log(chalk.gray('  Let\'s get you set up in 60 seconds.\n'))

    const existing = config.load()

    const answers = await inquirer.prompt([
      {
        type:    'input',
        name:    'name',
        message: 'What\'s your name?',
        default: existing.name !== 'there' ? existing.name : '',
      },
      {
        type:    'list',
        name:    'provider',
        message: 'Which AI provider do you want to use?',
        default: existing.provider || 'openrouter',
        choices: [
          { name: 'OpenRouter  — one key for GPT-4o, Claude, Mistral & more (openrouter.ai)', value: 'openrouter' },
          { name: 'OpenAI     — your own ChatGPT API key (platform.openai.com)',               value: 'openai'      },
          { name: 'Anthropic  — your own Claude API key (console.anthropic.com)',              value: 'anthropic'   },
        ],
      },
      // OpenRouter key
      {
        type:     'input',
        name:     'openrouterKey',
        message:  'OpenRouter API key:',
        default:  existing.openrouterKey || '',
        when:     (a) => a.provider === 'openrouter',
        validate: v => v.trim().length > 0 ? true : 'API key is required',
      },
      // OpenAI key
      {
        type:     'input',
        name:     'openaiKey',
        message:  'OpenAI API key (sk-...):',
        default:  existing.openaiKey || '',
        when:     (a) => a.provider === 'openai',
        validate: v => v.trim().length > 0 ? true : 'API key is required',
      },
      // Anthropic key
      {
        type:     'input',
        name:     'anthropicKey',
        message:  'Anthropic API key (sk-ant-...):',
        default:  existing.anthropicKey || '',
        when:     (a) => a.provider === 'anthropic',
        validate: v => v.trim().length > 0 ? true : 'API key is required',
      },
      {
        type:    'input',
        name:    'timezone',
        message: 'Your timezone (IANA format, e.g. Africa/Cairo, America/New_York):',
        default: existing.timezone || 'UTC',
      },
      // Model choices for OpenRouter
      {
        type:    'list',
        name:    'model',
        message: 'Which AI model to use?',
        default: existing.model || 'openai/gpt-4o-mini',
        when:    (a) => a.provider === 'openrouter',
        choices: [
          { name: 'GPT-4o Mini   (fast, cheap — recommended)', value: 'openai/gpt-4o-mini'          },
          { name: 'GPT-4o        (powerful, slower)',           value: 'openai/gpt-4o'               },
          { name: 'Claude Haiku  (fast Anthropic model)',       value: 'anthropic/claude-3-5-haiku'  },
          { name: 'Claude Sonnet (powerful Anthropic)',         value: 'anthropic/claude-3-7-sonnet' },
          { name: 'Other (enter manually)',                     value: '__other__'                   },
        ],
      },
      // Model choices for OpenAI direct
      {
        type:    'list',
        name:    'model',
        message: 'Which OpenAI model to use?',
        default: existing.model || 'gpt-4o-mini',
        when:    (a) => a.provider === 'openai',
        choices: [
          { name: 'gpt-4o-mini (fast, cheap — recommended)', value: 'gpt-4o-mini' },
          { name: 'gpt-4o     (powerful, slower)',            value: 'gpt-4o'      },
          { name: 'Other (enter manually)',                   value: '__other__'   },
        ],
      },
      // Model choices for Anthropic direct
      {
        type:    'list',
        name:    'model',
        message: 'Which Claude model to use?',
        default: existing.model || 'claude-3-5-haiku-20241022',
        when:    (a) => a.provider === 'anthropic',
        choices: [
          { name: 'claude-3-5-haiku-20241022  (fast, cheap — recommended)', value: 'claude-3-5-haiku-20241022'  },
          { name: 'claude-3-7-sonnet-20250219 (powerful, slower)',           value: 'claude-3-7-sonnet-20250219' },
          { name: 'Other (enter manually)',                                  value: '__other__'                  },
        ],
      },
      {
        type:    'input',
        name:    'customModel',
        message: 'Enter model name:',
        when:    (a) => a.model === '__other__',
        validate: v => v.trim().length > 0 ? true : 'Model name is required',
      },
      // ── Skills setup ──────────────────────────────────────────────────────
      {
        type:    'confirm',
        name:    'wantWeather',
        message: 'Enable weather skill? (free key at openweathermap.org)',
        default: !!existing.weatherKey,
      },
      {
        type:    'input',
        name:    'weatherKey',
        message: 'OpenWeatherMap API key:',
        default: existing.weatherKey || '',
        when:    (a) => a.wantWeather,
      },
      {
        type:    'confirm',
        name:    'wantWebSearch',
        message: 'Enable web search skill? (free key at tavily.com)',
        default: !!existing.tavilyKey,
      },
      {
        type:    'input',
        name:    'tavilyKey',
        message: 'Tavily API key:',
        default: existing.tavilyKey || '',
        when:    (a) => a.wantWebSearch,
      },
      {
        type:    'confirm',
        name:    'wantNews',
        message: 'Enable news skill? (free key at newsapi.org)',
        default: !!existing.newsApiKey,
      },
      {
        type:    'input',
        name:    'newsApiKey',
        message: 'NewsAPI key:',
        default: existing.newsApiKey || '',
        when:    (a) => a.wantNews,
      },
      {
        type:    'confirm',
        name:    'wantFileReader',
        message: 'Enable file reader skill? (read & summarize local files — no API key needed)',
        default: (existing.skills || []).includes('conan-skill-file-reader'),
      },
    ])

    const finalConfig = {
      ...existing,
      name:     answers.name.trim() || 'there',
      provider: answers.provider,
      timezone: answers.timezone.trim() || 'UTC',
      model:    answers.model === '__other__' ? answers.customModel.trim() : answers.model,
    }

    // Save the right key for the chosen provider
    if (answers.provider === 'openrouter' && answers.openrouterKey)
      finalConfig.openrouterKey = answers.openrouterKey.trim()
    if (answers.provider === 'openai' && answers.openaiKey)
      finalConfig.openaiKey = answers.openaiKey.trim()
    if (answers.provider === 'anthropic' && answers.anthropicKey)
      finalConfig.anthropicKey = answers.anthropicKey.trim()

    finalConfig.skills = finalConfig.skills || []

    // Weather
    if (answers.wantWeather && answers.weatherKey?.trim()) {
      finalConfig.weatherKey = answers.weatherKey.trim()
      if (!finalConfig.skills.includes('conan-skill-weather'))
        finalConfig.skills.push('conan-skill-weather')
    }

    // Web Search
    if (answers.wantWebSearch && answers.tavilyKey?.trim()) {
      finalConfig.tavilyKey = answers.tavilyKey.trim()
      if (!finalConfig.skills.includes('conan-skill-web-search'))
        finalConfig.skills.push('conan-skill-web-search')
    }

    // News
    if (answers.wantNews && answers.newsApiKey?.trim()) {
      finalConfig.newsApiKey = answers.newsApiKey.trim()
      if (!finalConfig.skills.includes('conan-skill-news'))
        finalConfig.skills.push('conan-skill-news')
    }

    // File Reader (no key needed)
    if (answers.wantFileReader) {
      if (!finalConfig.skills.includes('conan-skill-file-reader'))
        finalConfig.skills.push('conan-skill-file-reader')
    } else {
      finalConfig.skills = finalConfig.skills.filter(s => s !== 'conan-skill-file-reader')
    }

    config.save(finalConfig)

    // Install any newly added skill packages
    const { execSync } = require('child_process')
    const skillsToInstall = []
    if (answers.wantWeather    && answers.weatherKey?.trim())  skillsToInstall.push('conan-skill-weather')
    if (answers.wantWebSearch  && answers.tavilyKey?.trim())   skillsToInstall.push('conan-skill-web-search')
    if (answers.wantNews       && answers.newsApiKey?.trim())  skillsToInstall.push('conan-skill-news')
    if (answers.wantFileReader)                                skillsToInstall.push('conan-skill-file-reader')

    if (skillsToInstall.length > 0) {
      console.log('')
      console.log(chalk.cyan('  Installing skill packages...'))
      try {
        execSync(`npm install -g ${skillsToInstall.join(' ')}`, { stdio: 'inherit' })
      } catch {
        console.log(chalk.yellow('  ⚠ Some skills failed to install. Run "conan skill install <name>" manually.'))
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const activeSkills = ['time', 'memory', 'reminder', 'url-reader', ...finalConfig.skills.map(s => s.replace('conan-skill-', ''))]
    const notInstalled = []
    if (!answers.wantWeather   || !answers.weatherKey?.trim())  notInstalled.push('conan-skill-weather')
    if (!answers.wantWebSearch || !answers.tavilyKey?.trim())   notInstalled.push('conan-skill-web-search')
    if (!answers.wantNews      || !answers.newsApiKey?.trim())  notInstalled.push('conan-skill-news')
    if (!answers.wantFileReader)                                notInstalled.push('conan-skill-file-reader')

    console.log('')
    console.log(chalk.green.bold('  ✅ Conan is ready!\n'))
    console.log(chalk.white('  Active skills:   ') + chalk.cyan(activeSkills.join(', ')))

    if (notInstalled.length > 0) {
      console.log('')
      console.log(chalk.gray('  More skills available:'))
      notInstalled.forEach(s => {
        console.log(chalk.gray(`    conan skill install ${s}`))
      })
      console.log(chalk.gray('    conan skill install conan-skill-gmail  (+ run: conan-gmail-auth)'))
    }

    console.log('')
    console.log(chalk.white('  Start chatting:  ') + chalk.cyan('conan chat'))
    console.log('')
  })

// ─── conan chat ──────────────────────────────────────────────────────────────
program
  .command('chat')
  .description('Start an interactive chat session')
  .action(async () => {
    if (!config.isInitialized()) {
      console.log(chalk.yellow('\n  ⚠ Conan is not set up yet. Run: conan init\n'))
      process.exit(1)
    }
    const repl = require('../connectors/repl')
    await repl.start()
  })

// ─── conan ask ───────────────────────────────────────────────────────────────
program
  .command('ask <question...>')
  .description('Ask Conan a one-shot question (scriptable)')
  .action(async (questionWords) => {
    if (!config.isInitialized()) {
      console.log(chalk.yellow('\n  ⚠ Conan is not set up yet. Run: conan init\n'))
      process.exit(1)
    }

    const question  = questionWords.join(' ')
    const agent     = require('../core/agent')
    const historyMod = require('../core/history')
    const ora       = require('ora')

    const spinner = ora({ text: 'Thinking...', color: 'cyan' }).start()

    try {
      const sessionId = historyMod.newSessionId()
      const reply     = await agent.chat(sessionId, question)
      spinner.stop()
      console.log(reply)
    } catch (err) {
      spinner.stop()
      console.error(chalk.red('Error: ') + err.message)
      process.exit(1)
    }
  })

// ─── conan memory ────────────────────────────────────────────────────────────
const memCmd = program.command('memory').description('Manage long-term memory')

memCmd
  .command('list')
  .description('List all stored memories')
  .action(() => {
    const memory = require('../core/memory')
    const all    = memory.list()
    if (!all.length) {
      console.log(chalk.gray('\n  No memories stored yet.\n'))
      return
    }
    console.log(chalk.cyan('\n  📝 Memories:\n'))
    all.forEach(m => {
      console.log(`  ${chalk.gray(`[${m.id}]`)} ${chalk.yellow(`[${m.category}]`)} ${m.fact}`)
    })
    console.log('')
  })

memCmd
  .command('forget <id>')
  .description('Delete a memory by ID')
  .action((id) => {
    const memory  = require('../core/memory')
    const deleted = memory.forget(Number(id))
    if (deleted) {
      console.log(chalk.green(`\n  ✅ Forgot memory #${id}\n`))
    } else {
      console.log(chalk.red(`\n  Memory #${id} not found.\n`))
    }
  })

// ─── conan skill ─────────────────────────────────────────────────────────────
const skillCmd = program.command('skill').description('Manage skills')

skillCmd
  .command('list')
  .description('List installed skills')
  .action(() => {
    const agent  = require('../core/agent')
    const registry = agent.buildRegistry()
    const skills = registry.list()

    console.log(chalk.cyan('\n  🧩 Active Skills:\n'))
    skills.forEach(s => {
      console.log(`  ${chalk.green('●')} ${chalk.white(s.name.padEnd(25))} ${chalk.gray(s.description)}`)
    })
    console.log('')
  })

skillCmd
  .command('install <package>')
  .description('Install an external skill (npm package name)')
  .action(async (pkg) => {
    const { execSync } = require('child_process')

    console.log(chalk.cyan(`\n  Installing ${pkg}...\n`))

    try {
      execSync(`npm install -g ${pkg}`, { stdio: 'inherit' })

      // Add to config skills list
      const cfg = config.load()
      cfg.skills = cfg.skills || []
      if (!cfg.skills.includes(pkg)) {
        cfg.skills.push(pkg)
        config.save(cfg)
      }

      console.log(chalk.green(`\n  ✅ Skill "${pkg}" installed successfully.\n`))
    } catch {
      console.log(chalk.red(`\n  Failed to install "${pkg}". Is it a valid npm package?\n`))
      process.exit(1)
    }
  })

skillCmd
  .command('remove <package>')
  .description('Remove an installed skill')
  .action((pkg) => {
    const cfg = config.load()
    cfg.skills = (cfg.skills || []).filter(s => s !== pkg)
    config.save(cfg)
    console.log(chalk.green(`\n  ✅ Skill "${pkg}" removed from Conan.\n`))
    console.log(chalk.gray(`  Note: Run "npm uninstall -g ${pkg}" to fully remove the package.\n`))
  })

skillCmd
  .command('new <name>')
  .description('Scaffold a new skill package (creates conan-skill-<name>/ folder)')
  .action((name) => {
    const fs   = require('fs')
    const path = require('path')

    // Normalize: strip "conan-skill-" prefix if user included it
    const shortName = name.replace(/^conan-skill-/, '')
    const pkgName   = `conan-skill-${shortName}`
    const dir       = path.join(process.cwd(), pkgName)

    if (fs.existsSync(dir)) {
      console.log(chalk.red(`\n  ❌ Directory "${pkgName}" already exists.\n`))
      process.exit(1)
    }

    fs.mkdirSync(dir, { recursive: true })

    // package.json
    const pkg = {
      name:        pkgName,
      version:     '1.0.0',
      description: `${pkgName} — a skill for Conan AI`,
      main:        'index.js',
      keywords:    ['conan-skill', shortName, 'ai-agent', 'conan-ai'],
      author:      '',
      license:     'MIT',
      type:        'commonjs',
    }
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2))

    // index.js — skill template
    const indexJs = `/**
 * ${pkgName}
 * A skill for Conan AI agent.
 *
 * Install: conan skill install ${pkgName}
 */

module.exports = {
  name: '${shortName.replace(/-/g, '_')}',
  description: 'Describe what this skill does.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The input for this skill.',
      },
    },
    required: ['query'],
  },

  async execute(args, context) {
    const { query } = args
    // context.config → user config (~/.conan/config.json)
    // context.memory → memory store (remember/recall/list/forget)

    // TODO: implement your skill logic here
    return \`Result for: \${query}\`
  },
}
`
    fs.writeFileSync(path.join(dir, 'index.js'), indexJs)

    // README.md
    const readme = `# ${pkgName}

> A skill for [Conan AI](https://github.com/AmrLotfy/conan-ai).

## Install

\`\`\`bash
conan skill install ${pkgName}
\`\`\`

## What it does

<!-- Describe your skill here -->

## Config

<!-- List any API keys or config values needed, e.g.: -->
<!-- \`conan config set myKey YOUR_KEY\` -->

## License

MIT
`
    fs.writeFileSync(path.join(dir, 'README.md'), readme)

    console.log(chalk.cyan(`\n  🔧 Skill scaffolded: ${pkgName}/\n`))
    console.log(`  ${chalk.gray('├──')} ${chalk.white('index.js')}      ${chalk.gray('← skill logic (edit this)')}`)
    console.log(`  ${chalk.gray('├──')} ${chalk.white('package.json')}  ${chalk.gray('← package metadata')}`)
    console.log(`  ${chalk.gray('└──')} ${chalk.white('README.md')}     ${chalk.gray('← documentation')}`)
    console.log('')
    console.log(chalk.yellow('  Next steps:'))
    console.log(chalk.gray(`    1. cd ${pkgName}`))
    console.log(chalk.gray('    2. Edit index.js — implement your execute() function'))
    console.log(chalk.gray('    3. npm publish  (when ready to share)'))
    console.log(chalk.gray(`    4. conan skill install ${pkgName}  (to use locally)`))
    console.log('')
  })

// ─── conan config ────────────────────────────────────────────────────────────
const cfgCmd = program.command('config').description('Manage configuration')

cfgCmd
  .command('set <key> <value>')
  .description('Set a config value (e.g. conan config set model anthropic/claude-3-haiku)')
  .action((key, value) => {
    config.set(key, value)
    console.log(chalk.green(`\n  ✅ Set ${key} = ${value}\n`))
  })

cfgCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const cfg = config.load()
    console.log(chalk.cyan('\n  ⚙ Configuration:\n'))
    const KEY_FIELDS = new Set(['openrouterKey', 'openaiKey', 'anthropicKey', 'weatherKey'])
    Object.entries(cfg).forEach(([k, v]) => {
      const display = KEY_FIELDS.has(k) && v
        ? v.slice(0, 8) + '...' + v.slice(-4)
        : JSON.stringify(v)
      console.log(`  ${chalk.gray(k.padEnd(20))} ${display}`)
    })
    console.log('')
  })

// ─── conan serve ──────────────────────────────────────────────────────────────
program
  .command('serve')
  .description('Run Conan as a bot on a messaging platform')
  .option('--telegram', 'Run as a Telegram bot (requires telegramToken in config)')
  .action(async (opts) => {
    if (opts.telegram) {
      const telegram = require('../connectors/telegram')
      await telegram.start()
    } else {
      console.log(chalk.yellow('\n  Specify a connector: conan serve --telegram\n'))
    }
  })

// ─── conan daemon ─────────────────────────────────────────────────────────────
const daemonCmd = program.command('daemon').description('Manage the background reminder daemon')

daemonCmd
  .command('start')
  .description('Start the background daemon (checks reminders every 30s)')
  .action(() => {
    const daemon = require('../core/daemon')
    daemon.start()
  })

daemonCmd
  .command('stop')
  .description('Stop the running daemon')
  .action(() => {
    const daemon = require('../core/daemon')
    daemon.stop()
  })

daemonCmd
  .command('status')
  .description('Show daemon status and pending reminders')
  .action(() => {
    const daemon = require('../core/daemon')
    daemon.status()
  })

// Shortcut: "conan daemon" with no subcommand → start
daemonCmd.action(() => {
  const daemon = require('../core/daemon')
  daemon.start()
})

// ─── conan update ────────────────────────────────────────────────────────────
program
  .command('update')
  .description('Update Conan and all installed skills to latest versions')
  .action(async () => {
    const { execSync } = require('child_process')
    const axios        = require('axios')
    const ora          = require('ora')

    console.log('')

    // ── Check latest version ─────────────────────────────────────────────────
    const spinner = ora({ text: 'Checking for updates...', color: 'cyan' }).start()

    let latestVersion
    try {
      const res = await axios.get('https://registry.npmjs.org/conan-ai/latest', { timeout: 8000 })
      latestVersion = res.data.version
    } catch {
      spinner.stop()
      console.log(chalk.yellow('  ⚠ Could not reach npm registry. Check your connection.\n'))
      process.exit(1)
    }

    spinner.stop()

    if (latestVersion === version) {
      console.log(chalk.green(`  ✅ Conan is up to date (v${version})\n`))
    } else {
      console.log(chalk.cyan(`  New version available: ${chalk.white.bold(`v${latestVersion}`)} ${chalk.gray(`(current: v${version})`)}`))
      console.log(chalk.gray('  Updating conan-ai...\n'))
      try {
        execSync('npm install -g conan-ai@latest', { stdio: 'inherit' })
        console.log(chalk.green(`\n  ✅ Conan updated to v${latestVersion}\n`))
      } catch {
        console.log(chalk.red('\n  Update failed. Try manually: npm install -g conan-ai@latest\n'))
        process.exit(1)
      }
    }

    // ── Update installed skills ───────────────────────────────────────────────
    const cfg = config.load()
    const skills = cfg.skills || []

    if (skills.length === 0) {
      console.log(chalk.gray('  No extra skills installed.\n'))
      return
    }

    console.log(chalk.cyan('  Updating installed skills...'))
    console.log(chalk.gray(`  Skills: ${skills.join(', ')}\n`))

    try {
      execSync(`npm install -g ${skills.join(' ')}`, { stdio: 'inherit' })
      console.log(chalk.green('\n  ✅ All skills updated.\n'))
    } catch {
      console.log(chalk.yellow('\n  ⚠ Some skills failed to update. Try manually: npm install -g <skill-name>\n'))
    }
  })

program.parse(process.argv)

// Show help if no command given
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
