/**
 * Config Manager
 * Reads/writes ~/.conan/config.json
 * This is where API keys, user name, timezone, model preference live.
 */

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const CONAN_DIR  = path.join(os.homedir(), '.conan')
const CONFIG_FILE = path.join(CONAN_DIR, 'config.json')

const DEFAULTS = {
  name:     'there',
  timezone: 'UTC',
  model:    'openai/gpt-4o-mini',
  openrouterKey: '',
  skills:   [],       // list of installed external skill package names
  version:  '0.1.0'
}

function ensureDir() {
  if (!fs.existsSync(CONAN_DIR)) {
    fs.mkdirSync(CONAN_DIR, { recursive: true })
  }
}

function load() {
  ensureDir()
  if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULTS }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(config) {
  ensureDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}

function get(key) {
  const config = load()
  return key ? config[key] : config
}

function set(key, value) {
  const config = load()
  config[key] = value
  save(config)
}

function isInitialized() {
  return fs.existsSync(CONFIG_FILE) && !!get('openrouterKey')
}

function getConanDir() {
  return CONAN_DIR
}

module.exports = { load, save, get, set, isInitialized, getConanDir, CONAN_DIR, CONFIG_FILE }
