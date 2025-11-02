<template>
  <div class="card-view">
    <div class="card-view-header">
      <button @click="$emit('back')" class="btn-back">← Back to Decks</button>
      <div class="deck-info">
        <h2>{{ deck.name }}</h2>
        <p>{{ cards.length }} cards</p>
      </div>
      <div class="header-actions">
        <button 
          @click="$emit('study')" 
          class="btn-study" 
          :disabled="cards.length === 0"
        >
          📚 Study
        </button>
        <button @click="showCreateForm = true" class="btn-primary">+ New Card</button>
      </div>
    </div>

    <div v-if="showCreateForm" class="card-form-modal">
      <div class="modal-overlay" @click="cancelCreate"></div>
      <div class="modal-content">
        <CardForm
          :deck-path="deck.path"
          @save="handleCreateCard"
          @cancel="cancelCreate"
        />
      </div>
    </div>

    <div v-if="editingCard" class="card-form-modal">
      <div class="modal-overlay" @click="cancelEdit"></div>
      <div class="modal-content">
        <CardForm
          :card="editingCard"
          :deck-path="deck.path"
          @save="handleUpdateCard"
          @cancel="cancelEdit"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">Loading cards...</div>

    <div v-else-if="cards.length === 0" class="empty-state">
      <p>No cards yet. Create your first card!</p>
    </div>

    <div v-else class="cards-list">
      <div
        v-for="card in cards"
        :key="card.id"
        class="card-item"
      >
        <div class="card-content">
          <div class="card-side">
            <label>Front:</label>
            <div class="markdown-content" v-html="renderMarkdown(card.front)"></div>
          </div>
          <div class="card-side">
            <label>Back:</label>
            <div class="markdown-content" v-html="renderMarkdown(card.back)"></div>
            <img v-if="imageDataMap[card.id]" :src="imageDataMap[card.id]" class="card-image" />
          </div>
        </div>
        <div class="card-actions">
          <button @click="editCard(card)" class="btn-small">Edit</button>
          <button @click="deleteCardPrompt(card)" class="btn-small btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import CardForm from './CardForm.vue'

const props = defineProps({
  deck: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'study'])

const cards = ref([])
const imageDataMap = ref({})
const loading = ref(true)
const showCreateForm = ref(false)
const editingCard = ref(null)
const error = ref('')

onMounted(async () => {
  await loadCards()
})

async function loadCards() {
  try {
    loading.value = true
    cards.value = await window.cardAPI.listCards(props.deck.path)
    
    for (const card of cards.value) {
      if (card.image) {
        try {
          const fullPath = `${props.deck.path}/${card.image}`.replace(/\/+/g, '/')
          const imageData = await window.cardAPI.getImageData(fullPath)
          imageDataMap.value[card.id] = imageData
        } catch (err) {
          console.error(`Failed to load image for card ${card.id}:`, err)
        }
      }
    }
  } catch (err) {
    error.value = `Failed to load cards: ${err.message}`
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function handleCreateCard(cardData) {
  try {
    await window.cardAPI.createCard(
      props.deck.path,
      cardData.front,
      cardData.back,
      cardData.imagePath
    )
    await loadCards()
    showCreateForm.value = false
  } catch (err) {
    error.value = `Failed to create card: ${err.message}`
    console.error(err)
  }
}

async function handleUpdateCard(cardData) {
  try {
    await window.cardAPI.updateCard(
      props.deck.path,
      editingCard.value.id,
      cardData
    )
    await loadCards()
    editingCard.value = null
  } catch (err) {
    error.value = `Failed to update card: ${err.message}`
    console.error(err)
  }
}

function editCard(card) {
  editingCard.value = card
}

function cancelCreate() {
  showCreateForm.value = false
}

function cancelEdit() {
  editingCard.value = null
}

async function deleteCardPrompt(card) {
  if (confirm(`Are you sure you want to delete this card?`)) {
    try {
      await window.cardAPI.deleteCard(props.deck.path, card.id)
      await loadCards()
    } catch (err) {
      error.value = `Failed to delete card: ${err.message}`
      console.error(err)
    }
  }
}

function renderMarkdown(content) {
  return marked(content)
}
</script>

<style scoped>
.card-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.btn-back {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #e0e0e0;
}

.deck-info {
  flex: 1;
  text-align: center;
}

.deck-info h2 {
  margin: 0;
  font-size: 1.5rem;
}

.deck-info p {
  margin: 0.25rem 0 0 0;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-study {
  padding: 0.75rem 1.5rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-study:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-2px);
}

.btn-study:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
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
  white-space: nowrap;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.card-form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  z-index: 1001;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.card-side {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-side label {
  font-weight: 600;
  color: #667eea;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.markdown-content {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  min-height: 3rem;
}

.markdown-content :deep(p) {
  margin: 0.5rem 0;
}

.markdown-content :deep(code) {
  background: #e0e0e0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.card-image {
  max-width: 100%;
  margin-top: 1rem;
  border-radius: 4px;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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

@media (max-width: 768px) {
  .card-content {
    grid-template-columns: 1fr;
  }
  
  .card-view-header {
    flex-direction: column;
  }
}
</style>

