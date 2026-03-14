# 🔍 Conan — Personal AI Agent Framework

> The agent that always finds the answer.

Conan is an open source Node.js framework for building personal AI agents that run in your terminal. Install it, configure it in 60 seconds, and start chatting with an agent that remembers you, manages your reminders, reads the web, and can be extended with skills.

```
$ conan chat

  ╔═══════════════════════════════╗
  ║       🔍 CONAN AI AGENT       ║
  ╚═══════════════════════════════╝

You: what's the weather in Cairo?
Conan: ☀️ Cairo, EG — 28°C, clear sky. Feels like 27°C · Humidity 30% · Wind 12 km/h

You: remind me in 2 hours to review the PR
Conan: ✅ Reminder set for 6:00 PM — "review the PR". I've got you covered!

You: remember that I work at Hollat as a backend developer
Conan: Got it! I'll remember that you work at Hollat as a backend developer.

You: read this url https://example.com
Conan: Here's what's on that page...
```

---

## Why Conan?

- **Simple** — one command to install, one command to chat
- **Extensible** — install skills from npm like `conan skill install conan-skill-weather`
- **Local-first** — all your data stays on your machine (SQLite, no cloud)
- **Multi-provider** — use OpenAI, Anthropic (Claude), or OpenRouter (all models with one key)
- **Your key, your cost** — bring your own API key, pay only for what you use

---

## Install

```bash
npm install -g conan-ai
conan init
conan chat
```

That's it.

---

## Setup

`conan init` will walk you through:

- Your name
- **AI provider** — pick one:
  - **OpenRouter** — one key for GPT-4o, Claude, Mistral, Gemini and more → [openrouter.ai](https://openrouter.ai)
  - **OpenAI** — your own ChatGPT API key → [platform.openai.com](https://platform.openai.com)
  - **Anthropic** — your own Claude API key → [console.anthropic.com](https://console.anthropic.com)
- Your timezone
- Your preferred AI model
- Optional: weather API key (free at [openweathermap.org](https://openweathermap.org))

> **Which provider should I choose?**
> - OpenRouter is great if you want to try different models without multiple accounts.
> - OpenAI direct if you already have a ChatGPT API key.
> - Anthropic direct if you already have a Claude API key.
> You can switch anytime with `conan config set provider openai` (or `anthropic` / `openrouter`).

---

## Commands

```bash
# Chat
conan chat                        # Start interactive session
conan ask "what day is it?"       # One-shot query (scriptable)

# Skills
conan skill list                  # Show active skills
conan skill install <package>     # Install a skill from npm
conan skill remove <package>      # Remove a skill

# Memory
conan memory list                 # See what Conan remembers about you
conan memory forget <id>          # Delete a memory

# Config
conan config show                 # Show current config
conan config set <key> <value>    # Update a value
```

### In-chat commands
```
/new      Start a fresh session
/memory   List your memories
/help     Show available commands
/exit     Quit
```

---

## Built-in Skills

These are always active — no setup needed:

| Skill | What it does |
|---|---|
| 🕐 Time | Current date and time in your timezone |
| 🧠 Memory | Remembers facts about you across sessions |
| ⏰ Reminders | Set reminders by time or relative ("in 2 hours") |
| 🌐 URL Reader | Read and summarize any public webpage |

---

## Installable Skills

Extend Conan with skills published on npm:

```bash
conan skill install conan-skill-weather
```

| Package | What it adds |
|---|---|
| [conan-skill-weather](https://github.com/AmrLotfy/conan-skill-weather) | Real-time weather + 3-day forecast |
| More coming soon... | |

---

## Build Your Own Skill

Any npm package that exports this shape works as a Conan skill:

```js
// conan-skill-example/index.js
module.exports = {
  name: 'my_skill',
  description: 'What this skill does',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The input' }
    },
    required: ['query']
  },
  async execute(args, context) {
    // context.config → user config
    // context.memory → memory store
    return `Result for: ${args.query}`
  }
}
```

Publish it to npm as `conan-skill-yourname` and anyone can install it with:
```bash
conan skill install conan-skill-yourname
```

---

## Config Reference

All config lives in `~/.conan/config.json`:

| Key | Description |
|---|---|
| `name` | Your name |
| `provider` | LLM provider: `openrouter`, `openai`, or `anthropic` |
| `openrouterKey` | OpenRouter API key (if using OpenRouter) |
| `openaiKey` | OpenAI API key (if using OpenAI direct) |
| `anthropicKey` | Anthropic API key (if using Anthropic direct) |
| `timezone` | IANA timezone (e.g. `Africa/Cairo`) |
| `model` | AI model (e.g. `gpt-4o-mini`, `claude-3-5-haiku-20241022`) |
| `weatherKey` | OpenWeatherMap API key (optional) |
| `skills` | List of installed skill packages |

Switch provider or model anytime:
```bash
conan config set provider anthropic
conan config set model claude-3-5-haiku-20241022
```

---

## Data & Privacy

- All data is stored locally in `~/.conan/`
- `config.json` — your settings and API keys
- `conan.db` — SQLite database (memories, chat history, reminders)
- Nothing is sent to any server except your LLM API calls (OpenRouter / OpenAI / Anthropic)

---

## Built by

**Amr Lotfy** — [GitHub](https://github.com/AmrLotfy) · [LinkedIn](https://www.linkedin.com/in/amr-lotfy-saleh-09438b113/)

MIT License
