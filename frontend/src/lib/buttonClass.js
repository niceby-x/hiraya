const base =
  'inline-block rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const sizes = {
  md: 'px-6 py-3',
  sm: 'px-4 py-2',
}

const variants = {
  primary: 'bg-brand text-white not-disabled:hover:bg-brand/90 not-disabled:active:bg-brand/80',
  outline: 'border-2 border-brand text-brand not-disabled:hover:bg-brand-soft',
  onBrand: 'bg-white text-brand not-disabled:hover:bg-brand-soft',
  onBrandOutline: 'border-2 border-white/60 text-white not-disabled:hover:bg-white/10',
}

export function buttonClass(variant = 'primary', size = 'md') {
  return `${base} ${sizes[size]} ${variants[variant]}`
}
