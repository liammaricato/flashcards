export interface Deck {
  id: string
  name: string
  description: string
  created: string
  modified: string
  cardCount: number
  tags: string[]
  path: string
  folderName: string
}

export interface Card {
  id: string
  front: string
  back: string
  image: string | null
  metadata: {
    id: string
    created: string
    tags: string[]
    difficulty: string
    type?: string
    options?: string[]
  }
  fileName: string
}

export interface DeckAPI {
  getDecksDirectory: () => Promise<string>
  listDecks: () => Promise<Deck[]>
  createDeck: (name: string, description?: string) => Promise<Deck>
  getDeck: (folderName: string) => Promise<Deck>
  updateDeck: (folderName: string, updates: Partial<Deck>) => Promise<Deck>
  deleteDeck: (folderName: string) => Promise<{ success: boolean; folderName: string }>
}

export interface CardAPI {
  listCards: (deckPath: string) => Promise<Card[]>
  getCard: (deckPath: string, cardId: string) => Promise<Card>
  createCard: (deckPath: string, front: string, back: string, imagePath?: string | null, cardType?: string, options?: string[]) => Promise<Card>
  updateCard: (deckPath: string, cardId: string, updates: Partial<Card>) => Promise<Card>
  deleteCard: (deckPath: string, cardId: string) => Promise<{ success: boolean; cardId: string }>
  updateCardMarkdown: (deckPath: string, cardId: string, markdown: string) => Promise<Card>
  getImageData: (imagePath: string) => Promise<string>
}

export interface SettingsAPI {
  getAll: () => Promise<Record<string, unknown>>
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<{ success: boolean }>
}

export interface AiAPI {
  generateDeck: (options: {
    instructions: string
    numCards?: number
    deckName?: string
    description?: string
    cardType?: 'default' | 'input'
  }) => Promise<Deck>
}

declare global {
  interface Window {
    deckAPI: DeckAPI
    cardAPI: CardAPI
    settingsAPI: SettingsAPI
    aiAPI: AiAPI
  }
}

export {}

