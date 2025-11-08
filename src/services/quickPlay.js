import { SinoKoreanNumbersDeckBuilder } from './deckBuilders/sinoKoreanNumbers'

const SUBJECT_STRATEGIES = {
  default: SinoKoreanNumbersDeckBuilder,
  'numbers-to-sino-korean': SinoKoreanNumbersDeckBuilder,
  'sino-korean-to-numbers': SinoKoreanNumbersDeckBuilder,
}

export function createQuickPlaySession(options) {
  const normalized = normalizeOptions(options)
  const strategy = SUBJECT_STRATEGIES[normalized.subject] || SUBJECT_STRATEGIES.default
  const deckBuilder = new strategy(normalized)
  return deckBuilder.buildSession()
}

function normalizeOptions(options) {
  const numCards = Math.max(1, Number(options?.numCards) || 1)
  const subject = options?.subject || 'numbers-to-sino-korean'
  const cardType = options?.cardType || 'default'
  return { numCards, subject, cardType }
}
