'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types/project'

// ─── Layout constants ───────────────────────────────────────────────────────

const CARD_W = 210
const CARD_H = 210
const ROT_MAX = 8          // ± degrees
const SECTION_H = 1080     // px — tall enough for 3 staggered rows
const GAP = 16             // min px gap between card bounding boxes

// Zones as [xMinPct, xMaxPct, yMinPct, yMaxPct] of container dimensions.
// x is the card's left edge; y is the card's top edge.
// xMax capped so card doesn't overflow right edge (card is CARD_W wide).
const ZONES: [number, number, number, number][] = [
  [0.02, 0.37, 0.02, 0.28],   // 1 — top left
  [0.47, 0.78, 0.02, 0.28],   // 2 — top right
  [0.00, 0.16, 0.35, 0.60],   // 3 — mid far-left
  [0.22, 0.46, 0.32, 0.58],   // 4 — mid center-left
  [0.50, 0.68, 0.32, 0.58],   // 5 — mid center-right
  [0.72, 0.78, 0.35, 0.60],   // 6 — mid far-right
  [0.00, 0.20, 0.65, 0.85],   // 7 — bot far-left
  [0.26, 0.54, 0.63, 0.85],   // 8 — bot center
  [0.58, 0.78, 0.65, 0.85],   // 9 — bot right
]

// ─── Placement algorithm ────────────────────────────────────────────────────

interface Placement { x: number; y: number; rotation: number }

/** Axis-aligned bounding box of a rotated card, plus a gap margin. */
function aabb(x: number, y: number, rot: number) {
  const r  = (rot * Math.PI) / 180
  const hw = (Math.abs(CARD_W * Math.cos(r)) + Math.abs(CARD_H * Math.sin(r))) / 2 + GAP
  const hh = (Math.abs(CARD_W * Math.sin(r)) + Math.abs(CARD_H * Math.cos(r))) / 2 + GAP
  return { cx: x + CARD_W / 2, cy: y + CARD_H / 2, hw, hh }
}

function overlaps(
  a: ReturnType<typeof aabb>,
  b: ReturnType<typeof aabb>
) {
  return Math.abs(a.cx - b.cx) < a.hw + b.hw &&
         Math.abs(a.cy - b.cy) < a.hh + b.hh
}

function rand(lo: number, hi: number) {
  return Math.random() * (hi - lo) + lo
}

function computePlacements(cw: number, count: number): Placement[] {
  const placed: ReturnType<typeof aabb>[] = []
  const out: Placement[] = []

  for (let i = 0; i < count; i++) {
    const [xLo, xHi, yLo, yHi] = ZONES[i] ?? ZONES[ZONES.length - 1]
    let best: Placement | null = null
    let bestBox: ReturnType<typeof aabb> | null = null

    for (let attempt = 0; attempt < 25; attempt++) {
      const rotation = rand(-ROT_MAX, ROT_MAX)
      const x = rand(xLo, xHi) * cw
      const y = rand(yLo, yHi) * SECTION_H
      const box = aabb(x, y, rotation)
      const hit = placed.some(p => overlaps(box, p))

      if (!hit) { best = { x, y, rotation }; bestBox = box; break }
      if (best === null) { best = { x, y, rotation }; bestBox = box }
    }

    out.push(best!)
    if (bestBox) placed.push(bestBox)
  }

  return out
}

// ─── Single card ────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  placement,
}: {
  project: Project
  placement: Placement
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hasImage = Boolean(project.cover_image_url)

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: placement.x,
        top: placement.y,
        width: CARD_W,
        height: CARD_H,
        transform: `rotate(${placement.rotation}deg)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s ease',
        willChange: 'opacity',
      }}
    >
      <Link
        href={`/work/${project.slug}`}
        className="group block w-full h-full"
        style={{ textDecoration: 'none' }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 18,
            overflow: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.25)',
            background: hasImage ? 'transparent' : 'transparent',
            cursor: 'pointer',
          }}
        >
          {/* Cover image */}
          {hasImage && (
            <img
              src={project.cover_image_url!}
              alt={project.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          {/* Name — centered for outline cards, bottom-left for image cards */}
          <div
            style={{
              position: 'absolute',
              ...(hasImage
                ? { bottom: 12, left: 14 }
                : { inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 300,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                letterSpacing: '0.01em',
              }}
            >
              {project.name}
            </span>
          </div>

          {/* Hover scrim */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.38)',
              borderRadius: 'inherit',
            }}
          />
        </div>
      </Link>
    </div>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

export default function ProjectsSection({ projects }: { projects: Project[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [placements, setPlacements] = useState<Placement[] | null>(null)

  useEffect(() => {
    const cw = containerRef.current?.clientWidth ?? 960
    setPlacements(computePlacements(cw, projects.length))
  }, [projects.length])

  return (
    <section
      style={{
        background: '#6b1212',
        position: 'relative',
        height: SECTION_H + 120, // extra bottom breathing room
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        className="max-w-5xl mx-auto px-8"
        style={{ position: 'relative', height: '100%' }}
      >
        {placements &&
          projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} placement={placements[i]} />
          ))}
      </div>
    </section>
  )
}
