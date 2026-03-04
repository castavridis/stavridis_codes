'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useFloatingDots } from './useFloatingDots'
import { SKILLS, DOT_RADIUS, GROUP_RADIUS } from './data'
import { sono } from '../../(fonts)/sono'
import DecorativeCard from './DecorativeCard'
import { Project } from '@/types/project'

const GROUP_COLOR = {
  design:      '#e85c5c',
  engineering: '#e07a5c',
  strategy:    '#e8a05c',
}

interface ActiveSkill {
  skill: string
  group: 'design' | 'engineering' | 'strategy'
  isGroup: boolean
}

export default function HeroSection({ projects }: { projects: Project[] }) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const headlineRef    = useRef<HTMLHeadingElement>(null)
  const circleRefs     = useRef<(SVGCircleElement | null)[]>([])
  const groupLabelRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotButtonRefs  = useRef<(HTMLButtonElement | null)[]>([])

  const [activeSkill, setActiveSkill] = useState<ActiveSkill | null>(null)

  const { connections } = useFloatingDots(
    containerRef    as React.RefObject<HTMLElement | null>,
    headlineRef     as React.RefObject<HTMLElement | null>,
    circleRefs,
    groupLabelRefs,
    dotButtonRefs
  )

  const groupLeaders = SKILLS.filter(s => s.isGroup)

  const matchingProjects = activeSkill
    ? projects.filter(p =>
        p.tags?.some(t =>
          t.toLowerCase() === activeSkill.skill.toLowerCase() ||
          t.toLowerCase() === activeSkill.group.toLowerCase()
        )
      )
    : []

  function handleDotClick(s: typeof SKILLS[number], e: React.MouseEvent) {
    e.stopPropagation()
    setActiveSkill(prev =>
      prev?.skill === s.skill ? null : { skill: s.skill, group: s.group, isGroup: s.isGroup }
    )
  }

  return (
    <section
      ref={containerRef}
      style={{ background: '#6b1212' }}
      className={"relative min-h-[80vh] h-[80vh] w-full overflow-hidden " + sono.className}
      onClick={() => setActiveSkill(null)}
    >
      {/* SVG — purely visual, pointer-events-none */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {connections.map(c => (
          <line
            key={c.dotId}
            x1={c.dotX} y1={c.dotY}
            x2={c.lineEnd.x} y2={c.lineEnd.y}
            stroke={GROUP_COLOR[c.group]}
            strokeWidth={0.75}
            strokeOpacity={c.strength * 0.55}
          />
        ))}
        {SKILLS.map((s, i) => (
          <circle
            key={i}
            ref={el => { circleRefs.current[i] = el }}
            r={s.isGroup ? GROUP_RADIUS : DOT_RADIUS}
            fill={GROUP_COLOR[s.group]}
            fillOpacity={activeSkill?.skill === s.skill ? 1 : s.isGroup ? 0.85 : 0.55}
          />
        ))}
      </svg>

      {/* HTML click targets — invisible buttons positioned by rAF loop at 60fps */}
      {SKILLS.map((s, i) => (
        <button
          key={i}
          ref={el => { dotButtonRefs.current[i] = el }}
          aria-label={s.skill}
          onClick={e => handleDotClick(s, e)}
          style={{
            position: 'absolute',
            left: -9999,
            top: -9999,
            width: 28,
            height: 28,
            transform: 'translate(-50%, -50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}

      {/* Group name labels — always visible, DOM-positioned at 60fps */}
      {groupLeaders.map((s, i) => (
        <div
          key={s.skill}
          ref={el => { groupLabelRefs.current[i] = el }}
          className="absolute select-none"
          style={{
            left: -9999,
            top: -9999,
            color: GROUP_COLOR[s.group],
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            pointerEvents: 'none', // buttons handle clicks
          }}
        >
          {s.skill}
        </div>
      ))}

      {/* Skill labels — proximity-gated, React-driven at ~10fps */}
      {connections.map(c => (
        <div
          key={c.dotId}
          className="absolute select-none pointer-events-none"
          style={{
            left: c.dotX,
            top:  c.dotY - 22,
            color: 'rgba(255,255,255,0.75)',
            fontSize: 11,
            fontWeight: 300,
            letterSpacing: '0.04em',
            opacity: c.strength,
            transition: 'opacity 0.15s ease',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {c.skill}
        </div>
      ))}

      {/* Decorative floating card */}
      <DecorativeCard />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-sm text-white/80 tracking-wide">
          C Stavridis <strong className="font-semibold text-white">Design Engineer</strong>
        </span>
        <ul className="hidden md:flex gap-6 text-sm text-white/70">
          <li><a href="#work"        className="hover:text-white transition-colors">Work</a></li>
          <li><span className="text-white/30">·</span></li>
          <li><a href="#experiments" className="hover:text-white transition-colors">Experiments</a></li>
          <li><span className="text-white/30">·</span></li>
          <li><a href="#contact"     className="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </nav>

      {/* Headline */}
      <div className="relative z-10 flex items-center justify-center"
           style={{ minHeight: 'calc(100vh - 80px)', pointerEvents: 'none' }}>
        <h1
          ref={headlineRef}
          className="text-2xl md:text-4xl text-white text-center font-semibold leading-tight max-w-3xl px-6"
          style={{ animation: 'fade-up 0.4s ease both' }}
        >
          I turn complex ideas into<br />
          approachable products with personality.
        </h1>
      </div>

      {/* Project panel */}
      {activeSkill && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="max-w-5xl mx-auto px-8 py-6">
            <div className="flex items-baseline gap-3 mb-4">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: GROUP_COLOR[activeSkill.group] }}
              >
                {activeSkill.skill}
              </span>
              {!activeSkill.isGroup && (
                <span className="text-white/30 text-xs">{activeSkill.group}</span>
              )}
            </div>

            {matchingProjects.length > 0 ? (
              <ul className="flex flex-wrap gap-3">
                {matchingProjects.map(p => (
                  <li key={p.id}>
                    <Link
                      href={`/work/${p.slug}`}
                      className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-full"
                      style={{ border: '1px solid rgba(255,255,255,0.18)' }}
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/30 text-sm">No tagged projects yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
