<template>
  <div class="multiple-choice-card">
    <div class="card-container">
      <div class="flashcard">
        <div class="card-header">
          <div class="card-label">QUESTION</div>
          <button 
            @click.stop="$emit('speak', front)" 
            class="tts-button"
            :class="{ speaking: isSpeaking }"
            title="Listen to text"
          >
            🔊
          </button>
        </div>
        <div class="card-content" v-html="renderMarkdown(front)"></div>
        <img v-if="imageData" :src="imageData" class="card-image" />
        
        <div class="options-grid">
          <button
            v-for="(option, index) in shuffledOptions"
            :key="index"
            @click="selectOption(option)"
            class="option-button"
            :class="{
              selected: selectedOption === option,
              correct: answered && option === back,
              incorrect: answered && selectedOption === option && option !== back
            }"
            :disabled="answered"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="answered" class="answer-buttons">
      <button @click="$emit('next')" class="btn-next">
        Next Card →
      </button>
    </div>
    <div v-else class="hint-section">
      <p>Select the correct answer</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  front: String,
  back: String,
  options: Array,
  imageData: String,
  isSpeaking: Boolean
})

const emit = defineEmits(['answer', 'next', 'speak'])

const selectedOption = ref(null)
const answered = ref(false)
const shuffledOptions = ref([])

function initializeOptions() {
  const allOptions = [props.back, ...(props.options || [])]
  shuffledOptions.value = shuffleArray(allOptions)
  selectedOption.value = null
  answered.value = false
}

onMounted(() => {
  initializeOptions()
})

watch(() => [props.front, props.back], () => {
  initializeOptions()
})

function renderMarkdown(content) {
  return marked(content)
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function selectOption(option) {
  if (answered.value) return
  
  selectedOption.value = option
  answered.value = true
  
  const isCorrect = option === props.back
  emit('answer', isCorrect)
}
</script>

<style scoped>
.multiple-choice-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.card-container {
  width: 100%;
}

.flashcard {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tts-button {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tts-button:hover {
  background: #667eea;
  transform: scale(1.1);
}

.tts-button.speaking {
  background: #667eea;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.card-content {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
}

.option-button {
  padding: 1.5rem;
  font-size: 1.125rem;
  background: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.option-button:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #667eea;
  transform: scale(1.02);
}

.option-button.selected {
  background: #e0e7ff;
  border-color: #667eea;
}

.option-button.correct {
  background: #dcfce7;
  border-color: #4ade80;
  color: #166534;
  font-weight: 600;
}

.option-button.incorrect {
  background: #fee2e2;
  border-color: #f87171;
  color: #991b1b;
  font-weight: 600;
}

.option-button:disabled {
  cursor: not-allowed;
}

.hint-section {
  text-align: center;
  color: white;
  font-size: 1.125rem;
  opacity: 0.9;
}

.answer-buttons {
  display: flex;
  justify-content: center;
}

.btn-next {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: #4ade80;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-next:hover {
  background: #22c55e;
  transform: translateY(-2px);
}

.card-image {
  max-width: 100%;
  max-height: 150px;
  margin-top: 1rem;
  border-radius: 8px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>

