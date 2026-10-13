const styles = {
  mastered: 'bg-mastered-soft text-mastered-ink',
  gap: 'bg-gap-soft text-gap-ink',
  low: 'bg-low-soft text-low-ink',
  focus: 'bg-brand-soft text-brand',
  next: 'bg-brand text-white',
  meets: 'bg-mastered-soft text-mastered-ink',
  below: 'bg-gap-soft text-gap-ink',
  none: 'bg-line text-ink',
}

const defaultLabels = {
  mastered: 'Mastered',
  gap: 'Needs review',
  low: 'Needs review',
  meets: '✓ Meets threshold',
  below: '▼ Below threshold',
  none: 'No data',
}

export default function StatusPill({ band, label }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${styles[band]}`}>
      {label ?? defaultLabels[band]}
    </span>
  )
}