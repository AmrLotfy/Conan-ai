<div align="center">

# Conan — Personal AI Agent Framework

**The agent that always finds the answer.**

[![npm](https://img.shields.io/npm/v/conan-ai?color=crimson&label=npm)](https://www.npmjs.com/package/conan-ai)
[![License: MIT](https://img.shields.io/badge/license-MIT-gold.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Open Source](https://img.shields.io/badge/open%20source-%E2%9D%A4-red)](https://github.com/AmrLotfy/Conan-ai)

An open source Node.js CLI framework for building personal AI agents.
Runs in your terminal. Remembers you. Searches the web. Reads your files. Fires reminders.
**Local-first. No cloud. No accounts. Your key, your cost.**

🌐 **[Landing Page](https://amrlotfy.github.io/Conan-ai/)** · [**Install**](#install) · [**Skills**](#skills) · [**Connectors**](#connectors) · [**Build a Skill**](#build-your-own-skill)

</div>

---

## What is Conan?

Conan is a personal AI agent you run locally. It connects to any LLM (OpenAI, Anthropic, or OpenRouter), remembers facts about you across sessions, executes tools called **skills**, and can run in your terminal or as a Telegram bot.

Named after the beloved Arab cartoon detective — **كونان** — who always finds the answer.

```
$ conan chat

  ╔═══════════════════════════════╗
  ║       🔍 CONAN AI AGENT       ║
  ╚═══════════════════════════════╝
  Model: openai/gpt-4o-mini  ·  Timezone: Africa/Cairo

You: what's the weather in Cairo?
Conan: ☀️ Cairo, EG — 28°C, clear sky. Feels like 27°C · Humidity 30% · Wind 12 km/h

You: search for latest AI news
Conan: 🔎 Here's what's happening in AI today...
       1. GPT-5 announced — OpenAI reveals next model
          🔗 techcrunch.com/...

You: remember that I prefer dark mode and work as a backend developer
Conan: Got it! I'll remember that you prefer dark mode and work as a backend developer.

You: remind me in 2 hours to review the PR
Conan: ✅ Reminder set for 6:00 PM — "review the PR". I've got you covered!
```

---

## Install

```bash
npm install -g conan-ai
conan init
conan chat
```

That's it. `conan init` walks you through choosing your AI provider and entering your API key — done in 60 seconds.

> **Supported providers:** OpenRouter · OpenAI · Anthropic

---

## Commands

```bash
# Start chatting
conan chat                         # Interactive terminal session
conan ask "what time is it?"       # One-shot query (scriptable, pipe-friendly)

# Run as a bot
conan serve --telegram             # Run as a Telegram bot

# Skills
conan skill list                   # Show all active skills
conan skill install <package>      # Install a skill from npm
conan skill remove <package>       # Remove a skill
conan skill new <name>             # Scaffold a new skill package

# Memory
conan memory list                  # See what Conan remembers about you
conan memory forget <id>           # Delete a memory by ID

# Config
conan config show                  # Show current configuration
conan config set <key> <value>     # Update any config value

# Background daemon
conan daemon start                 # Start reminder daemon (fires OS notifications)
conan daemon stop                  # Stop daemon
conan daemon status                # Show daemon status + pending reminders
```

### In-chat slash commands

```
/new      Start a fresh session (clears context)
/memory   List stored memories
/help     Show available commands
/exit     Quit Conan
```

---

## Skills

Skills are the tools Conan uses to take action. Built-in skills are always active — installable skills extend what Conan can do.

### Built-in (always active)

| Skill | Tool | What it does |
|---|---|---|
| 🕐 Time | `get_current_time` | Current date and time in your timezone |
| 🧠 Memory | `memory` | Remember and recall facts across sessions |
| ⏰ Reminders | `set_reminder` | Set timed reminders — fires in-terminal or via daemon |
| 🌐 URL Reader | `read_url` | Fetch and summarize any public webpage |

### Installable

```bash
conan skill install conan-skill-weather
conan skill install conan-skill-web-search
conan skill install conan-skill-news
conan skill install conan-skill-file-reader
conan skill install conan-skill-gmail
```

| Package | What it adds | API Key needed |
|---|---|---|
| [conan-skill-weather](https://github.com/AmrLotfy/conan-skill-weather) | Real-time weather + 3-day forecast for any city | OpenWeatherMap (free) |
| [conan-skill-web-search](https://github.com/AmrLotfy/conan-skill-web-search) | Search the web with real-time results and sources | Tavily (free tier) |
| [conan-skill-news](https://github.com/AmrLotfy/conan-skill-news) | Top headlines — tech, world, sports, Arabic sources | NewsAPI (free tier) |
| [conan-skill-file-reader](https://github.com/AmrLotfy/conan-skill-file-reader) | Read and summarize local files (log, json, csv, code…) | None — fully local |
| [conan-skill-gmail](https://github.com/AmrLotfy/conan-skill-gmail) | Read, send, reply, search and manage Gmail | Google Cloud (free) |

---

## Connectors

Connectors let Conan run on messaging platforms beyond the terminal.

| Connector | Command | Status |
|---|---|---|
| Terminal REPL | `conan chat` | ✅ Built-in |
| Telegram | `conan serve --telegram` | ✅ Available |
| Discord | `conan serve --discord` | Coming soon |

### Telegram setup

```bash
# 1. Create a bot via @BotFather on Telegram
# 2. Copy the token
conan config set telegramToken YOUR_TOKEN

# 3. Start the bot
conan serve --telegram
```

Conan will start listening via long polling — no server or public URL needed.

### Gmail setup

```bash
# 1. Install the skill
conan skill install conan-skill-gmail

# 2. Go to https://console.cloud.google.com
#    → Create a project → Enable Gmail API
#    → Credentials → Create OAuth 2.0 Client ID (Desktop app)
#    → Add redirect URI: http://localhost:9854/callback

# 3. Save your credentials
conan config set googleClientId YOUR_CLIENT_ID
conan config set googleClientSecret YOUR_CLIENT_SECRET

# 4. Authenticate — opens browser once
conan-gmail-auth

# 5. Start chatting
conan chat
# → "read my latest emails"
# → "send an email to friend@example.com — subject: Hello"
# → "search for emails from boss@company.com"
```

---

## Build Your Own Skill

Any npm package that exports this shape works as a Conan skill:

```js
// conan-skill-example/index.js
module.exports = {
  name: 'my_skill',
  description: 'What this skill does — the LLM reads this.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The input' }
    },
    required: ['query']
  },
  async execute(args, context) {
    // context.config → user config (~/.conan/config.json)
    // context.memory → memory store (remember/recall/list/forget)
    return `Result: ${args.query}`
  }
}
```

**Scaffold a new skill:**
```bash
conan skill new my-skill
# Creates conan-skill-my-skill/ with index.js, package.json, README
```

**Publish and share:**
```bash
cd conan-skill-my-skill
npm publish
# Anyone can now: conan skill install conan-skill-my-skill
```

---

## Config Reference

All config lives in `~/.conan/config.json`. No `.env` files, no cloud sync.

| Key | Description |
|---|---|
| `name` | Your name |
| `provider` | LLM provider: `openrouter` · `openai` · `anthropic` |
| `openrouterKey` | OpenRouter API key |
| `openaiKey` | OpenAI API key |
| `anthropicKey` | Anthropic API key |
| `telegramToken` | Telegram bot token (for `conan serve --telegram`) |
| `timezone` | IANA timezone (e.g. `Africa/Cairo`, `America/New_York`) |
| `model` | AI model (e.g. `gpt-4o-mini`, `claude-3-5-haiku-20241022`) |
| `weatherKey` | OpenWeatherMap API key (for conan-skill-weather) |
| `tavilyKey` | Tavily API key (for conan-skill-web-search) |
| `newsApiKey` | NewsAPI key (for conan-skill-news) |
| `googleClientId` | Google OAuth Client ID (for conan-skill-gmail) |
| `googleClientSecret` | Google OAuth Client Secret (for conan-skill-gmail) |
| `skills` | List of installed skill packages |

Switch anything anytime:
```bash
conan config set provider anthropic
conan config set model claude-3-5-haiku-20241022
```

---

## Architecture

Conan follows the **6-pillar AI agent architecture**:

| Pillar | Implementation |
|---|---|
| Chat Connectors | Terminal REPL · Telegram bot |
| LLM Brain | OpenRouter / OpenAI / Anthropic via `core/llm.js` |
| Persistent Memory | SQLite `memories` table via `core/memory.js` |
| Skill/Tool System | `core/skill-registry.js` — register, execute, toolDefinitions |
| Agentic Loop | `core/agent.js` — up to 5 tool-call iterations per message |
| Proactive Scheduler | `conan daemon` — polls reminders every 30s, fires OS notifications |

---

## Privacy

- All data is stored locally in `~/.conan/`
  - `config.json` — your settings and API keys
  - `conan.db` — SQLite (memories, chat history, reminders)
- Nothing is sent to any server except your LLM provider API calls
- No accounts, no telemetry, no cloud

---

## License

MIT · Built by [Amr Lotfy](https://www.linkedin.com/in/amr-lotfy-saleh/)
