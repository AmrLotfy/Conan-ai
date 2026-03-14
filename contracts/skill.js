/**
 * Conan Skill Contract
 *
 * Every skill (built-in or external plugin) must export an object
 * conforming to this shape. The 4 required fields map directly to
 * what OpenRouter expects in its `tools` array.
 *
 * Example:
 *   module.exports = {
 *     name: 'get_weather',
 *     description: 'Get current weather for a city',
 *     parameters: {
 *       type: 'object',
 *       properties: { city: { type: 'string' } },
 *       required: ['city']
 *     },
 *     async execute(args, context) {
 *       return `Weather in ${args.city}: sunny, 25°C`
 *     }
 *   }
 *
 * context object passed to execute():
 *   - context.config    → user config (~/.conan/config.json)
 *   - context.memory    → memory module (remember/recall/forget)
 *   - context.userId    → string identifier for this user
 */

// This file is documentation only — no runtime code needed.
// Import and validate skill shape in skill-registry.js.

function validateSkill(skill) {
  const required = ['name', 'description', 'parameters', 'execute']
  for (const field of required) {
    if (!skill[field]) {
      throw new Error(`Skill is missing required field: "${field}"`)
    }
  }
  if (typeof skill.execute !== 'function') {
    throw new Error(`Skill "${skill.name}" execute must be a function`)
  }
  return true
}

module.exports = { validateSkill }
