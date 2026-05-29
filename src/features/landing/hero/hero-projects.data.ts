// Hero project cards — three overlapping watercolor cards. The watercolor is
// real pigment (a live Washes canvas) rather than a static screenshot, with a
// brush-stroke SVG traced onto each.

import type { HeroProject } from "./hero-project-card.js";

// Order matches the Figma stacking: the centre card (Project 01) sits highest
// and on top; the two flanking cards are lower and behind it.
// MOBILE_HERO_PROJECTS puts Project 01 in the middle slot so it opens centered.
export const HERO_PROJECTS: HeroProject[] = [
  {
    id: "proj-careSignal-ai",
    label: "Project 02",
    title: "Expressing the value\nof CareSignal AI",
    image: "/images/CareSignal AI Thumb.png",
    pigment: "blue",
    cta: { text: "View Project", variant: "filled" },
    left: -55,
    top: 328,
    rotation: 1,
    z: 10,
    bob: false,
  },
  {
    id: "proj-sol-lewitt",
    label: "Project 03",
    title: "Using ML to Conserve\nthe work of Sol LeWitt",
    image: "/images/Sol LeWitt Thumb.png",
    pigment: "rose",
    cta: { text: "View Project", variant: "filled" },
    left: 554,
    top: 328,
    rotation: 1,
    z: 10,
    bob: false,
  },
  {
    id: "proj-careSignal-ds",
    label: "Project 01",
    title: "Building CareSignal’s\nDesign System",
    image: "/images/CareSignal Design System Thumb.png",
    pigment: "yellow",
    cta: { text: "View Project", variant: "filled" },
    left: 251,
    top: 246,
    rotation: -1,
    z: 20,
    bob: true,
  },
];

// Mobile order: 02 · 01 · 03 — Project 01 in the center slot opens centered.
export const MOBILE_HERO_PROJECTS = [HERO_PROJECTS[0], HERO_PROJECTS[2], HERO_PROJECTS[1]];
