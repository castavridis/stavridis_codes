'use client'

// Hero-only decorative floating card.
// Replace the green <div> with an <img src="..."> once the asset is ready.
export default function DecorativeCard() {
  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none z-0"
      style={{
        left: '38%',
        top: '7%',
        animation: 'spiral-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) 320ms both',
      }}
    >
      {/* ↓ placeholder — swap for <img src="..." alt="" /> when asset is ready */}
      <div
        style={{
          width: 150,
          height: 175,
          borderRadius: 16,
          background: '#22c55e',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#fff', fontSize: 11, opacity: 0.7 }}>image here</span>
      </div>
    </div>
  )
}
