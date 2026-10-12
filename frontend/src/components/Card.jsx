export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return <Tag className={`rounded-2xl border border-line bg-white p-5 sm:p-8 ${className}`} {...props} />
}
