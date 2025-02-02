export interface TarotCard {
  name: string
  number: number
  description: string
  upright: string[]
  reversed: string[]
  passiveAggressive: string
}

export const tarotCards: TarotCard[] = [
  {
    name: "The Fool",
    number: 0,
    description: "New beginnings, innocence, spontaneity",
    upright: ["New beginnings", "Free spirit", "Leap of faith"],
    reversed: ["Recklessness", "Inconsideration", "Foolishness"],
    passiveAggressive:
      "Oh, look at you, ready to jump off that cliff of life. I'm sure it'll work out just fine for you. It always does, right?",
  },
  {
    name: "The Magician",
    number: 1,
    description: "Manifestation, resourcefulness, power",
    upright: ["Manifestation", "Resourcefulness", "Inspired action"],
    reversed: ["Manipulation", "Poor planning", "Untapped talents"],
    passiveAggressive:
      "Wow, you're so talented. It'd be a shame if you never used those skills. But hey, Netflix won't watch itself, right?",
  },
  {
    name: "The High Priestess",
    number: 2,
    description: "Intuition, sacred knowledge, divine feminine",
    upright: ["Intuition", "Sacred knowledge", "Divine feminine"],
    reversed: ["Secrets", "Disconnected from intuition", "Withdrawal"],
    passiveAggressive:
      "Your intuition is speaking to you? That's nice. I'm sure it's saying all the right things. It's not like you've ignored it before or anything.",
  },
  {
    name: "The Empress",
    number: 3,
    description: "Femininity, beauty, nature",
    upright: ["Femininity", "Beauty", "Nature", "Nurturing"],
    reversed: ["Creative block", "Dependence on others", "Emptiness"],
    passiveAggressive:
      "Ah yes, embrace your nurturing side. I'm sure everyone appreciates your 'helpful' advice. You're basically Mother Nature herself, aren't you?",
  },
  {
    name: "The Emperor",
    number: 4,
    description: "Authority, establishment, structure",
    upright: ["Authority", "Establishment", "Structure", "Father figure"],
    reversed: ["Domination", "Excessive control", "Lack of discipline"],
    passiveAggressive:
      "Look at you, all authoritative and in control. I bet that works out great in your personal relationships. Nothing says 'love me' like a little dictatorship.",
  },
  // ... Add the rest of the 22 Major Arcana cards with enhanced passive-aggressive interpretations
]

export function getRandomCard(): TarotCard {
  return tarotCards[Math.floor(Math.random() * tarotCards.length)]
}

export function getCardByName(name: string): TarotCard | undefined {
  return tarotCards.find((card) => card.name.toLowerCase() === name.toLowerCase())
}

export function getCardByNumber(number: number): TarotCard | undefined {
  return tarotCards.find((card) => card.number === number)
}

