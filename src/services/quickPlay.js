export function createQuickPlaySession(options) {
  const normalized = normalizeOptions(options)
  const strategy = subjectStrategies[normalized.subject] || subjectStrategies.default
  return strategy(normalized)
}

const subjectStrategies = {
  default: buildNumbersToSinoKoreanSession,
  'numbers-to-sino-korean': buildNumbersToSinoKoreanSession,
  'sino-korean-to-numbers': buildSinoKoreanToNumbersSession,
}

function buildNumbersToSinoKoreanSession(options) {
  return { deck: buildDeck(options), cards: buildNumbersToSinoKoreanCards(options) }
}

function buildSinoKoreanToNumbersSession(options) {
  return { deck: buildDeck(options), cards: buildSinoKoreanToNumbersCards(options) }
}

function buildDeck(options) {
  const now = new Date().toISOString()
  return {
    id: `qp-deck-${Date.now()}`,
    name: `Quick Play: ${options.subject}`,
    description: 'Quick Play session (not saved)',
    created: now,
    modified: now,
    cardCount: options.numCards,
    tags: ['quick-play', options.subject],
    path: 'memory://quick-play',
    folderName: 'quick-play'
  }
}

function buildNumbersToSinoKoreanCards(options) {
  const cards = []
  const numberRange = [10, 100, 1000, 10000, 100000, 1000000]

  for (let i = 1; i <= options.numCards; i++) {
    const randomRange = numberRange[randomFromLimit(numberRange.length)]
    console.log(randomRange)
    const number = randomFromLimit(randomRange)

    const front = `${number}`
    const back = `${number}`

    console.log(front, back)

    cards.push(buildCard(i, front, back, options))
  }

  return cards
}

function buildCard(index, front, back, options) {
  const now = new Date().toISOString()
  return {
    id: `qp-card-${index}-${now}`,
    front: front,
    back: back,
    image: null,
    metadata: {
      id: `qp-meta-${index}`,
      created: now,
      tags: ['quick-play', options.subject],
      difficulty: 'normal',
      type: options.cardType
    },
    fileName: ''
  }
}

function randomFromLimit(limit) {
  return Math.floor(Math.random() * limit)
}

function normalizeOptions(options) {
  const numCards = Math.max(1, Number(options?.numCards) || 1)
  const subject = options?.subject || 'numbers-to-sino-korean'
  const cardType = options?.cardType || 'default'
  return { numCards, subject, cardType }
}
