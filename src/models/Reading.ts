import mongoose from "mongoose"

export interface IReadingCard {
  name: string
  number: number
  isReversed: boolean
  position: string
}

export interface IReading extends mongoose.Document {
  userId: string
  spreadName: string
  cards: IReadingCard[] | string[] // Support both new and legacy formats
  interpretation: string
  userQuestion?: string | null
  aiGenerated?: boolean
  rating?: number
  createdAt: Date
}

const readingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  spreadName: { type: String, required: true },
  cards: {
    type: mongoose.Schema.Types.Mixed, // Support both card objects and string arrays
    required: true,
  },
  interpretation: { type: String, required: true },
  userQuestion: { type: String, required: false, default: null },
  aiGenerated: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
})

export const Reading = mongoose.models.Reading || mongoose.model<IReading>("Reading", readingSchema)

