import { createPortal } from 'react-dom'

// Draws a dialog or drawer at the end of the page's theme root (.tc-root / .st-root) instead of
// inside <main>. <main> is `relative z-10`, which traps anything inside it beneath the sticky
// header (z-30), so a z-50 overlay rendered in place still had the header drawn over its top.
// The theme root is used rather than <body> so the light/dark colour variables still apply.
export default function Overlay({ children }) {
  const host = document.querySelector('.tc-root, .st-root') ?? document.body
  return createPortal(children, host)
}
