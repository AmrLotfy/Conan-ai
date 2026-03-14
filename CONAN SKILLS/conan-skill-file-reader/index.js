/**
 * conan-skill-file-reader
 * Read and summarize local files — txt, md, json, csv, log, js, py, etc.
 * No API key needed. Pure local — your files never leave your machine.
 *
 * Usage: "read my log file at /var/log/app.log"
 *        "summarize ~/Documents/notes.md"
 *        "what's in ~/Desktop/data.json?"
 */

const fs   = require('fs')
const path = require('path')
const os   = require('os')

// Max chars to read — prevents sending huge files to the LLM
const MAX_CHARS = 12000

// File types we can read as plain text
const READABLE_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.log', '.json', '.jsonl',
  '.csv', '.tsv', '.yaml', '.yml', '.toml', '.ini', '.env',
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.php', '.go', '.rs', '.java', '.kt', '.swift',
  '.sh', '.bash', '.zsh', '.fish',
  '.html', '.htm', '.css', '.scss', '.xml',
  '.sql', '.graphql',
  '.conf', '.config', '.cfg',
  ''  // no extension (like Makefile, Dockerfile)
])

module.exports = {
  name: 'read_file',
  description: 'Read a local file from the user\'s computer and return its contents. Supports text files: txt, md, log, json, csv, js, py, sh, yaml, and more. Use ~ for home directory.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute or relative file path. Use ~ for home directory (e.g. ~/Documents/notes.txt, /var/log/app.log).'
      },
      lines: {
        type: 'number',
        description: 'Read only the first N lines instead of the whole file. Useful for large log files.'
      },
      tail: {
        type: 'number',
        description: 'Read only the last N lines. Useful for "show me the latest errors in the log".'
      }
    },
    required: ['path']
  },

  async execute(args) {
    let { path: filePath, lines, tail } = args

    // Expand ~ to home directory
    if (filePath.startsWith('~')) {
      filePath = path.join(os.homedir(), filePath.slice(1))
    }

    // Resolve to absolute path
    filePath = path.resolve(filePath)

    // Security: block sensitive system paths
    const blocked = [
      '/etc/passwd', '/etc/shadow', '/etc/sudoers',
      path.join(os.homedir(), '.ssh'),
      path.join(os.homedir(), '.gnupg'),
    ]
    for (const b of blocked) {
      if (filePath.startsWith(b)) {
        return `❌ Access to "${filePath}" is blocked for security reasons.`
      }
    }

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return `❌ File not found: ${filePath}`
    }

    // Check it's a file (not a directory)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      // List directory contents instead
      const entries = fs.readdirSync(filePath)
      const listing = entries.map(e => {
        const fullPath = path.join(filePath, e)
        const s = fs.statSync(fullPath)
        const type = s.isDirectory() ? '📁' : '📄'
        const size = s.isFile() ? formatSize(s.size) : ''
        return `  ${type} ${e}${size ? '  (' + size + ')' : ''}`
      })
      return [
        `📁 Directory: ${filePath}`,
        `${entries.length} items:\n`,
        ...listing
      ].join('\n')
    }

    // Check extension is readable
    const ext = path.extname(filePath).toLowerCase()
    if (!READABLE_EXTENSIONS.has(ext)) {
      return [
        `❌ Cannot read binary file: ${path.basename(filePath)}`,
        `   Supported: text, code, log, json, csv, yaml, md, and more.`
      ].join('\n')
    }

    // File size check
    if (stat.size > 10 * 1024 * 1024) { // 10 MB
      return `❌ File too large (${formatSize(stat.size)}). Maximum supported size is 10 MB.`
    }

    // Read the file
    let content
    try {
      content = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
      return `❌ Could not read file: ${err.message}`
    }

    const allLines = content.split('\n')
    let selectedLines

    if (tail && tail > 0) {
      // Last N lines
      selectedLines = allLines.slice(-Math.min(tail, allLines.length))
    } else if (lines && lines > 0) {
      // First N lines
      selectedLines = allLines.slice(0, Math.min(lines, allLines.length))
    } else {
      selectedLines = allLines
    }

    let result = selectedLines.join('\n')

    // Truncate if too long
    let truncated = false
    if (result.length > MAX_CHARS) {
      result    = result.slice(0, MAX_CHARS)
      truncated = true
    }

    const fileName  = path.basename(filePath)
    const lineCount = selectedLines.length
    const note      = truncated
      ? `\n\n⚠️ File truncated to ${MAX_CHARS} characters. Use the "lines" parameter to read specific sections.`
      : ''

    const header = tail
      ? `📄 **${fileName}** — last ${lineCount} lines`
      : lines
      ? `📄 **${fileName}** — first ${lineCount} lines`
      : `📄 **${fileName}** — ${lineCount} lines, ${formatSize(stat.size)}`

    return `${header}\n\`\`\`\n${result}\n\`\`\`${note}`
  }
}

function formatSize(bytes) {
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
