<template>
  <div class="input-card">
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

        <div class="input-section">
          <input
            v-model="userAnswer"
            type="text"
            placeholder="Type your answer..."
            class="answer-input"
            @keyup.enter="checkAnswer"
            :disabled="answered"
          />
        </div>
      </div>
    </div>

    <div v-if="answered" class="result-section">
      <div class="correct-answer" :class="{ correct: isCorrectAnswer }">
        <strong>Correct Answer:</strong>
        <div v-html="renderMarkdown(back)"></div>
      </div>
      <div class="answer-buttons">
        <button @click="$emit('next')" class="btn-next">
          Next Card →
        </button>
      </div>
    </div>
    <div v-else class="submit-section">
      <button @click="checkAnswer" class="btn-submit" :disabled="!userAnswer.trim()">
        Check Answer
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  front: String,
  back: String,
  imageData: String,
  isSpeaking: Boolean
})

const emit = defineEmits(['answer', 'next', 'speak'])

const userAnswer = ref('')
const answered = ref(false)
const isCorrectAnswer = ref(false)

watch(() => [props.front, props.back], () => {
  userAnswer.value = ''
  answered.value = false
})

function renderMarkdown(content) {
  return marked(content)
}

function checkAnswer() {
  if (!userAnswer.value.trim()) return
  
  answered.value = true
  const userText = userAnswer.value.trim().toLowerCase()
  const correctText = props.back.trim().toLowerCase()
  
  const isCorrect = userText === correctText
  // In case we want to check for partial matches
    // || correctText.includes(userText) || userText.includes(correctText)
  
  isCorrectAnswer.value = isCorrect
  emit('answer', isCorrect)
}
</script>

<style scoped>
.input-card {
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

.input-section {
  margin-top: 2rem;
}

.answer-input {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.answer-input:focus {
  outline: none;
  border-color: #667eea;
}

.answer-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.result-section {
  width: 100%;
  text-align: center;
}

.correct-answer {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 4px solid #ef4444;
}

.correct-answer strong {
  display: block;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.correct-answer.correct {
  border-color: #22c55e;
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

.submit-section,
.answer-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-submit,
.btn-next {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
}

.btn-submit {
  background: #667eea;
}

.btn-submit:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-next {
  background: #4ade80;
}

.btn-next:hover {
  background: #22c55e;
  transform: translateY(-2px);
}
</style>

