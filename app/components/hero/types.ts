export interface Dot {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  skill: string
  group: 'design' | 'engineering' | 'strategy'
  isGroup: boolean
}

export interface Connection {
  dotId: number
  strength: number // 0–1, drives line/label opacity
  lineEnd: { x: number; y: number } // nearest point on headline rect
  dotX: number
  dotY: number
  skill: string
  group: 'design' | 'engineering' | 'strategy'
}
