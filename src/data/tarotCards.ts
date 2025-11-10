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
  {
    name: "The Hierophant",
    number: 5,
    description: "Spiritual wisdom, religious beliefs, conformity, tradition",
    upright: ["Spiritual wisdom", "Religious beliefs", "Conformity", "Tradition"],
    reversed: ["Personal beliefs", "Freedom", "Challenging the status quo"],
    passiveAggressive:
      "Oh great, another rule follower. I'm sure thinking for yourself is overrated anyway. Tradition is always right, isn't it?",
  },
  {
    name: "The Lovers",
    number: 6,
    description: "Love, harmony, relationships, values alignment, choices",
    upright: ["Love", "Harmony", "Relationships", "Values alignment"],
    reversed: ["Self-love", "Disharmony", "Imbalance", "Misalignment of values"],
    passiveAggressive:
      "Ah, decisions about relationships. Because you've handled those so well in the past. I'm sure this time will be different though!",
  },
  {
    name: "The Chariot",
    number: 7,
    description: "Control, willpower, success, action, determination",
    upright: ["Control", "Willpower", "Success", "Determination"],
    reversed: ["Self-discipline", "Opposition", "Lack of direction"],
    passiveAggressive:
      "Charging forward with determination! Let's hope you're going in the right direction. But who needs a map when you have confidence?",
  },
  {
    name: "Strength",
    number: 8,
    description: "Strength, courage, persuasion, influence, compassion",
    upright: ["Strength", "Courage", "Persuasion", "Compassion"],
    reversed: ["Inner strength", "Self-doubt", "Low energy", "Raw emotion"],
    passiveAggressive:
      "Inner strength and courage, how inspiring. Shame you need a card to remind you that you have it. But hey, better late than never!",
  },
  {
    name: "The Hermit",
    number: 9,
    description: "Soul-searching, introspection, being alone, inner guidance",
    upright: ["Soul-searching", "Introspection", "Being alone", "Inner guidance"],
    reversed: ["Isolation", "Loneliness", "Withdrawal"],
    passiveAggressive:
      "Time for some soul-searching? That's lovely. Maybe you'll actually listen to yourself this time instead of everyone else.",
  },
  {
    name: "Wheel of Fortune",
    number: 10,
    description: "Good luck, karma, life cycles, destiny, turning point",
    upright: ["Good luck", "Karma", "Life cycles", "Destiny"],
    reversed: ["Bad luck", "Resistance to change", "Breaking cycles"],
    passiveAggressive:
      "The wheel's turning! Is it your turn for luck, or just another spin into chaos? But you're due for something good, right?",
  },
  {
    name: "Justice",
    number: 11,
    description: "Justice, fairness, truth, cause and effect, law",
    upright: ["Justice", "Fairness", "Truth", "Cause and effect"],
    reversed: ["Unfairness", "Lack of accountability", "Dishonesty"],
    passiveAggressive:
      "Justice and truth shall prevail! Assuming you're ready to face the consequences of your choices. You are ready, aren't you?",
  },
  {
    name: "The Hanged Man",
    number: 12,
    description: "Pause, surrender, letting go, new perspectives",
    upright: ["Pause", "Surrender", "Letting go", "New perspectives"],
    reversed: ["Delays", "Resistance", "Stalling", "Indecision"],
    passiveAggressive:
      "Suspended in limbo? Maybe it's time to let go. Or you could keep clinging to what isn't working. That's been fun, right?",
  },
  {
    name: "Death",
    number: 13,
    description: "Endings, change, transformation, transition",
    upright: ["Endings", "Change", "Transformation", "Transition"],
    reversed: ["Resistance to change", "Personal transformation", "Inner purging"],
    passiveAggressive:
      "Oh no, transformation and endings! Don't worry, change is totally your thing. You've never resisted it before, have you?",
  },
  {
    name: "Temperance",
    number: 14,
    description: "Balance, moderation, patience, purpose",
    upright: ["Balance", "Moderation", "Patience", "Purpose"],
    reversed: ["Imbalance", "Excess", "Self-healing", "Re-alignment"],
    passiveAggressive:
      "Balance and moderation? How revolutionary. Maybe try not swinging between extremes for once. Just a thought.",
  },
  {
    name: "The Devil",
    number: 15,
    description: "Shadow self, attachment, addiction, restriction, sexuality",
    upright: ["Shadow self", "Attachment", "Addiction", "Restriction"],
    reversed: ["Releasing limiting beliefs", "Exploring dark thoughts", "Detachment"],
    passiveAggressive:
      "Feeling trapped by your vices? But they're so comfortable, aren't they? I'm sure you'll quit tomorrow. You always do.",
  },
  {
    name: "The Tower",
    number: 16,
    description: "Sudden change, upheaval, chaos, revelation, awakening",
    upright: ["Sudden change", "Upheaval", "Chaos", "Revelation"],
    reversed: ["Personal transformation", "Fear of change", "Averting disaster"],
    passiveAggressive:
      "Everything's falling apart? Shocking. But hey, you were getting bored with stability anyway, weren't you?",
  },
  {
    name: "The Star",
    number: 17,
    description: "Hope, faith, purpose, renewal, spirituality",
    upright: ["Hope", "Faith", "Purpose", "Renewal"],
    reversed: ["Lack of faith", "Despair", "Self-trust", "Disconnection"],
    passiveAggressive:
      "Hope and renewal shine upon you! Finally feeling optimistic? Let's see how long this positivity lasts this time.",
  },
  {
    name: "The Moon",
    number: 18,
    description: "Illusion, fear, anxiety, subconscious, intuition",
    upright: ["Illusion", "Fear", "Anxiety", "Subconscious"],
    reversed: ["Release of fear", "Repressed emotion", "Inner confusion"],
    passiveAggressive:
      "Lost in illusions and fears? That's new. Oh wait, no it isn't. But this time you'll face them, right?",
  },
  {
    name: "The Sun",
    number: 19,
    description: "Positivity, fun, warmth, success, vitality",
    upright: ["Positivity", "Fun", "Warmth", "Success"],
    reversed: ["Inner child", "Feeling down", "Overly optimistic"],
    passiveAggressive:
      "Look at you, all warm and radiant! Enjoy this high while it lasts. The Moon card is just around the corner, after all.",
  },
  {
    name: "Judgement",
    number: 20,
    description: "Judgement, rebirth, inner calling, absolution",
    upright: ["Judgement", "Rebirth", "Inner calling", "Absolution"],
    reversed: ["Self-doubt", "Inner critic", "Ignoring the call"],
    passiveAggressive:
      "Time for reflection and rebirth! Ready to be honest with yourself? That'll be a refreshing change, won't it?",
  },
  {
    name: "The World",
    number: 21,
    description: "Completion, accomplishment, travel, fulfillment",
    upright: ["Completion", "Accomplishment", "Travel", "Fulfillment"],
    reversed: ["Seeking personal closure", "Short-cut", "Delays"],
    passiveAggressive:
      "Congratulations, you've completed the cycle! Now what? Oh right, it all starts over again. Fun, isn't it?",
  },
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

/**
 * Draw multiple unique cards with reversal state and position labels
 * Ensures no duplicate cards in a single reading
 */
export function drawCardsWithReversal(count: number, positions: string[]) {
  if (count > tarotCards.length) {
    throw new Error(`Cannot draw ${count} unique cards from a deck of ${tarotCards.length}`)
  }

  if (count !== positions.length) {
    throw new Error(`Number of cards (${count}) must match number of positions (${positions.length})`)
  }

  // Create a shuffled copy of all cards to ensure uniqueness
  const availableCards = [...tarotCards]
  const drawnCards = []

  for (let i = 0; i < count; i++) {
    // Pick a random card from remaining available cards
    const randomIndex = Math.floor(Math.random() * availableCards.length)
    const card = availableCards.splice(randomIndex, 1)[0]

    // Determine reversal state (50% probability)
    const isReversed = Math.random() < 0.5

    drawnCards.push({
      ...card,
      isReversed,
      position: positions[i],
    })
  }

  return drawnCards
}

