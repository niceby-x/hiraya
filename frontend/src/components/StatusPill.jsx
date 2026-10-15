const styles = {
  mastered: 'border-mastered/30 bg-mastered-soft text-mastered-ink',
  gap: 'border-gap/30 bg-gap-soft text-gap-ink',
  low: 'border-low/30 bg-low-soft text-low-ink',
  focus: 'border-brand/30 bg-brand-soft text-brand',
  next: 'border-transparent bg-brand text-on-brand',
  meets: 'border-mastered/30 bg-mastered-soft text-mastered-ink',
  below: 'border-gap/30 bg-gap-soft text-gap-ink',
  none: 'border-transparent bg-line text-ink',
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
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${styles[band]}`}>
      {label ?? defaultLabels[band]}
    </span>
  )
}