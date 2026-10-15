const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-display font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const sizes = {
  md: 'px-6 py-3',
  sm: 'px-4 py-2',
}

const variants = {
  primary:
    'bg-brand text-on-brand shadow-[0_8px_24px_-4px_color-mix(in_srgb,var(--color-brand)_45%,transparent)] disabled:shadow-none not-disabled:hover:bg-brand/90 not-disabled:active:bg-brand/80',
  outline:
    'border-[1.5px] border-ink/30 bg-ink/5 text-ink not-disabled:hover:border-ink/55 not-disabled:hover:bg-ink/10',
  onBrand: 'bg-white text-brand not-disabled:hover:bg-brand-soft',
  onBrandOutline: 'border-2 border-white/60 text-white not-disabled:hover:bg-white/10',
}

export function buttonClass(variant = 'primary', size = 'md') {
  return `${base} ${sizes[size]} ${variants[variant]}`
}
