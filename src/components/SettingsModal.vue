<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <h2>Settings</h2>
      <div class="section">
        <label for="deepseek">DEEPSEEK_API_KEY</label>
        <div class="secret-row">
          <input
            id="deepseek"
            :type="showSecret ? 'text' : 'password'"
            v-model="deepseekKey"
            placeholder="Enter API key"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="ghost" @click="toggleSecret" aria-label="Toggle visibility">
            {{ showSecret ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p class="hint">Leave blank to remove the stored key.</p>
      </div>
      <div class="actions">
        <button @click="close">Cancel</button>
        <button class="primary" @click="save" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['close'])

const deepseekKey = ref('')
const saving = ref(false)
const showSecret = ref(false)

onMounted(async () => {
  try {
    const v = await window.settingsAPI.get('DEEPSEEK_API_KEY')
    deepseekKey.value = typeof v === 'string' ? v : ''
  } catch {}
})

function toggleSecret() {
  showSecret.value = !showSecret.value
}

async function save() {
  try {
    saving.value = true
    const value = deepseekKey.value.trim()
    await window.settingsAPI.set('DEEPSEEK_API_KEY', value)
    emit('close', { saved: true })
  } catch {
  } finally {
    saving.value = false
  }
}

function close() {
  emit('close', { saved: false })
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  width: 520px;
  max-width: calc(100% - 2rem);
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem 1.25rem 1rem 1.25rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.modal h2 {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
}
.section {
  margin-top: 0.5rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}
.secret-row {
  display: flex;
  gap: 0.5rem;
}
input {
  flex: 1;
  padding: 0.5rem 0.6rem;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  outline: none;
}
input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}
.hint {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #667085;
}
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
button {
  appearance: none;
  border: 0;
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  background: #e4e7ec;
  color: #111827;
  cursor: pointer;
}
button.primary {
  background: #667eea;
  color: white;
}
button.ghost {
  background: transparent;
  color: #4b5563;
  border: 1px solid #d1d5db;
}
button:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>


