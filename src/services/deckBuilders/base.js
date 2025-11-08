export class BaseDeckBuilder {
  constructor(options) {
    this.options = options
    this.now = new Date().toISOString()
  }

  buildSession() {
    return { deck: this.buildDeck(), cards: this.buildCards() }
  }

  buildDeck() {
    return {
      id: `qp-deck-${this.now}`,
      name: `Quick Play: ${this.options.subject}`,
      description: 'Quick Play session (not saved)',
      created: this.now,
      modified: this.now,
      cardCount: this.options.numCards,
      tags: ['quick-play', this.options.subject],
      path: 'memory://quick-play',
      folderName: 'quick-play'
    }
  }

  buildCards() {
    const cards = []

    for (let i = 1; i <= this.options.numCards; i++) {
      const { front, back } = this.generateRandomCard()

      cards.push(this.buildCard(i, front, back))
    }

    return cards
  }

  generateRandomCard() {
    return { front: 'Front', back: 'Back' }
  }

  buildCard(index, front, back) {
    return {
      id: `qp-card-${index}`,
      front: typeof front === 'string' ? front : front.toString(),
      back: typeof back === 'string' ? back : back.toString(),
      image: null,
      metadata: {
        id: `qp-meta-${index}`,
        created: this.now,
        tags: ['quick-play', this.options.subject],
        difficulty: 'normal',
        type: this.options.cardType
      },
      fileName: ''
    }
  }
}