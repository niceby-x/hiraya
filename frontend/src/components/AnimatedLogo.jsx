import { useEffect, useRef } from 'react'
import './animated-logo.css'

// Same geometry as Logo.jsx, split into two layers so they can move at different speeds.
const LINES = [
  'M102.0 31.9C110.8 48.1 121.8 63.2 130.5 79.4',
  'M67.5 47.1L107.0 70.8',
  'M55.8 50.0C46.4 65.9 37.2 82.0 28.2 98.1',
  'M59.0 120.7L59.2 75.2',
  'M127.0 91.4L87.5 115.5',
  'M67.5 129.0C84.9 128.7 105.3 128.8 122.8 129.0',
]
const NODES = [[98.2, 24.3], [60.2, 42.7], [134.3, 87.0], [24.0, 105.5], [59.0, 129.2], [131.3, 129.2]]
const TRIANGLE = 'M69.8 68.8 77.3 106.4 107.1 81.6Z'

// The HIRAYA mark with no container: light travels along the prerequisite paths, the
// centre triangle beats slowly, the outer nodes lean toward the cursor, and the two
// layers shift at different speeds (parallax).
export default function AnimatedLogo({ size = 110, onActivate }) {
  const svg = useRef(null)
  const outer = useRef(null)
  const center = useRef(null)
  const core = useRef(null)
  const nodes = useRef([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const mouse = { x: 0, y: 0, px: -9999, py: -9999 } // x, y in -1..1
    const cur = { x: 0, y: 0 }
    const pulls = NODES.map(() => ({ x: 0, y: 0 }))
    let raf = 0

    const move = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
      mouse.px = e.clientX
      mouse.py = e.clientY
    }

    const frame = () => {
      // React clears the refs before this effect's cleanup runs, so one last frame can
      // fire while the logo is leaving the page (for example right after sign-in).
      if (!svg.current || !outer.current || !center.current) return
      cur.x += (mouse.x - cur.x) * 0.08
      cur.y += (mouse.y - cur.y) * 0.08
      outer.current.setAttribute('transform', `translate(${cur.x * 4.5} ${cur.y * 4.5})`)
      center.current.setAttribute('transform', `translate(${cur.x * 1.5} ${cur.y * 1.5})`)

      const rect = svg.current.getBoundingClientRect()
      const k = rect.width / 138
      NODES.forEach(([nx, ny], i) => {
        const dx = mouse.px - (rect.left + (nx - 10) * k)
        const dy = mouse.py - (rect.top + (ny - 8) * k)
        const dist = Math.hypot(dx, dy) || 1
        const strength = Math.max(0, 1 - dist / 450) * 2.4
        const p = pulls[i]
        p.x += ((dx / dist) * strength - p.x) * 0.1
        p.y += ((dy / dist) * strength - p.y) * 0.1
        const node = nodes.current[i]
        if (!node) return
        node.setAttribute('transform', `translate(${p.x} ${p.y})`)
        node.classList.toggle('is-near', dist < 220)
      })
      raf = requestAnimationFrame(frame)
    }

    window.addEventListener('pointermove', move)
    raf = requestAnimationFrame(frame)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Clicking the triangle tells the page to send a ripple through the background nodes.
  const activate = () => {
    const r = svg.current.getBoundingClientRect()
    onActivate?.({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    const el = core.current
    el.classList.remove('is-hit')
    void el.getBoundingClientRect() // restart the flash if clicked again quickly
    el.classList.add('is-hit')
  }

  return (
    <svg ref={svg} width={size} height={size} viewBox="10 8 138 138" role="group" aria-label="HIRAYA logo" className="alogo" fill="none">
      <g ref={outer}>
        <g stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" opacity=".5">
          {LINES.map((d) => <path key={d} d={d} />)}
        </g>
        <g stroke="#e6fffa" strokeWidth="4.2" strokeLinecap="round">
          {LINES.map((d, i) => (
            <path key={d} d={d} pathLength="100" className="alogo-flow" style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
        <g stroke="currentColor" strokeWidth="4.2">
          {NODES.map(([cx, cy], i) => (
            <circle key={cx} ref={(el) => { nodes.current[i] = el }} cx={cx} cy={cy} r="8.5" className="alogo-node" />
          ))}
        </g>
      </g>
      <g ref={center} className="alogo-hit" role="button" tabIndex={0} aria-label="Light up the network"
        onClick={activate} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } }}>
        <circle className="alogo-hitarea" cx="85" cy="86" r="28" fill="transparent" />
        <path ref={core} onAnimationEnd={(e) => { if (e.animationName === 'alogo-hit') e.currentTarget.classList.remove('is-hit') }} d={TRIANGLE} className="alogo-core" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </g>
    </svg>
  )
}