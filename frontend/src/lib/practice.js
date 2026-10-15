// Helpers for the student practice screen. Pure functions, so they can be tested without React.

// Fisher-Yates shuffle on a copy. Pass `rng` (a function returning [0, 1)) to make it repeatable in tests.
export function shuffle(list, rng = Math.random) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Shuffles the order of the questions and the order of each question's options.
// `answer` is re-pointed at the same option text, so the correct answer never changes.
// Do not use this for a bank that has "all of the above" style options.
export function shuffleItems(items, rng = Math.random) {
  return shuffle(items, rng).map((item) => {
    const order = shuffle(item.options.map((_, i) => i), rng)
    return {
      ...item,
      options: order.map((i) => item.options[i]),
      answer: order.indexOf(item.answer),
    }
  })
}

// One row of the "questions you missed" list, kept as plain text so it can be shown after the round.
export function missedEntry(item, pickedIndex) {
  return {
    id: item.id ?? item.prompt,
    prompt: item.prompt,
    picked: item.options[pickedIndex],
    correct: item.options[item.answer],
    explanation: item.explanation,
  }
}

// Kept here so existing imports keep working; the helper now lives in radio.js.
export { nextRadioIndex } from './radio.js'
