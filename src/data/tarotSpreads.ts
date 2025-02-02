import { type TarotCard, getRandomCard } from "./tarotCards"

export interface TarotSpread {
  name: string
  description: string
  positions: string[]
  getReading: () => TarotCard[]
  interpret: (cards: TarotCard[]) => string
}

export const maybeItsYouSpread: TarotSpread = {
  name: "Maybe It's Not Them, It's You",
  description: "A spread to reflect on your role in your problems",
  positions: [
    "Your Perception",
    "The Reality",
    "Your Blind Spot",
    "What You Need to Own Up To",
    "How to Grow (If You Can)",
  ],
  getReading: () =>
    Array(5)
      .fill(null)
      .map(() => getRandomCard()),
  interpret: (cards: TarotCard[]) => {
    return (
      cards.map((card, index) => `${maybeItsYouSpread.positions[index]}: ${card.passiveAggressive}`).join("\n") +
      "\nSurprise! It might actually be you after all. How's that for a plot twist in your little drama?"
    )
  },
}

export const doingYourBestSpread: TarotSpread = {
  name: "I'm Sure You're Doing Your Best",
  description: "A spread to... encourage your efforts",
  positions: [
    "Your 'Best'",
    "What You Think Is Enough",
    "What Actually Is Enough",
    "Room for Improvement",
    "A Pat on the Back (Sort of)",
  ],
  getReading: () =>
    Array(5)
      .fill(null)
      .map(() => getRandomCard()),
  interpret: (cards: TarotCard[]) => {
    return (
      cards.map((card, index) => `${doingYourBestSpread.positions[index]}: ${card.passiveAggressive}`).join("\n") +
      "\nWell, look at you go. Gold star for effort, I guess. Your parents must be so... proud."
    )
  },
}

export const quarterLifeCrisisSpread: TarotSpread = {
  name: "Your Quarter-Life Crisis Isn't Special",
  description: "A spread to put your 'unique' struggles into perspective",
  positions: [
    "Your 'Unique' Problem",
    "Why It's Actually Common",
    "What You're Overlooking",
    "How to Get Over Yourself",
    "Your Next Existential Crisis",
  ],
  getReading: () =>
    Array(5)
      .fill(null)
      .map(() => getRandomCard()),
  interpret: (cards: TarotCard[]) => {
    return (
      cards.map((card, index) => `${quarterLifeCrisisSpread.positions[index]}: ${card.passiveAggressive}`).join("\n") +
      "\nCongratulations, you're just as lost as everyone else. Welcome to adulthood, it only gets worse from here."
    )
  },
}

export const selfCareAvoidanceSpread: TarotSpread = {
  name: "Your Self-Care Routine Is Just Avoidance",
  description: "A spread to expose your 'wellness' excuses",
  positions: [
    "Your 'Self-Care' Excuse",
    "What You're Really Avoiding",
    "The Actual Problem",
    "How It's Affecting You",
    "A Real Solution (Hint: It's Not a Bath Bomb)",
  ],
  getReading: () =>
    Array(5)
      .fill(null)
      .map(() => getRandomCard()),
  interpret: (cards: TarotCard[]) => {
    return (
      cards.map((card, index) => `${selfCareAvoidanceSpread.positions[index]}: ${card.passiveAggressive}`).join("\n") +
      "\nMaybe it's time to face your problems instead of your sheet mask, don't you think? Or is that too much 'real' self-care for you?"
    )
  },
}

export const podcastIdeaSpread: TarotSpread = {
  name: "Your Podcast Idea Isn't Revolutionary",
  description: "A spread to evaluate your 'unique' podcast concept",
  positions: [
    "Your 'Groundbreaking' Idea",
    "Why It's Been Done Before",
    "Your Actual Unique Angle (If Any)",
    "Why People Might Listen Anyway",
    "How to Stand Out (Good Luck)",
  ],
  getReading: () =>
    Array(5)
      .fill(null)
      .map(() => getRandomCard()),
  interpret: (cards: TarotCard[]) => {
    return (
      cards.map((card, index) => `${podcastIdeaSpread.positions[index]}: ${card.passiveAggressive}`).join("\n") +
      "\nWell, at least your mom might listen. That's one download guaranteed. Maybe two if your dad figures out how to use Spotify."
    )
  },
}

export const plantParentSpread: TarotSpread = {
  name: "Your Plant Parent Journey Needs Intervention",
  description: "A spread to address your struggling indoor jungle",
  positions: [
    "Your Plant Parenting Style",
    "What You're Doing Wrong",
    "The Plant's Perspective",
    "How to Actually Keep It Alive",
    "Your Next Victim (I Mean, Plant)",
  ],
  getReading: () =>
    Array(5)
      .fill(null)
      .map(() => getRandomCard()),
  interpret: (cards: TarotCard[]) => {
    return (
      cards.map((card, index) => `${plantParentSpread.positions[index]}: ${card.passiveAggressive}`).join("\n") +
      "\nMaybe stick to plastic plants next time? Just a thought. Or better yet, try a pet rock. It might survive your 'care'."
    )
  },
}

export const spreads: TarotSpread[] = [
  maybeItsYouSpread,
  doingYourBestSpread,
  quarterLifeCrisisSpread,
  selfCareAvoidanceSpread,
  podcastIdeaSpread,
  plantParentSpread,
]

export function getSpreadByName(name: string): TarotSpread | undefined {
  return spreads.find((spread) => spread.name.toLowerCase() === name.toLowerCase())
}

