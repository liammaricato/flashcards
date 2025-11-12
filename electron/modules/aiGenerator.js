import * as settingsManager from './settingsManager.js'
import OpenAI from 'openai'

function buildPrompt(instructions, numCards) {
  const n = Math.min(50, Number(numCards))
  const system = `
    You are a helpful assistant that creates flashcard decks as strict JSON.
    These flashcards are meant to be used in a flashcard app, for studying purposes.

    You will be given user instructions, and you will need to create a flashcard deck based on the instructions.
    You will need to return a JSON object with the following properties:
    - deckName: string
    - description: string
    - cards: array of objects with the following properties:
      - front: string
      - back: string
    Return ONLY valid JSON, no code fences, no markdown.

    Cards content should be concise and factual.
    Never return two cards with the same front or back content.
    Many times the user can ask for different languages to be used in the cards, even in the same card, you should always respect the user's language instructions.
    GENERATE EXACTLY ${n} CARDS.

    Example input instructions and output deck (of only 3 cards):
    Input: I'd like to study food names in Korean, each card should have the front as a food name in Korean and the back as the English translation.
    Output:
    {
      "deckName": "Food Names in Korean",
      "description": "A deck of food names in Korean",
      "cards": [
        { "front": "밥", "back": "Rice" },
        { "front": "국수", "back": "Noodles" },
        { "front": "과일", "back": "Fruit" }
      ]
    }
  `

  const safeInstructions = (instructions || '').trim()
  const user = `${safeInstructions}\n\nGenerate exactly ${n} cards.`

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]

  return messages
}

export async function generateDeckData(instructions, numCards) {
  const apiKey = await settingsManager.getSetting('DEEPSEEK_API_KEY')
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Missing DEEPSEEK_API_KEY in settings')
  }

  const openai = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
  const openaiResponse = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: buildPrompt(instructions, numCards),
    response_format: { type: 'json_object' },
    temperature: 0.7
  })

  const content = openaiResponse.choices[0].message.content

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error('Failed to parse AI response')
  }
}


