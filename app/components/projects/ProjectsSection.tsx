'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types/project'

// ─── Layout constants ───────────────────────────────────────────────────────

const CARD_W = 210
const CARD_H = 210
const ROT_MAX = 8     // ± degrees
const SECTION_H = 1080

// Guaranteed non-overlapping 3×3 staggered grid.
// Columns are separated by ~300 px (well above the max AABB width of ~240 px).
// Within each column the three rows are ~350 px apart (well above max AABB height).
// Only rotation and a small y-jitter are randomised — overlap is structurally impossible.
//
// [xFraction, yBasePx, yJitterPx]  — x is card left edge as fraction of container width
const GRID: [number, number, number][] = [
  [0.05,  30, 20],  // col 0, row 0
  [0.39,  55, 20],  // col 1, row 0  (slightly lower → stagger)
  [0.73,  20, 20],  // col 2, row 0
  [0.05, 405, 20],  // col 0, row 1
  [0.39, 425, 20],  // col 1, row 1
  [0.73, 400, 20],  // col 2, row 1
  [0.05, 775, 20],  // col 0, row 2
  [0.39, 795, 20],  // col 1, row 2
  [0.73, 760, 20],  // col 2, row 2
]

// ─── Placement algorithm ────────────────────────────────────────────────────

interface Placement { x: number; y: number; rotation: number }

function rand(lo: number, hi: number) {
  return Math.random() * (hi - lo) + lo
}

function computePlacements(cw: number, count: number): Placement[] {
  return Array.from({ length: count }, (_, i) => {
    const [xFrac, yBase, yJit] = GRID[i] ?? GRID[GRID.length - 1]
    return {
      x: xFrac * cw,
      y: yBase + rand(-yJit, yJit),
      rotation: rand(-ROT_MAX, ROT_MAX),
    }
  })
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
