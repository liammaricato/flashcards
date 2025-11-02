import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

const DECKS_DIR = path.join(app.getPath('documents'), 'Flashcards')

async function ensureDecksDirectory() {
  try {
    await fs.access(DECKS_DIR)
  } catch {
    await fs.mkdir(DECKS_DIR, { recursive: true })
  }
}

export async function getDecksDirectory() {
  await ensureDecksDirectory()
  return DECKS_DIR
}

export async function listDecks() {
  await ensureDecksDirectory()
  
  const entries = await fs.readdir(DECKS_DIR, { withFileTypes: true })
  const deckFolders = entries.filter(entry => entry.isDirectory())
  
  const decks = []
  
  for (const folder of deckFolders) {
    const deckPath = path.join(DECKS_DIR, folder.name)
    const metadataPath = path.join(deckPath, 'deck.json')
    
    try {
      const metadata = await fs.readFile(metadataPath, 'utf-8')
      const deckData = JSON.parse(metadata)
      decks.push({
        ...deckData,
        path: deckPath,
        folderName: folder.name
      })
    } catch (error) {
      console.warn(`Could not read deck metadata for ${folder.name}:`, error.message)
    }
  }
  
  return decks
}

export async function createDeck(name, description = '') {
  await ensureDecksDirectory()
  
  const folderName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const deckPath = path.join(DECKS_DIR, folderName)
  
  try {
    await fs.access(deckPath)
    throw new Error('Deck already exists')
  } catch (error) {
    if (error.message === 'Deck already exists') {
      throw error
    }
  }
  
  await fs.mkdir(deckPath, { recursive: true })
  await fs.mkdir(path.join(deckPath, 'assets'), { recursive: true })
  
  const metadata = {
    id: Date.now().toString(),
    name,
    description,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    cardCount: 0,
    tags: []
  }
  
  await fs.writeFile(
    path.join(deckPath, 'deck.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )
  
  return {
    ...metadata,
    path: deckPath,
    folderName
  }
}

export async function getDeck(folderName) {
  const deckPath = path.join(DECKS_DIR, folderName)
  const metadataPath = path.join(deckPath, 'deck.json')
  
  try {
    const metadata = await fs.readFile(metadataPath, 'utf-8')
    const deckData = JSON.parse(metadata)
    return {
      ...deckData,
      path: deckPath,
      folderName
    }
  } catch (error) {
    throw new Error(`Deck not found: ${folderName}`)
  }
}

export async function updateDeck(folderName, updates) {
  const deckPath = path.join(DECKS_DIR, folderName)
  const metadataPath = path.join(deckPath, 'deck.json')
  
  const metadata = await fs.readFile(metadataPath, 'utf-8')
  const deckData = JSON.parse(metadata)
  
  const updatedData = {
    ...deckData,
    ...updates,
    modified: new Date().toISOString()
  }
  
  await fs.writeFile(
    metadataPath,
    JSON.stringify(updatedData, null, 2),
    'utf-8'
  )
  
  return {
    ...updatedData,
    path: deckPath,
    folderName
  }
}

export async function deleteDeck(folderName) {
  const deckPath = path.join(DECKS_DIR, folderName)
  
  await fs.rm(deckPath, { recursive: true, force: true })
  
  return { success: true, folderName }
}

