<template>
  <div class="deck-list">
    <div class="deck-list-header">
      <h2>Your Decks</h2>
      <button @click="showCreateForm = true" class="btn-primary">
        + New Deck
      </button>
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

const emit = defineEmits(['open-deck'])

const decks = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const newDeckName = ref('')
const newDeckDescription = ref('')
const error = ref('')
const decksDirectory = ref('')

onMounted(async () => {
  await loadDecks()
  await loadDecksDirectory()
})

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

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
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
</style>

