<template>
  <div class="study-mode">
    <div class="study-header">
      <button @click="$emit('exit')" class="btn-back">← Exit Study Mode</button>
      <div class="deck-info">
        <h2>{{ deck.name }}</h2>
        <div class="progress">
          <span>Card {{ currentIndex + 1 }} / {{ cards.length }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
      <div class="stats">
        <span class="stat-remembered">✓ {{ remembered }}</span>
        <span class="stat-forgot">✗ {{ forgot }}</span>
      </div>
    </div>

    <div v-if="!completed" class="study-area">
      <div class="card-container" @click="flipCard">
        <div class="flashcard" :class="{ flipped: isFlipped }">
          <div class="flashcard-front">
            <div class="card-label">FRONT</div>
            <div class="card-content" v-html="renderMarkdown(currentCard.front)"></div>
            <div class="flip-hint">Click to flip</div>
          </div>
          <div class="flashcard-back">
            <div class="card-label">BACK</div>
            <div class="card-content" v-html="renderMarkdown(currentCard.back)"></div>
            <img v-if="currentImageData" :src="currentImageData" class="card-image" />
          </div>
        </div>
      </div>

      <div v-if="isFlipped" class="answer-buttons">
        <button @click="markForgot" class="btn-forgot">
          ✗ Forgot
        </button>
        <button @click="markRemembered" class="btn-remembered">
          ✓ Remembered
        </button>
      </div>
      <div v-else class="flip-instruction">
        <p>Click the card to see the answer</p>
      </div>
    </div>

    <div v-else class="study-complete">
      <div class="complete-icon">🎉</div>
      <h2>Study Session Complete!</h2>
      <div class="final-stats">
        <div class="stat-box stat-remembered">
          <div class="stat-number">{{ remembered }}</div>
          <div class="stat-label">Remembered</div>
        </div>
        <div class="stat-box stat-forgot">
          <div class="stat-number">{{ forgot }}</div>
          <div class="stat-label">Forgot</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">{{ accuracy }}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
      </div>
      <div class="complete-actions">
        <button @click="restartStudy" class="btn-primary">Study Again</button>
        <button @click="$emit('exit')" class="btn-secondary">Back to Deck</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  deck: {
    type: Object,
    required: true
  },
  cards: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['exit'])

const currentIndex = ref(0)
const isFlipped = ref(false)
const remembered = ref(0)
const forgot = ref(0)
const completed = ref(false)
const imageDataMap = ref({})

const currentCard = computed(() => props.cards[currentIndex.value])

const currentImageData = computed(() => {
  return imageDataMap.value[currentCard.value?.id] || null
})

const progress = computed(() => {
  return ((currentIndex.value + 1) / props.cards.length) * 100
})

const accuracy = computed(() => {
  const total = remembered.value + forgot.value
  if (total === 0) return 0
  return Math.round((remembered.value / total) * 100)
})

onMounted(async () => {
  await loadImages()
})

watch(() => currentCard.value, async () => {
  if (currentCard.value && !imageDataMap.value[currentCard.value.id] && currentCard.value.image) {
    await loadImageForCard(currentCard.value)
  }
})

async function loadImages() {
  for (const card of props.cards) {
    if (card.image) {
      await loadImageForCard(card)
    }
  }
}

async function loadImageForCard(card) {
  try {
    const fullPath = `${props.deck.path}/${card.image}`.replace(/\/+/g, '/')
    const imageData = await window.cardAPI.getImageData(fullPath)
    imageDataMap.value[card.id] = imageData
  } catch (err) {
    console.error(`Failed to load image for card ${card.id}:`, err)
  }
}

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function markRemembered() {
  remembered.value++
  nextCard()
}

function markForgot() {
  forgot.value++
  nextCard()
}

function nextCard() {
  if (isFlipped.value) {
    isFlipped.value = false
    setTimeout(() => {
      moveToNextCard()
    }, 600)
  } else {
    moveToNextCard()
  }
}

function moveToNextCard() {
  if (currentIndex.value < props.cards.length - 1) {
    currentIndex.value++
  } else {
    completed.value = true
  }
}

function restartStudy() {
  currentIndex.value = 0
  isFlipped.value = false
  remembered.value = 0
  forgot.value = 0
  completed.value = false
}

function renderMarkdown(content) {
  return marked(content)
}
</script>

<style scoped>
.study-mode {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.study-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.btn-back {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.deck-info {
  flex: 1;
  text-align: center;
  color: white;
}

.deck-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.progress span {
  font-size: 0.875rem;
  opacity: 0.9;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.stats {
  display: flex;
  gap: 1rem;
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
}

.stat-remembered {
  color: #4ade80;
}

.stat-forgot {
  color: #f87171;
}

.study-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.card-container {
  perspective: 1000px;
  width: 100%;
  max-width: 600px;
  height: 400px;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.flashcard-front {
  transform: rotateY(0deg);
  z-index: 2;
}

.flashcard-back {
  transform: rotateY(180deg);
}

.card-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  text-align: center;
  overflow-y: auto;
}

.card-content :deep(p) {
  margin: 0.5rem 0;
}

.card-content :deep(code) {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 1.25rem;
}

.card-image {
  max-width: 100%;
  max-height: 150px;
  margin-top: 1rem;
  border-radius: 8px;
  object-fit: contain;
}

.flip-hint {
  text-align: center;
  font-size: 0.875rem;
  color: #999;
  margin-top: 1rem;
}

.flip-instruction {
  text-align: center;
  color: white;
  font-size: 1.125rem;
  opacity: 0.9;
}

.answer-buttons {
  display: flex;
  gap: 1rem;
}

.btn-forgot,
.btn-remembered {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-forgot {
  background: #f87171;
  color: white;
}

.btn-forgot:hover {
  background: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn-remembered {
  background: #4ade80;
  color: white;
}

.btn-remembered:hover {
  background: #22c55e;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.study-complete {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.study-complete h2 {
  margin: 0 0 2rem 0;
  color: #333;
}

.final-stats {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.stat-box {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 120px;
}

.stat-box.stat-remembered {
  background: #dcfce7;
}

.stat-box.stat-forgot {
  background: #fee2e2;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
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
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .study-header {
    flex-direction: column;
    gap: 1rem;
  }

  .card-container {
    height: 350px;
  }

  .answer-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn-forgot,
  .btn-remembered {
    width: 100%;
  }

  .final-stats {
    flex-direction: column;
  }
}
</style>

