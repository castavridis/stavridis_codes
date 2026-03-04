interface SkillEntry {
  skill: string
  group: 'design' | 'engineering' | 'strategy'
  isGroup: boolean
}

export const SKILLS: SkillEntry[] = [
  // Group leaders — always-visible labels, larger dots
  { skill: 'Design',            group: 'design',      isGroup: true  },
  { skill: 'Engineering',       group: 'engineering', isGroup: true  },
  { skill: 'Strategy',          group: 'strategy',    isGroup: true  },
  // Design skills
  { skill: 'UI Design',         group: 'design',      isGroup: false },
  { skill: 'Microinteractions', group: 'design',      isGroup: false },
  { skill: 'Craft',             group: 'design',      isGroup: false },
  { skill: 'Accessibility',     group: 'design',      isGroup: false },
  { skill: 'Brand',             group: 'design',      isGroup: false },
  { skill: 'Human',             group: 'design',      isGroup: false },
  // Engineering skills
  { skill: 'Front-end',         group: 'engineering', isGroup: false },
  { skill: 'Creative Coding',   group: 'engineering', isGroup: false },
  { skill: 'Systems',           group: 'engineering', isGroup: false },
  { skill: 'Prototyping',       group: 'engineering', isGroup: false },
  { skill: 'AI/ML',             group: 'engineering', isGroup: false },
  // Strategy skills
  { skill: 'Cross-functional',  group: 'strategy',    isGroup: false },
  { skill: 'Research',          group: 'strategy',    isGroup: false },
  { skill: 'Behavioral Design', group: 'strategy',    isGroup: false },
  { skill: 'Data Viz',          group: 'strategy',    isGroup: false },
  { skill: 'Copywriting',       group: 'strategy',    isGroup: false },
]

export const PROXIMITY_THRESHOLD = 180  // px
export const DOT_SPEED_RANGE: [number, number] = [0.006, 0.018]
export const DOT_RADIUS = 4             // px — skill dots
export const GROUP_RADIUS = 7           // px — group leader dots
export const HEADLINE_MARGIN = 50       // px — dots repel from headline edge
export const DOT_SEP = 110             // px — minimum dot-to-dot distance
export const COHESION_DIST = 220        // px — skill dots attracted to leader beyond this
