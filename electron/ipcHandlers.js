import { ipcMain, shell } from 'electron'
import * as deckManager from './modules/deckManager.js'
import * as cardManager from './modules/cardManager.js'
import * as settingsManager from './modules/settingsManager.js'
import { generateDeckData } from './modules/aiGenerator.js'

export function registerIpcHandlers() {
  ipcMain.handle('deck:getDirectory', async () => {
    try {
      return await deckManager.getDecksDirectory()
    } catch (error) {
      throw new Error(`Failed to get decks directory: ${error.message}`)
    }
  })

  ipcMain.handle('deck:list', async () => {
    try {
      return await deckManager.listDecks()
    } catch (error) {
      throw new Error(`Failed to list decks: ${error.message}`)
    }
  })

  ipcMain.handle('deck:create', async (event, name, description) => {
    try {
      return await deckManager.createDeck(name, description)
    } catch (error) {
      throw new Error(`Failed to create deck: ${error.message}`)
    }
  })

  ipcMain.handle('deck:get', async (event, folderName) => {
    try {
      return await deckManager.getDeck(folderName)
    } catch (error) {
      throw new Error(`Failed to get deck: ${error.message}`)
    }
  })

  ipcMain.handle('deck:update', async (event, folderName, updates) => {
    try {
      return await deckManager.updateDeck(folderName, updates)
    } catch (error) {
      throw new Error(`Failed to update deck: ${error.message}`)
    }
  })

  ipcMain.handle('deck:delete', async (event, folderName) => {
    try {
      return await deckManager.deleteDeck(folderName)
    } catch (error) {
      throw new Error(`Failed to delete deck: ${error.message}`)
    }
  })

  ipcMain.handle('card:list', async (event, deckPath) => {
    try {
      return await cardManager.listCards(deckPath)
    } catch (error) {
      throw new Error(`Failed to list cards: ${error.message}`)
    }
  })

  ipcMain.handle('card:get', async (event, deckPath, cardId) => {
    try {
      return await cardManager.getCard(deckPath, cardId)
    } catch (error) {
      throw new Error(`Failed to get card: ${error.message}`)
    }
  })

  ipcMain.handle('card:create', async (event, deckPath, front, back, imagePath, cardType, options) => {
    try {
      return await cardManager.createCard(deckPath, front, back, imagePath, cardType, options)
    } catch (error) {
      throw new Error(`Failed to create card: ${error.message}`)
    }
  })

  ipcMain.handle('card:update', async (event, deckPath, cardId, updates) => {
    try {
      return await cardManager.updateCard(deckPath, cardId, updates)
    } catch (error) {
      throw new Error(`Failed to update card: ${error.message}`)
    }
  })

  ipcMain.handle('card:delete', async (event, deckPath, cardId) => {
    try {
      return await cardManager.deleteCard(deckPath, cardId)
    } catch (error) {
      throw new Error(`Failed to delete card: ${error.message}`)
    }
  })

  ipcMain.handle('card:updateMarkdown', async (event, deckPath, cardId, markdown) => {
    try {
      return await cardManager.updateCardFromMarkdown(deckPath, cardId, markdown)
    } catch (error) {
      throw new Error(`Failed to update card markdown: ${error.message}`)
    }
  })

  ipcMain.handle('card:getImageData', async (event, imagePath) => {
    try {
      const fs = await import('fs/promises')
      const imageData = await fs.readFile(imagePath)
      const base64 = imageData.toString('base64')
      const ext = imagePath.split('.').pop().toLowerCase()
      const mimeType = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      }[ext] || 'image/jpeg'
      
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      throw new Error(`Failed to load image: ${error.message}`)
    }
  })

  ipcMain.handle('deck:openDirectory', async () => {
    try {
      const dir = await deckManager.getDecksDirectory()
      await shell.openPath(dir)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to open decks directory: ${error.message}`)
    }
  })

  ipcMain.handle('settings:getAll', async () => {
    try {
      return await settingsManager.getAllSettings()
    } catch (error) {
      throw new Error(`Failed to get settings: ${error.message}`)
    }
  })

  ipcMain.handle('settings:get', async (event, key) => {
    try {
      return await settingsManager.getSetting(key)
    } catch (error) {
      throw new Error(`Failed to get setting: ${error.message}`)
    }
  })

  ipcMain.handle('settings:set', async (event, key, value) => {
    try {
      return await settingsManager.setSetting(key, value)
    } catch (error) {
      throw new Error(`Failed to save setting: ${error.message}`)
    }
  })

  ipcMain.handle('ai:generateDeck', async (event, options) => {
    try {
      const { instructions, numCards, deckName: explicitName, description: explicitDesc, cardType } = options || {}
      const ai = await generateDeckData(instructions, numCards)
      const deckName = explicitName && String(explicitName).trim() ? String(explicitName).trim() : ai.deckName
      const description = explicitDesc && String(explicitDesc).trim() ? String(explicitDesc).trim() : ai.description
      const deck = await deckManager.createDeck(deckName, description)
      for (const c of ai.cards) {
        await cardManager.createCard(deck.path, c.front, c.back, null, cardType || 'default')
      }
      return await deckManager.getDeck(deck.folderName)
    } catch (error) {
      throw new Error(`Failed to generate deck: ${error.message}`)
    }
  })
}

