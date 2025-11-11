import mongoose from 'mongoose'
import { User } from '../src/models/User'
import { Reading } from '../src/models/Reading'
import { PasswordReset } from '../src/models/PasswordReset'

async function verifyIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)

    console.log('\n=== Verifying Database Indexes ===\n')

    // Check User indexes
    console.log('📘 User Model Indexes:')
    const userIndexes = await User.collection.getIndexes()
    Object.keys(userIndexes).forEach(name => {
      console.log(`  ✓ ${name}:`, JSON.stringify(userIndexes[name]))
    })

    // Check Reading indexes
    console.log('\n📗 Reading Model Indexes:')
    const readingIndexes = await Reading.collection.getIndexes()
    Object.keys(readingIndexes).forEach(name => {
      console.log(`  ✓ ${name}:`, JSON.stringify(readingIndexes[name]))
    })

    // Check PasswordReset indexes
    console.log('\n📙 PasswordReset Model Indexes:')
    const resetIndexes = await PasswordReset.collection.getIndexes()
    Object.keys(resetIndexes).forEach(name => {
      console.log(`  ✓ ${name}:`, JSON.stringify(resetIndexes[name]))
    })

    console.log('\n✅ Index verification complete\n')

  } catch (error) {
    console.error('❌ Error verifying indexes:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

verifyIndexes()
