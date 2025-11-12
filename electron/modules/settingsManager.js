import fs from 'fs/promises'
import path from 'node:path'
import { app } from 'electron'

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')

async function readSettingsFile() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function writeSettingsFile(settings) {
  const dir = path.dirname(SETTINGS_FILE)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch {}
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

export async function getAllSettings() {
  const settings = await readSettingsFile()
  return settings
}

export async function getSetting(key) {
  const settings = await readSettingsFile()
  return settings[key]
}

export async function setSetting(key, value) {
  const settings = await readSettingsFile()
  if (value === null || value === undefined || value === '') {
    delete settings[key]
  } else {
    settings[key] = value
  }
  await writeSettingsFile(settings)
  return { success: true }
}


