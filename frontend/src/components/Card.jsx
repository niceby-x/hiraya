export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return <Tag className={`tc-card rounded-2xl p-5 sm:p-7 ${className}`} {...props} />
}