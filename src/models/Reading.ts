import mongoose from "mongoose"

export interface IReading extends mongoose.Document {
  userId: string
  spreadName: string
  cards: string[]
  interpretation: string
  rating?: number
  createdAt: Date
}

const readingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  spreadName: { type: String, required: true },
  cards: { type: [String], required: true },
  interpretation: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
})

export const Reading = mongoose.model<IReading>("Reading", readingSchema)

