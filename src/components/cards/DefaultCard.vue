<template>
  <div class="default-card">
    <div class="card-container" @click="$emit('flip')">
      <div class="flashcard" :class="{ flipped: isFlipped }">
        <div class="flashcard-front">
          <div class="card-header">
            <div class="card-label">FRONT</div>
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
          <div class="flip-hint">Click to flip</div>
        </div>
        <div class="flashcard-back">
          <div class="card-header">
            <div class="card-label">BACK</div>
            <button 
              @click.stop="$emit('speak', back)" 
              class="tts-button"
              :class="{ speaking: isSpeaking }"
              title="Listen to text"
            >
              🔊
            </button>
          </div>
          <div class="card-content" v-html="renderMarkdown(back)"></div>
        </div>
      </div>
    </div>

    <div v-if="isFlipped" class="answer-buttons">
      <button @click="$emit('answer', false)" class="btn-forgot">
        ✗ Forgot
      </button>
      <button @click="$emit('answer', true)" class="btn-remembered">
        ✓ Remembered
      </button>
    </div>
    <div v-else class="flip-instruction">
      <p>Click the card to see the answer</p>
    </div>
  </div>
</template>

<script setup>
import { marked } from 'marked'

defineProps({
  front: String,
  back: String,
  imageData: String,
  isFlipped: Boolean,
  isSpeaking: Boolean
})

defineEmits(['flip', 'answer', 'speak'])

function renderMarkdown(content) {
  return marked(content)
}
</script>

<style scoped>
.default-card {
  display: flex;
  width: 100%;
  max-width: 600px;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.card-container {
  perspective: 1000px;
  width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
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
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  display: block;
  margin-left: auto;
  margin-right: auto;
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
</style>

