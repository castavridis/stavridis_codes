// Lower sections — creative tools + UI experiments. Each card renders its
// imagery as a live Washes canvas tinted with the card's hue, masked by the
// three layers the Figma calls out (Washes Multiplied, Noise, Desaturation).

import type { ProjectCard } from "./reveal-card.js";

export const CREATIVE_CARDS: ProjectCard[] = [
  {
    id: "creative-washes",
    title: "Washes.js",
    description: "a computational watercolor library",
    project_image: "/images/projects/Washes BG.png",
    washes_image: "/images/projects/Washes Multiplier.png",
    link: "https://castavridis.github.io/washes-js",
  },
  {
    id: "creative-confetti",
    title: "Confetti",
    description: "a playful pixel art tool",
    project_image: "/images/projects/Confetti BG.png",
    washes_image: "/images/projects/Confetti Multiplier.png",
    link: "https://rc-confetti.vercel.app/",
  },
  {
    id: "creative-facets",
    title: "Facets",
    description: "codify your taste with a compound AI tool",
    project_image: "/images/projects/Facets BG.png",
    washes_image: "/images/projects/Facets Multiplier.png",
    link: "https://github.com/castavridis/rc_vv",
  },
];

export const EXPERIMENT_CARDS: ProjectCard[] = [
  {
    id: "experiment-sandy",
    title: "Sandy",
    description: "A 3D visualization of Dave Long's esolang, Calder",
    project_image: "/images/projects/Sandy BG.png",
    washes_image: "/images/projects/Sandy Multiplier.png",
    link: "https://rc-castavridis.vercel.app/toys/sandy/bezierTests/",
  },
  {
    id: "experiment-rain-check",
    title: "Rain Check",
    description: "Create thoughtful declines to your loved ones' events",
    project_image: "/images/projects/Rain Check BG.png",
    washes_image: "/images/projects/Rain Check Multiplier.png",
    link: "https://rc-rain-check.vercel.app/",
  },
];
