import { useEffect, useRef } from 'react'

const GLYPHS = ['½', 'x²', '−3', '%', 'π', '√', 'Σ', '∠', '0.5', 'y=mx', '÷', '3:4']

// On light pages the network is drawn darker so it shows on a pale background. That used to be a
// CSS `filter: brightness(.3) saturate(1.6)` on the canvas, which the browser re-applied to the
// whole screen every frame. The same adjustment is applied once, here, to the drawing colors.
function dimmed([r, g, b]) {
  const k = 0.3 // brightness
  const sat = 1.6 // saturate
  const [R, G, B] = [r * k, g * k, b * k]
  const out = [
    (0.213 + 0.787 * sat) * R + (0.715 - 0.715 * sat) * G + (0.072 - 0.072 * sat) * B,
    (0.213 - 0.213 * sat) * R + (0.715 + 0.285 * sat) * G + (0.072 - 0.072 * sat) * B,
    (0.213 - 0.213 * sat) * R + (0.715 - 0.715 * sat) * G + (0.072 + 0.928 * sat) * B,
  ]
  return out.map((v) => Math.round(Math.min(255, Math.max(0, v))))
}

const BASE = { line: [158, 240, 201], halo: [94, 227, 210], bloom: [127, 240, 220], core: [190, 255, 235] }
const PALETTES = {
  normal: BASE,
  dim: Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, dimmed(v)])),
}
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`

// Faint network of math nodes. The pointer lights nearby nodes; each `pulse`
// lights a chain of prerequisites, like a mastery estimate updating.
export default function KnowledgeBackdrop({ pulse, burst, paused = false, dim = false }) {
  const canvas = useRef(null)
  const pausedRef = useRef(false)
  const dimRef = useRef(dim)
  const kick = useRef(() => {})
  const ripple = useRef(() => {})

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, nodes = [], raf = 0
    const ptr = { x: -999, y: -999 }
    const timers = []

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.max(14, Math.min(36, Math.floor((w * h) / 30000)))
      nodes = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: still ? 0 : (Math.random() - 0.5) * 0.18, vy: still ? 0 : (Math.random() - 0.5) * 0.18,
        g: 0, label: GLYPHS[i % GLYPHS.length], near: [],
      }))
      nodes.forEach((a, i) => {
        a.near = nodes.map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
          .filter((o) => o.j !== i).sort((p, q) => p.d - q.d).slice(0, 2).map((o) => o.j)
      })
    }

    // The network fades out toward the middle, where the heading and cards sit.
    const vis = (x, y) => {
      const d = Math.hypot((x - w / 2) / (w * 0.32), (y - h * 0.52) / (h * 0.42))
      return 0.3 + 0.7 * Math.min(1, Math.max(0, (d - 0.6) / 0.6))
    }

    function frame() {
      // While paused (a busy moment on a phone) the last picture stays up and nothing is redrawn.
      if (pausedRef.current) { raf = requestAnimationFrame(frame); return }
      const P = dimRef.current ? PALETTES.dim : PALETTES.normal
      ctx.clearRect(0, 0, w, h)
      for (const a of nodes) {
        a.x += a.vx; a.y += a.vy
        if (a.x < 0 || a.x > w) a.vx *= -1
        if (a.y < 0 || a.y > h) a.vy *= -1
        const dist = Math.hypot(a.x - ptr.x, a.y - ptr.y)
        if (dist < 90) a.g = Math.max(a.g, 1 - dist / 90)
        a.g *= 0.96
      }
      for (const a of nodes) for (const j of a.near) {
        const b = nodes[j]
        const fade = Math.min(vis(a.x, a.y), vis(b.x, b.y))
        ctx.strokeStyle = rgba(P.line, (0.07 + 0.7 * Math.min(a.g, b.g)) * fade)
        ctx.lineWidth = 1 + 1.5 * Math.min(a.g, b.g)
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      }
      for (const a of nodes) {
        const v = vis(a.x, a.y)
        ctx.fillStyle = rgba(P.halo, 0.07 * v)
        ctx.beginPath(); ctx.arc(a.x, a.y, 14, 0, 7); ctx.fill()
        if (a.g > 0.02) {
          // soft bloom that fades to nothing, not a solid disc
          const R = 18 + 22 * a.g
          const bloom = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, R)
          bloom.addColorStop(0, rgba(P.bloom, 0.75 * a.g * v))
          bloom.addColorStop(1, rgba(P.bloom, 0))
          ctx.fillStyle = bloom
          ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, 7); ctx.fill()
        }
        ctx.fillStyle = rgba(P.core, (0.3 + 0.7 * a.g) * v)
        ctx.beginPath(); ctx.arc(a.x, a.y, 3 + 2.5 * a.g, 0, 7); ctx.fill()
        if (v > 0.85) {
          // symbols only in the margins, never behind the text
          ctx.font = '600 12px system-ui, sans-serif'
          ctx.fillStyle = rgba(P.core, 0.2 + 0.5 * a.g)
          ctx.fillText(a.label, a.x + 10, a.y - 10)
        }
      }
      raf = requestAnimationFrame(frame)
    }

    // A ripple: every node lights up, nearest to (bx, by) first.
    ripple.current = (bx, by) => {
      for (const a of nodes) {
        const d = Math.hypot(a.x - bx, a.y - by)
        timers.push(setTimeout(() => { a.g = 1 }, Math.min(d * 0.8, 1400)))
      }
    }

    kick.current = () => {
      const start = Math.floor(Math.random() * nodes.length)
      let ring = [start]
      const seen = new Set(ring)
      for (let depth = 0; depth < 4 && ring.length; depth++) {
        const cur = ring
        timers.push(setTimeout(() => cur.forEach((i) => { nodes[i].g = 1 }), depth * 160))
        ring = cur.flatMap((i) => nodes[i].near).filter((j) => !seen.has(j))
        ring.forEach((j) => seen.add(j))
      }
    }

    const move = (e) => { ptr.x = e.clientX; ptr.y = e.clientY }
    build(); frame()
    window.addEventListener('pointermove', move)
    window.addEventListener('resize', build)
    return () => {
      cancelAnimationFrame(raf); timers.forEach(clearTimeout)
      window.removeEventListener('pointermove', move); window.removeEventListener('resize', build)
    }
  }, [])

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { dimRef.current = dim }, [dim])
  useEffect(() => { if (pulse) kick.current() }, [pulse])
  useEffect(() => { if (burst) ripple.current(burst.x, burst.y) }, [burst])

  return <canvas ref={canvas} aria-hidden="true" className="lg-canvas" />
}