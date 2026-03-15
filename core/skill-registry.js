/**
 * Skill Registry
 * Loads built-in and external skill packages, exposes tool definitions to the LLM.
 * register() → has() → execute() → toolDefinitions()
 *
 * External skills are npm packages named conan-skill-*
 * They are auto-loaded from config.skills list.
 */

const { validateSkill } = require('../contracts/skill')

class SkillRegistry {
  constructor() {
    this._skills = new Map()
  }

  register(skill) {
    validateSkill(skill)
    this._skills.set(skill.name, skill)
    return this // fluent chaining
  }

  has(name) {
    return this._skills.has(name)
  }

  async execute(name, args, context) {
    const skill = this._skills.get(name)
    if (!skill) throw new Error(`Skill not found: ${name}`)
    return await skill.execute(args, context)
  }

  toolDefinitions() {
    const tools = []
    for (const skill of this._skills.values()) {
      tools.push({
        type: 'function',
        function: {
          name:        skill.name,
          description: skill.description,
          parameters:  skill.parameters,
        },
      })
    }
    return tools
  }

  list() {
    return Array.from(this._skills.values()).map(s => ({
      name:        s.name,
      description: s.description,
    }))
  }
}

module.exports = SkillRegistry
