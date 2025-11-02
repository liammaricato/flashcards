import { ref } from 'vue'

export function useSpeech() {
  const isSpeaking = ref(false)
  const speechSupported = ref('speechSynthesis' in window)
  
  function stripMarkdown(text) {
    return text
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_~`]/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }
  
  function detectLanguage(text) {
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
    const chineseRegex = /[\u4E00-\u9FFF]/
    const arabicRegex = /[\u0600-\u06FF]/
    const hebrewRegex = /[\u0590-\u05FF]/
    const thaiRegex = /[\u0E00-\u0E7F]/
    const russianRegex = /[\u0400-\u04FF]/
    const greekRegex = /[\u0370-\u03FF]/
    
    if (koreanRegex.test(text)) return 'ko-KR'
    if (japaneseRegex.test(text)) return 'ja-JP'
    if (chineseRegex.test(text)) return 'zh-CN'
    if (arabicRegex.test(text)) return 'ar-SA'
    if (hebrewRegex.test(text)) return 'he-IL'
    if (thaiRegex.test(text)) return 'th-TH'
    if (russianRegex.test(text)) return 'ru-RU'
    if (greekRegex.test(text)) return 'el-GR'
    
    return 'en-US'
  }
  
  function findVoiceForLanguage(lang) {
    const voices = window.speechSynthesis.getVoices()
    
    const exactMatch = voices.find(voice => voice.lang === lang)
    if (exactMatch) return exactMatch
    
    const langPrefix = lang.split('-')[0]
    const partialMatch = voices.find(voice => voice.lang.startsWith(langPrefix))
    if (partialMatch) return partialMatch
    
    return null
  }
  
  function speak(text, options = {}) {
    if (!speechSupported.value) {
      console.warn('Speech synthesis not supported')
      return
    }
    
    if (isSpeaking.value) {
      window.speechSynthesis.cancel()
    }
    
    const plainText = stripMarkdown(text)
    
    if (!plainText) {
      return
    }
    
    const detectedLang = options.lang || detectLanguage(plainText)
    const voice = findVoiceForLanguage(detectedLang)
    
    const utterance = new SpeechSynthesisUtterance(plainText)
    
    utterance.rate = options.rate || 1.0
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0
    utterance.lang = detectedLang
    
    if (voice) {
      utterance.voice = voice
      console.log(`Using voice: ${voice.name} (${voice.lang})`)
    } else {
      console.warn(`No voice found for language: ${detectedLang}`)
    }
    
    utterance.onstart = () => {
      isSpeaking.value = true
    }
    
    utterance.onend = () => {
      isSpeaking.value = false
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      isSpeaking.value = false
    }
    
    window.speechSynthesis.speak(utterance)
  }
  
  function stop() {
    if (speechSupported.value && isSpeaking.value) {
      window.speechSynthesis.cancel()
      isSpeaking.value = false
    }
  }
  
  function getVoices() {
    if (!speechSupported.value) return []
    return window.speechSynthesis.getVoices()
  }
  
  return {
    speak,
    stop,
    getVoices,
    isSpeaking,
    speechSupported
  }
}

