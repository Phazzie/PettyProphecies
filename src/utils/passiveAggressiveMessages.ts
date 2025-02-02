/**
 * Returns a passive-aggressive message based on the given context
 * @param {string} context - The context for which to generate a message
 * @returns {string} A passive-aggressive message
 */
export const getPassiveAggressiveMessage = (context: string): string => {
  const messages: { [key: string]: string[] } = {
    login: [
      "Oh, you remembered your password? Impressive.",
      "Welcome back. Try not to mess things up this time.",
      "Logging in again? Don't you have anything better to do?",
    ],
    register: [
      "Another lost soul joins us. How... delightful.",
      "Congratulations on making yet another account you'll probably forget about.",
      "Welcome aboard. Don't expect too much, though.",
    ],
    reading: [
      "Your cards are ready. Brace yourself for the 'truth'... or whatever this is.",
      "The universe has spoken. Don't blame us if you don't like what it says.",
      "Your reading is complete. Don't say we didn't warn you.",
    ],
    error: [
      "Oops, something went wrong. Probably your fault, though.",
      "Error occurred. Have you tried not breaking things?",
      "Well, that didn't work. Color me surprised.",
    ],
    loading: [
      "Loading... Don't hold your breath.",
      "Just a moment. We're preparing your disappointment.",
      "Fetching your data. Try to contain your excitement.",
    ],
  }

  // Get the messages for the given context, or use error messages as fallback
  const contextMessages = messages[context] || messages.error

  // Return a random message from the selected context
  return contextMessages[Math.floor(Math.random() * contextMessages.length)]
}

