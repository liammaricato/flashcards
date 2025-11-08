import { toSinoKorean } from 'sino-korean-js'

import { BaseDeckBuilder } from './base'

const NUMBER_RANGES = [10, 100, 1000, 10000, 100000, 1000000]

export class SinoKoreanNumbersDeckBuilder extends BaseDeckBuilder {
  generateRandomCard() {
    const { number, sinoKorean } = this.buildNumbers()

    if (this.options.subject === 'numbers-to-sino-korean') {
      return { front: number, back: sinoKorean }
    } else if (this.options.subject === 'sino-korean-to-numbers') {
      return { front: sinoKorean, back: number }
    }

    throw new Error(`Invalid subject: ${this.options.subject}`)
  }

  buildNumbers() {
    const randomRange = NUMBER_RANGES[this.randomFromLimit(NUMBER_RANGES.length)]
    const number = this.randomFromLimit(randomRange)

    return { number, sinoKorean: toSinoKorean(number) }
  }

  randomFromLimit(limit) {
    return Math.floor(Math.random() * limit)
  }
}