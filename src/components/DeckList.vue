<template>
  <div class="deck-list">
    <div class="deck-list-header">
      <h2>Your Decks</h2>
      <div class="deck-list-actions">
        <button @click="showQuickPlay = true" class="btn-secondary">
          <span class="icon" aria-hidden="true">⚡</span>
          Quick Play
        </button>
        <button @click="openAIGen" class="btn-secondary">
          <span class="icon" aria-hidden="true">🤖</span>
          Generate with AI
        </button>
        <button @click="openDecksFolder" class="btn-secondary">
          <span class="icon" aria-hidden="true">📂</span>
          Open Folder
        </button>
        <button @click="showCreateForm = true" class="btn-primary">
          + New Deck
        </button>
      </div>
    </div>

    <div v-if="aiGenerating" class="blocking-overlay" aria-live="polite" aria-busy="true">
      <div class="blocking-content">
        <div class="spinner" aria-hidden="true"></div>
        <h3>Generating deck…</h3>
        <p>This may take a few seconds. Please wait.</p>
      </div>
    </div>

    <div v-if="showAIGen" class="modal">
      <div class="modal-overlay" @click="cancelAIGen"></div>
      <div class="modal-content">
        <h3>Generate with AI</h3>
        <div class="modal-row">
          <label class="label">Instructions</label>
          <textarea
            v-model="aiInstructions"
            class="input"
            rows="4"
            placeholder="e.g., Create flashcards to learn the basics of photosynthesis for high school level"
          ></textarea>
        </div>
        <div class="modal-row">
          <label class="label">Number of Cards</label>
          <input
            v-model.number="aiNumCards"
            type="number"
            min="1"
            max="50"
            step="1"
            class="input"
            placeholder="10"
          />
        </div>
        <div class="modal-row">
          <label class="label">Card Type</label>
          <select v-model="aiCardType" class="input">
            <option value="default">Default</option>
            <option value="input">Input</option>
          </select>
        </div>
        <div class="modal-row">
          <label class="label">Deck Name (optional)</label>
          <input
            v-model="aiDeckName"
            type="text"
            class="input"
            placeholder="AI Generated Deck"
          />
        </div>
        <div class="modal-row">
          <label class="label">Description (optional)</label>
          <input
            v-model="aiDescription"
            type="text"
            class="input"
            placeholder="Short description"
          />
        </div>
        <div class="form-actions">
          <button @click="confirmAIGen" class="btn-primary" :disabled="aiGenerating">
            {{ aiGenerating ? 'Generating...' : 'Generate' }}
          </button>
          <button @click="cancelAIGen" class="btn-secondary" :disabled="aiGenerating">Cancel</button>
        </div>
        <div class="modal-row">
          <p v-if="aiError" class="error">{{ aiError }}</p>
        </div>
      </div>
    </div>

    <div v-if="showQuickPlay" class="modal">
      <div class="modal-overlay" @click="cancelQuickPlay"></div>
      <div class="modal-content">
        <h3>Quick Play</h3>
        <div class="modal-row">
          <label class="label">Subject</label>
          <select v-model="qpSubject" class="input">
            <option value="numbers-to-sino-korean">Numbers to Sino-Korean</option>
            <option value="sino-korean-to-numbers">Sino-Korean to Numbers</option>
          </select>
        </div>
        <div class="modal-row">
          <label class="label">Card Type</label>
          <select v-model="qpCardType" class="input">
            <option value="default">Default</option>
            <option value="input">Input</option>
          </select>
        </div>
        <div class="modal-row">
          <label class="label">Number of Cards</label>
          <input
            v-model.number="qpNumCards"
            type="number"
            min="1"
            step="1"
            class="input"
            placeholder="10"
          />
        </div>
        <div class="form-actions">
          <button @click="confirmQuickPlay" class="btn-primary">Start</button>
          <button @click="cancelQuickPlay" class="btn-secondary">Cancel</button>
        </div>
        <p v-if="qpError" class="error">{{ qpError }}</p>
      </div>
    </div>

    <div v-if="showCreateForm" class="create-form">
      <h3>Create New Deck</h3>
      <input
        v-model="newDeckName"
        type="text"
        placeholder="Deck name"
        class="input"
        @keyup.enter="createDeck"
      />
      <textarea
        v-model="newDeckDescription"
        placeholder="Description (optional)"
        class="input"
        rows="3"
      ></textarea>
      <div class="form-actions">
        <button @click="createDeck" class="btn-primary">Create</button>
        <button @click="cancelCreate" class="btn-secondary">Cancel</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div v-if="loading" class="loading">Loading decks...</div>

    <div v-else-if="decks.length === 0" class="empty-state">
      <p>No decks yet. Create your first deck to get started!</p>
    </div>

    <div v-else class="decks-grid">
      <div
        v-for="deck in decks"
        :key="deck.id"
        class="deck-card"
      >
        <div class="deck-info">
          <h3>{{ deck.name }}</h3>
          <p class="deck-description">{{ deck.description }}</p>
          <div class="deck-stats">
            <span>{{ deck.cardCount }} cards</span>
            <span class="deck-date">Created {{ formatDate(deck.created) }}</span>
          </div>
        </div>
        <div class="deck-actions">
          <button @click="openDeck(deck)" class="btn-small">Open</button>
          <button @click="deleteDeckPrompt(deck)" class="btn-small btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <div class="decks-path">
      <small>Decks stored in: {{ decksDirectory }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['open-deck', 'quick-play'])

