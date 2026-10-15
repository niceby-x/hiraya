// Student-side status pill (the .st-pill styles in student.css). `band` is a mastery band
// ('mastered', 'gap', 'low') or one of the path markers ('focus', 'next').
const modifier = { mastered: 'ok', gap: 'warn', low: 'low', focus: 'focus', next: 'next' }

export default function StudentPill({ band, children }) {
  return <span className={`st-pill st-pill--${modifier[band]}`}>{children}</span>
}
