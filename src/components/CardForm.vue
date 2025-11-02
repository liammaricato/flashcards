<template>
  <div class="card-form">
    <h3>{{ isEditing ? 'Edit Card' : 'Create New Card' }}</h3>
    
    <div class="form-group">
      <label>Card Type</label>
      <select v-model="cardType" class="select">
        <option value="default">Default (Flip Card)</option>
        <option value="input">Input Answer</option>
        <option value="multiple-choice">Multiple Choice</option>
      </select>
      <small class="hint" v-if="cardType === 'default'">Classic flashcard - flip to reveal answer</small>
      <small class="hint" v-else-if="cardType === 'input'">Type the answer to check if correct</small>
      <small class="hint" v-else>Select the correct answer from options</small>
    </div>
    
    <div class="form-group">
      <label>Front (Question)</label>
      <textarea
        v-model="frontContent"
        placeholder="Enter the question or front side (supports Markdown)"
        class="textarea"
        rows="4"
      ></textarea>
      <small class="hint">Supports Markdown: **bold**, *italic*, `code`, etc.</small>
    </div>

    <div class="form-group">
      <label>Back ({{ cardType === 'multiple-choice' ? 'Correct Answer' : 'Answer' }})</label>
      <textarea
        v-model="backContent"
        :placeholder="cardType === 'multiple-choice' ? 'Enter the correct answer' : 'Enter the answer or back side (supports Markdown)'"
        class="textarea"
        rows="6"
      ></textarea>
      <small class="hint">Supports Markdown: **bold**, *italic*, `code`, etc.</small>
    </div>

    <div v-if="cardType === 'multiple-choice'" class="form-group">
      <label>Wrong Answers (3 options)</label>
      <input
        v-for="(option, index) in wrongOptions"
        :key="index"
        v-model="wrongOptions[index]"
        type="text"
        :placeholder="`Wrong answer ${index + 1}`"
        class="input"
      />
      <small class="hint">Provide 3 incorrect options for the multiple choice</small>
    </div>

    <div class="form-group">
      <label>Image (optional)</label>
      <div class="image-upload">
        <button @click="selectImage" type="button" class="btn-secondary">
          {{ imagePath ? 'Change Image' : 'Select Image' }}
        </button>
        <span v-if="imagePath" class="image-name">{{ imageFileName }}</span>
        <button v-if="imagePath" @click="removeImage" type="button" class="btn-text">Remove</button>
      </div>
      <img v-if="imagePreview" :src="imagePreview" class="image-preview" />
    </div>

    <div class="form-actions">
      <button @click="save" class="btn-primary" :disabled="!canSave">
        {{ isEditing ? 'Update' : 'Create' }}
      </button>
      <button @click="$emit('cancel')" class="btn-secondary">Cancel</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    default: null
  },
  deckPath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['save', 'cancel'])

const frontContent = ref('')
const backContent = ref('')
const cardType = ref('default')
const wrongOptions = ref(['', '', ''])
const imagePath = ref(null)
const imagePreview = ref(null)
const existingImagePath = ref(null)
const removeExistingImage = ref(false)
const error = ref('')

const isEditing = computed(() => !!props.card)

const imageFileName = computed(() => {
  if (!imagePath.value) return ''
  return imagePath.value.split(/[\\/]/).pop()
})

const canSave = computed(() => {
  return frontContent.value.trim() && backContent.value.trim()
})

onMounted(async () => {
  if (props.card) {
    frontContent.value = props.card.front
    backContent.value = props.card.back
    cardType.value = props.card.metadata?.type || 'default'
    
    if (cardType.value === 'multiple-choice' && props.card.metadata?.options) {
      wrongOptions.value = [...props.card.metadata.options]
      while (wrongOptions.value.length < 3) {
        wrongOptions.value.push('')
      }
    }
    
    if (props.card.image) {
      existingImagePath.value = props.card.image
      try {
        const fullPath = `${props.deckPath}/${props.card.image}`.replace(/\/+/g, '/')
        imagePreview.value = await window.cardAPI.getImageData(fullPath)
      } catch (err) {
        console.error('Failed to load existing image:', err)
      }
    }
  }
})

function selectImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      imagePath.value = file.path
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

function removeImage() {
  imagePath.value = null
  imagePreview.value = null
  if (existingImagePath.value) {
    removeExistingImage.value = true
  }
  existingImagePath.value = null
}

function save() {
  if (!canSave.value) {
    error.value = 'Both front and back content are required'
    return
  }

  if (cardType.value === 'multiple-choice') {
    const filledOptions = wrongOptions.value.filter(opt => opt.trim())
    if (filledOptions.length < 3) {
      error.value = 'Please provide 3 wrong answers for multiple choice'
      return
    }
  }

  const cardData = {
    front: frontContent.value.trim(),
    back: backContent.value.trim(),
    cardType: cardType.value,
    metadata: {
      type: cardType.value
    }
  }

  if (cardType.value === 'multiple-choice') {
    const filteredOptions = wrongOptions.value.filter(opt => opt.trim())
    cardData.options = filteredOptions
    cardData.metadata.options = filteredOptions
  }

  if (imagePath.value) {
    cardData.imagePath = imagePath.value
  } else if (removeExistingImage.value) {
    cardData.imagePath = null
  }

  emit('save', cardData)
}
</script>

<style scoped>
.card-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.card-form h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.textarea:focus {
  outline: none;
  border-color: #667eea;
}

.select,
.input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.select:focus,
.input:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  display: block;
  margin-top: 0.25rem;
  color: #999;
  font-size: 0.875rem;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.image-name {
  color: #666;
  font-size: 0.875rem;
}

.image-preview {
  max-width: 100%;
  max-height: 200px;
  margin-top: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-text {
  padding: 0.5rem;
  background: none;
  color: #e74c3c;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 2rem;
}

.error {
  color: #e74c3c;
  margin: 1rem 0 0 0;
}
</style>

