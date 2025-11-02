const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('deckAPI', {
  getDecksDirectory: () => ipcRenderer.invoke('deck:getDirectory'),
  listDecks: () => ipcRenderer.invoke('deck:list'),
  createDeck: (name, description) => ipcRenderer.invoke('deck:create', name, description),
  getDeck: (folderName) => ipcRenderer.invoke('deck:get', folderName),
  updateDeck: (folderName, updates) => ipcRenderer.invoke('deck:update', folderName, updates),
  deleteDeck: (folderName) => ipcRenderer.invoke('deck:delete', folderName)
})

contextBridge.exposeInMainWorld('cardAPI', {
  listCards: (deckPath) => ipcRenderer.invoke('card:list', deckPath),
  getCard: (deckPath, cardId) => ipcRenderer.invoke('card:get', deckPath, cardId),
  createCard: (deckPath, front, back, imagePath) => ipcRenderer.invoke('card:create', deckPath, front, back, imagePath),
  updateCard: (deckPath, cardId, updates) => ipcRenderer.invoke('card:update', deckPath, cardId, updates),
  deleteCard: (deckPath, cardId) => ipcRenderer.invoke('card:delete', deckPath, cardId),
  updateCardMarkdown: (deckPath, cardId, markdown) => ipcRenderer.invoke('card:updateMarkdown', deckPath, cardId, markdown),
  getImageData: (imagePath) => ipcRenderer.invoke('card:getImageData', imagePath)
})

