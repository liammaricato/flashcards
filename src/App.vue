<template>
  <div class="app">
    <button @click="showSettings = true" class="settings-btn" aria-label="Open settings">⚙</button>
    <header v-if="currentView !== 'study'">
      <h1>Flashcards</h1>
      <p>Your study companion</p>
    </header>
    <main>
      <DeckList 
        v-if="currentView === 'list'" 
        @open-deck="openDeck" 
        @quick-play="startQuickPlay"
      />
      <CardView 
        v-else-if="currentView === 'cards'" 
        :deck="currentDeck" 
        @back="closeDeck"
        @study="startStudy"
      />
      <StudyMode
        v-else-if="currentView === 'study'"
        :deck="currentDeck"
        :cards="studyCards"
        @exit="exitStudy"
      />
    </main>
    <SettingsModal v-if="showSettings" @close="onCloseSettings" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DeckList from './components/DeckList.vue'
import CardView from './components/CardView.vue'
import StudyMode from './components/StudyMode.vue'
import SettingsModal from './components/SettingsModal.vue'
import { createQuickPlaySession } from './services/quickPlay.js'

const currentDeck = ref(null)
const inQuickPlay = ref(false)
const studyCards = ref([])
const currentView = ref('list')
const showSettings = ref(false)

function openDeck(deck) {
  currentDeck.value = deck
  currentView.value = 'cards'
}

function closeDeck() {
  currentDeck.value = null
  studyCards.value = []
  currentView.value = 'list'
}

async function startStudy() {
  try {
    const cards = await window.cardAPI.listCards(currentDeck.value.path)
    if (cards.length === 0) {
      alert('No cards to study!')
      return
    }
    studyCards.value = shuffleArray([...cards])
    currentView.value = 'study'
  } catch (err) {
    console.error('Failed to load cards for study:', err)
    alert('Failed to load cards for study')
  }
}

function startQuickPlay(options) {
  const { deck, cards } = createQuickPlaySession(options)
  inQuickPlay.value = true
  currentDeck.value = deck
  studyCards.value = shuffleArray(cards)
  currentView.value = 'study'
}

function exitStudy() {
  if (inQuickPlay.value) {
    currentDeck.value = null
    currentView.value = 'list'
    inQuickPlay.value = false
  } else {
    currentView.value = 'cards'
  }
  studyCards.value = []
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function onCloseSettings() {
  showSettings.value = false
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

header p {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
}

.settings-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 20px;
  font-weight: 900;
  -webkit-text-stroke: 0.6px currentColor;
  line-height: 1;
  border-radius: 9999px;
  background: rgba(255,255,255,0.9);
  color: #111827;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  cursor: pointer;
}
.settings-btn:hover {
  background: #ffffff;
}

main {
  flex: 1;
  padding: 0;
}
</style>

