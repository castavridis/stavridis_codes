'use client'

import { useEffect, useRef, useState, RefObject } from 'react'
import { Dot, Connection } from './types'
import {
  SKILLS, PROXIMITY_THRESHOLD, DOT_SPEED_RANGE,
  HEADLINE_MARGIN, DOT_SEP, COHESION_DIST,
} from './data'

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function distToRect(x: number, y: number, rect: DOMRect): { dist: number; nx: number; ny: number } {
  const nx = clamp(x, rect.left, rect.right)
  const ny = clamp(y, rect.top, rect.bottom)
  return { dist: Math.hypot(x - nx, y - ny), nx, ny }
}

function initDots(w: number, h: number): Dot[] {
  return SKILLS.map((s, i) => {
    const speed = rand(DOT_SPEED_RANGE[0], DOT_SPEED_RANGE[1])
    const angle = rand(0, Math.PI * 2)
    return {
      id: i,
      x: rand(60, w - 60),
      y: rand(60, h - 60),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      skill: s.skill,
      group: s.group,
      isGroup: s.isGroup,
    }
  })
}

export function useFloatingDots(
  containerRef: RefObject<HTMLElement | null>,
  headlineRef: RefObject<HTMLElement | null>,
  circleRefs: RefObject<(SVGCircleElement | null)[]>,
  groupLabelRefs: RefObject<(HTMLDivElement | null)[]>
) {
  const dotsRef = useRef<Dot[]>([])
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)
  const headlineRectRef = useRef<DOMRect | null>(null)
  const committedEndsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const [connections, setConnections] = useState<Connection[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight
    dotsRef.current = initDots(w, h)

    // Map: group leader dot id → groupLabelRefs index
    const groupLeaderMap = new Map<number, number>()
    let gIdx = 0
    dotsRef.current.forEach(d => {
      if (d.isGroup) groupLeaderMap.set(d.id, gIdx++)
    })

    // Headline bounds: read once per second + on resize
    const readHeadlineBounds = () => {
      if (headlineRef.current) {
        const cr = container.getBoundingClientRect()
        const hr = headlineRef.current.getBoundingClientRect()
        headlineRectRef.current = new DOMRect(
          hr.left - cr.left, hr.top - cr.top, hr.width, hr.height
        )
      }
    }
    readHeadlineBounds()
    const boundsInterval = setInterval(readHeadlineBounds, 1000)
    const ro = new ResizeObserver(readHeadlineBounds)
    if (headlineRef.current) ro.observe(headlineRef.current)
    ro.observe(container)

    const WALL_PAD = 20
    const MAX_SPD = DOT_SPEED_RANGE[1]

    function tick() {
      const dots = dotsRef.current
      const cw = container!.clientWidth
      const ch = container!.clientHeight

      // ── Pass 1: Dot-to-dot separation (all pairs) ──────────────────────────
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy) || 0.01
          if (dist < DOT_SEP) {
            const overlap = (DOT_SEP - dist) / DOT_SEP
            const fx = (dx / dist) * overlap * 0.1
            const fy = (dy / dist) * overlap * 0.1
            a.vx += fx; a.vy += fy
            b.vx -= fx; b.vy -= fy
          }
        }
      }

      // ── Pass 2: Pre-compute group leader positions ─────────────────────────
      const leaderPos: Record<string, { x: number; y: number }> = {}
      for (const d of dots) {
        if (d.isGroup) leaderPos[d.group] = { x: d.x, y: d.y }
      }

      // ── Pass 3: Move, drift, bounce, cohesion, DOM updates ─────────────────
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]

        // Cohesion: skill dots pulled gently toward their group leader
        if (!d.isGroup) {
          const lp = leaderPos[d.group]
          if (lp) {
            const dx = lp.x - d.x
            const dy = lp.y - d.y
            const dist = Math.hypot(dx, dy)
            if (dist > COHESION_DIST) {
              const pull = (dist - COHESION_DIST) / dist * 0.003
              d.vx += dx * pull
              d.vy += dy * pull
            }
          }
        }

        // Random angle drift
        const drift = (Math.random() - 0.5) * 0.02
        const angle = Math.atan2(d.vy, d.vx) + drift
        const spd = Math.hypot(d.vx, d.vy)
        d.vx = Math.cos(angle) * spd
        d.vy = Math.sin(angle) * spd

        d.x += d.vx
        d.y += d.vy

        // Wall bounce
        if (d.x < WALL_PAD)       { d.x = WALL_PAD;       d.vx =  Math.abs(d.vx) }
        if (d.x > cw - WALL_PAD)  { d.x = cw - WALL_PAD;  d.vx = -Math.abs(d.vx) }
        if (d.y < WALL_PAD)       { d.y = WALL_PAD;        d.vy =  Math.abs(d.vy) }
        if (d.y > ch - WALL_PAD)  { d.y = ch - WALL_PAD;  d.vy = -Math.abs(d.vy) }

        // Headline repulsion
        const hr = headlineRectRef.current
        if (hr) {
          const { dist: hd, nx: hx, ny: hy } = distToRect(d.x, d.y, hr)
          if (hd < HEADLINE_MARGIN && hd > 0) {
            const t = 1 - hd / HEADLINE_MARGIN
            const len = Math.hypot(d.x - hx, d.y - hy) || 1
            d.vx += ((d.x - hx) / len) * t * 0.12
            d.vy += ((d.y - hy) / len) * t * 0.12
          }
        }

        // Speed clamp (after all forces)
        const curSpd = Math.hypot(d.vx, d.vy)
        if (curSpd > MAX_SPD) {
          d.vx = (d.vx / curSpd) * MAX_SPD
          d.vy = (d.vy / curSpd) * MAX_SPD
        }

        // Update SVG circle position
        const circle = circleRefs.current[i]
        if (circle) {
          circle.setAttribute('cx', String(d.x))
          circle.setAttribute('cy', String(d.y))
        }

        // Update group label DOM position (60fps, no React re-render)
        if (d.isGroup) {
          const refIdx = groupLeaderMap.get(d.id)
          if (refIdx !== undefined) {
            const el = groupLabelRefs.current[refIdx]
            if (el) {
              el.style.left = d.x + 'px'
              el.style.top  = (d.y - 26) + 'px'
            }
          }
        }
      }

      frameRef.current++

      // ── Proximity detection for skill dots only (~10fps) ───────────────────
      if (frameRef.current % 6 === 0) {
        const rect = headlineRectRef.current
        if (rect) {
          const newConns: Connection[] = []
          const inRangeIds = new Set<number>()

          for (const d of dots) {
            if (d.isGroup) continue // group labels are always visible via DOM
            const { dist, nx, ny } = distToRect(d.x, d.y, rect)
            if (dist < PROXIMITY_THRESHOLD) {
              inRangeIds.add(d.id)
              if (!committedEndsRef.current.has(d.id)) {
                committedEndsRef.current.set(d.id, { x: nx, y: ny })
              }
              const lineEnd = committedEndsRef.current.get(d.id)!
              const strength = clamp(1 - dist / PROXIMITY_THRESHOLD, 0, 1)
              newConns.push({ dotId: d.id, strength, lineEnd, dotX: d.x, dotY: d.y, skill: d.skill, group: d.group })
            }
          }

          for (const id of committedEndsRef.current.keys()) {
            if (!inRangeIds.has(id)) committedEndsRef.current.delete(id)
          }

          setConnections(newConns)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(boundsInterval)
      ro.disconnect()
    }
  }, [containerRef, headlineRef, circleRefs, groupLabelRefs])

  return { connections }
}
