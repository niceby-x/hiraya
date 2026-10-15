import { useRef } from 'react'
import { nextRadioIndex } from '../lib/radio.js'

// A small radio group drawn as joined buttons (threshold, number of items, ...).
// One tab stop for the whole group; arrow keys, Home and End move and select, like native radios.
export default function SegmentedControl({
  value,
  options,
  onChange,
  getLabel = String,
  labelledBy,
  ariaLabel,
  size = 'md',
}) {
  const refs = useRef([])
  const selected = options.indexOf(value)
  const pad = size === 'sm' ? 'px-3 py-1' : 'px-4 py-1.5'

  function handleKeyDown(e, i) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const next = nextRadioIndex(i, e.key, options.length)
    if (next === -1) return
    e.preventDefault()
    onChange(options[next])
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
      className="inline-flex rounded-xl border border-line bg-white p-1 shadow-2xs"
    >
      {options.map((option, i) => {
        const isSelected = option === value
        return (
          <button
            key={String(option)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={(selected === -1 ? i === 0 : isSelected) ? 0 : -1}
            onClick={() => onChange(option)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`rounded-lg ${pad} text-sm font-bold transition-all cursor-pointer ${
              isSelected ? 'bg-brand text-on-brand shadow-xs' : 'text-muted hover:text-ink'
            }`}
          >
            {getLabel(option)}
          </button>
        )
      })}
    </div>
  )
}
