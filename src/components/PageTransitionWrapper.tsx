'use client'

import { useRef, useState } from 'react'
import LandingPage from './LandingPage'
import ProjectView from './ProjectView'

type View = { type: 'landing' } | { type: 'project'; id: string }

export default function PageTransitionWrapper() {
  const [view, setView] = useState<View>({ type: 'landing' })
  const [fading, setFading] = useState(false)
  const pendingView = useRef<View | null>(null)

  function handleCardClick(id: string) {
    if (fading) return
    pendingView.current = { type: 'project', id }
    setFading(true)
  }

  function handleClose() {
    if (fading) return
    pendingView.current = { type: 'landing' }
    setFading(true)
  }

  function handleTransitionEnd() {
    // fading=true means the fade-in just completed — swap content and fade back out
    if (fading && pendingView.current) {
      setView(pendingView.current)
      pendingView.current = null
      setFading(false)
    }
  }

  return (
    <>
      {view.type === 'landing' && <LandingPage onCardClick={handleCardClick} />}
      {view.type === 'project' && <ProjectView id={view.id} onClose={handleClose} />}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: '#6b1212',
          opacity: fading ? 1 : 0,
          transition: 'opacity 600ms ease',
          pointerEvents: fading ? 'all' : 'none',
        }}
      />
    </>
  )
}