const decks = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const showQuickPlay = ref(false)
const showAIGen = ref(false)
const newDeckName = ref('')
const newDeckDescription = ref('')
const error = ref('')
const decksDirectory = ref('')

const qpSubject = ref('numbers-to-sino-korean')
const qpCardType = ref('input')
const qpNumCards = ref(10)
const qpError = ref('')

const aiInstructions = ref('')
const aiNumCards = ref(10)
const aiDeckName = ref('')
const aiDescription = ref('')
const aiError = ref('')
const aiGenerating = ref(false)
const aiCardType = ref('default')

onMounted(async () => {
  await loadDecks()
  await loadDecksDirectory()
})

async function openDecksFolder() {
  try {
    await window.deckAPI.openDecksDirectory()
  } catch (err) {
    console.error('Failed to open decks directory:', err)
  }
}

async function loadDecks() {
  try {
    loading.value = true
    decks.value = await window.deckAPI.listDecks()
  } catch (err) {
    error.value = `Failed to load decks: ${err.message}`
  } finally {
    loading.value = false
  }
}

async function loadDecksDirectory() {
  try {
    decksDirectory.value = await window.deckAPI.getDecksDirectory()
  } catch (err) {
    console.error('Failed to get decks directory:', err)
  }
}

async function createDeck() {
  if (!newDeckName.value.trim()) {
    error.value = 'Please enter a deck name'
    return
  }

  try {
    error.value = ''
    await window.deckAPI.createDeck(
      newDeckName.value.trim(),
      newDeckDescription.value.trim()
    )
    await loadDecks()
    cancelCreate()
  } catch (err) {
    error.value = err.message
  }
}

function cancelCreate() {
  showCreateForm.value = false
  newDeckName.value = ''
  newDeckDescription.value = ''
  error.value = ''
}

function openDeck(deck) {
  emit('open-deck', deck)
}

async function deleteDeckPrompt(deck) {
  if (confirm(`Are you sure you want to delete "${deck.name}"?`)) {
    try {
      await window.deckAPI.deleteDeck(deck.folderName)
      await loadDecks()
    } catch (err) {
      error.value = `Failed to delete deck: ${err.message}`
    }
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

function cancelQuickPlay() {
  showQuickPlay.value = false
  qpError.value = ''
}

function confirmQuickPlay() {
  if (!qpNumCards.value || qpNumCards.value < 1) {
    qpError.value = 'Enter a valid number of cards'
    return
  }
  qpError.value = ''
  const options = {
    subject: qpSubject.value,
    cardType: qpCardType.value,
    numCards: qpNumCards.value
  }
  showQuickPlay.value = false
  emit('quick-play', options)
}

function openAIGen() {
  showAIGen.value = true
  aiError.value = ''
}

function cancelAIGen() {
  if (aiGenerating.value) return
  showAIGen.value = false
  aiInstructions.value = ''
  aiDeckName.value = ''
  aiDescription.value = ''
  aiNumCards.value = 10
  aiError.value = ''
  aiCardType.value = 'default'
}

async function confirmAIGen() {
  if (!aiInstructions.value.trim()) {
    aiError.value = 'Enter instructions for the AI'
    return
  }

  const proposed = aiDeckName.value.trim()
  if (proposed) {
    const folderName = proposed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    try {
      const currentDecks = await window.deckAPI.listDecks()
      const exists = currentDecks.some(d => d.folderName === folderName)
      if (exists) {
        aiError.value = 'A deck with this name already exists'
        return
      }
    } catch {}
  }

  const key = await window.settingsAPI.get('DEEPSEEK_API_KEY').catch(() => null)
  if (!key || typeof key !== 'string' || !key.trim()) {
    aiError.value = 'Set your DEEPSEEK_API_KEY in Settings (top-right)'
    return
  }
  
  aiError.value = ''
  aiGenerating.value = true
  try {
    const createdDeck = await window.aiAPI.generateDeck({
      instructions: aiInstructions.value.trim(),
      numCards: aiNumCards.value,
      deckName: aiDeckName.value.trim() || undefined,
      description: aiDescription.value.trim() || undefined,
      cardType: aiCardType.value
    })
    await loadDecks()
    cancelAIGen()
    if (createdDeck) {
      emit('open-deck', createdDeck)
    }
  } catch (err) {
    aiError.value = err?.message || 'Failed to generate deck'
  } finally {
    aiGenerating.value = false
  }
}
</script>

<style scoped>
.deck-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.deck-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.deck-list-actions {
  display: flex;
  gap: 0.5rem;
}

.deck-list-header h2 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.create-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.create-form h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-2px);
}

.btn-small {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.decks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.deck-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.deck-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.deck-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.25rem;
}

.deck-description {
  color: #666;
  margin: 0 0 1rem 0;
  min-height: 3rem;
}

.deck-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #999;
  margin-bottom: 1rem;
}

.deck-actions {
  display: flex;
  gap: 0.5rem;
}

.decks-path {
  text-align: center;
  color: #999;
  margin-top: 2rem;
}

.error {
  color: #e74c3c;
  margin: 1rem 0 0 0;
}

.modal .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal .modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.modal .label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 600;
}

.modal .modal-row {
  margin-bottom: 1rem;
}

.blocking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.blocking-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  text-align: center;
  color: #374151;
  width: 360px;
  max-width: calc(100% - 2rem);
}

.blocking-content h3 {
  margin: 0.75rem 0 0.25rem 0;
}

.blocking-content p {
  margin: 0;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

