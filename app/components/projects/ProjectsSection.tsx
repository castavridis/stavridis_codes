'use client'

import { useRef, useEffect, useState, type CSSProperties } from 'react'

interface Project {
  id: string
  name: string
  type: 'image' | 'outline' | 'stat' | 'dark' | 'white'
  bg?: string
  rotation: number
  yOffset: number
  delay: number
  width: number
  height: number
}

const PROJECTS: Project[] = [
  // Row 1
  {
    id: 'caresignal-ai',
    name: 'CareSignal.ai',
    type: 'image',
    bg: '#1a35a0',
    rotation: -6,
    yOffset: 20,
    delay: 0,
    width: 240,
    height: 240,
  },
  {
    id: 'sol-lewitt',
    name: 'Sol LeWitt',
    type: 'outline',
    rotation: 5,
    yOffset: -15,
    delay: 100,
    width: 200,
    height: 200,
  },
  // Row 2
  {
    id: 'design-system',
    name: 'CareSignal\nDesign System',
    type: 'outline',
    rotation: -4,
    yOffset: 30,
    delay: 0,
    width: 180,
    height: 180,
  },
  {
    id: 'conversion',
    name: 'conversion',
    type: 'stat',
    bg: '#c42b24',
    rotation: -3,
    yOffset: 0,
    delay: 80,
    width: 190,
    height: 210,
  },
  {
    id: 'vv',
    name: 'vv',
    type: 'dark',
    bg: '#0a0a0a',
    rotation: 4,
    yOffset: -20,
    delay: 160,
    width: 175,
    height: 190,
  },
  {
    id: 'iso',
    name: 'ISO Compliance\nReport',
    type: 'outline',
    rotation: 7,
    yOffset: 50,
    delay: 220,
    width: 160,
    height: 170,
  },
  // Row 3
  {
    id: 'health',
    name: 'Health Issue',
    type: 'white',
    rotation: 5,
    yOffset: 10,
    delay: 0,
    width: 210,
    height: 210,
  },
  {
    id: 'sandy',
    name: 'Sandy',
    type: 'outline',
    rotation: -2,
    yOffset: -15,
    delay: 80,
    width: 210,
    height: 240,
  },
  {
    id: 'radian',
    name: 'Radian',
    type: 'outline',
    rotation: 3,
    yOffset: 30,
    delay: 160,
    width: 200,
    height: 200,
  },
]

const ROWS = [
  PROJECTS.slice(0, 2),
  PROJECTS.slice(2, 6),
  PROJECTS.slice(6),
]

function CardContent({ p }: { p: Project }) {
  const base: CSSProperties = {
    width: p.width,
    height: p.height,
    borderRadius: 18,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  }

  if (p.type === 'outline') {
    return (
      <div style={{ ...base, border: '1.5px solid rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 300, textAlign: 'center', whiteSpace: 'pre-line', letterSpacing: '0.01em' }}>
          {p.name}
        </span>
      </div>
    )
  }

  if (p.type === 'image') {
    return (
      <div style={{ ...base, background: p.bg, padding: 16, justifyContent: 'flex-end' }}>
        {/* placeholder for screenshot — replace with <img> */}
        <div style={{
          flex: 1,
          marginBottom: 12,
          borderRadius: 6,
          background: 'radial-gradient(circle at 28% 55%, rgba(255,255,255,0.18) 0%, transparent 55%), radial-gradient(circle at 72% 28%, rgba(255,255,255,0.12) 0%, transparent 45%)',
        }} />
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 300 }}>{p.name}</span>
      </div>
    )
  }

  if (p.type === 'stat') {
    return (
      <div style={{ ...base, background: p.bg, padding: 20, justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#fff', lineHeight: 1, margin: 0 }}>
            <span style={{ fontSize: 52, fontWeight: 700 }}>330</span>
            <span style={{ fontSize: 14 }}>% increase in</span>
          </p>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 500, marginTop: 4 }}>conversion Rates</p>
        </div>
        <p style={{ color: '#fff', fontSize: 14, margin: 0 }}>
          in <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>3</span> months
        </p>
      </div>
    )
  }

  if (p.type === 'dark') {
    return (
      <div style={{ ...base, background: p.bg, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{
          width: 88,
          height: 88,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 45%, #fbbf24 100%)',
        }} />
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 300 }}>{p.name}</span>
      </div>
    )
  }

  if (p.type === 'white') {
    return (
      <div style={{ ...base, background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 152, height: 152 }}>
          <svg viewBox="0 0 152 152" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <path id="health-circle" d="M76,76 m-53,0 a53,53 0 1,1 106,0 a53,53 0 1,1 -106,0" fill="none" />
            </defs>
            <text fill="#999" style={{ fontSize: 9.5, letterSpacing: 1.5 } as CSSProperties}>
              <textPath href="#health-circle">
                DUE TO · DUE TO · DUE TO · DUE TO · DUE TO · DUE TO ·
              </textPath>
            </text>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#222', textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.4 }}>
              Health<br />Issue
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function ProjectCard({ project }: { project: Project }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{ transform: `rotate(${project.rotation}deg) translateY(${project.yOffset}px)`, flexShrink: 0 }}
    >
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.75s ease ${project.delay}ms, transform 0.75s ease ${project.delay}ms`,
      }}>
        <CardContent p={project} />
      </div>
    </div>
  )
}

export default function ProjectsSection() {
  return (
    <section style={{ background: '#6b1212' }} className="w-full pt-4 pb-32">
      <div className="max-w-5xl mx-auto px-12 flex flex-col gap-20">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-between items-start">
            {row.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
