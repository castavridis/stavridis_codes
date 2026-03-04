'use client'

import { useRef } from 'react'
import { useFloatingDots } from './useFloatingDots'
import { SKILLS, DOT_RADIUS, GROUP_RADIUS } from './data'
import { sono } from '../../(fonts)/sono'

const GROUP_COLOR = {
  design:      '#e85c5c',
  engineering: '#e07a5c',
  strategy:    '#e8a05c',
}

export default function HeroSection() {
  const containerRef    = useRef<HTMLDivElement>(null)
  const headlineRef     = useRef<HTMLHeadingElement>(null)
  const circleRefs      = useRef<(SVGCircleElement | null)[]>([])
  const groupLabelRefs  = useRef<(HTMLDivElement | null)[]>([])

  const { connections } = useFloatingDots(
    containerRef    as React.RefObject<HTMLElement | null>,
    headlineRef     as React.RefObject<HTMLElement | null>,
    circleRefs,
    groupLabelRefs
  )

  const groupLeaders = SKILLS.filter(s => s.isGroup)

  return (
    <section
      ref={containerRef}
      style={{ background: '#6b1212' }}
      className={"relative min-h-[80vh] h-[80vh] w-full overflow-hidden " + sono.className}
    >
      {/* SVG layer — circles mutated via DOM at 60fps; lines React-driven at ~10fps */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        {/* Connection lines for skill dots */}
        {connections.map(c => (
          <line
            key={c.dotId}
            x1={c.dotX}
            y1={c.dotY}
            x2={c.lineEnd.x}
            y2={c.lineEnd.y}
            stroke={GROUP_COLOR[c.group]}
            strokeWidth={0.75}
            strokeOpacity={c.strength * 0.55}
          />
        ))}

        {/* All dot circles */}
        {SKILLS.map((s, i) => (
          <circle
            key={i}
            ref={el => { circleRefs.current[i] = el }}
            r={s.isGroup ? GROUP_RADIUS : DOT_RADIUS}
            fill={GROUP_COLOR[s.group]}
            fillOpacity={s.isGroup ? 0.85 : 0.55}
          />
        ))}
      </svg>

      {/* Group name labels — always visible, DOM-positioned at 60fps */}
      {groupLeaders.map((s, i) => (
        <div
          key={s.skill}
          ref={el => { groupLabelRefs.current[i] = el }}
          className="absolute pointer-events-none select-none"
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
          }}
        >
          {s.skill}
        </div>
      ))}

      {/* Skill labels — proximity-gated, smaller, React-driven at ~10fps */}
      {connections.map(c => (
        <div
          key={c.dotId}
          className="absolute pointer-events-none select-none"
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
           style={{ minHeight: 'calc(100vh - 80px)' }}>
        <h1
          ref={headlineRef}
          className="text-2xl md:text-4xl text-white text-center font-semibold leading-tight max-w-3xl px-6"
        >
          I turn complex ideas into<br />
          approachable products with personality.
        </h1>
      </div>
    </section>
  )
}
