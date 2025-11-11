import mongoose from "mongoose"

export interface IReading extends mongoose.Document {
  userId: string
  spreadName: string
  cards: string[]
  interpretation: string
  rating?: number
  aiGenerated?: boolean
  createdAt: Date
}

const readingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  spreadName: { type: String, required: true },
  cards: { type: [String], required: true },
  interpretation: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  aiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

// Indexes for optimized queries
readingSchema.index({ userId: 1, createdAt: -1 })  // Compound index for user's reading history
readingSchema.index({ createdAt: 1 })  // Index for recent readings queries
readingSchema.index({ rating: 1 })  // Index for rating queries and analytics

export const Reading = mongoose.model<IReading>("Reading", readingSchema)

