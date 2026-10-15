// Next index for arrow-key movement inside a radio group; wraps at both ends.
// Returns -1 for keys that do not move the selection.
export function nextRadioIndex(current, key, count) {
  if (count <= 0) return -1
  const start = current < 0 ? 0 : current
  if (key === 'ArrowDown' || key === 'ArrowRight') return (start + 1) % count
  if (key === 'ArrowUp' || key === 'ArrowLeft') return (start - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return -1
}
