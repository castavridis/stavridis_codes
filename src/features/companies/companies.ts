import type { Role } from '../role/role-context.js';

// `featuredSlugs` — ordered list of FeaturedWork card slugs to show for
// this company. Slugs must match `PROJECTS` in featured-work.tsx
// (`caresignal-platform`, `fracta`, `sqshbook`, `caresignal-ai`). When
// absent, FeaturedWork renders its canonical 4 in canonical order.
//
// `role` — optional role override applied while this company's context
// is active. `'de'` → "Design Engineer", `'pd'` → "Product Designer".
// Takes precedence over the visitor's stored role but is subordinate to
// an explicit `/de` / `/pd` URL visit. When the company is dismissed
// (via the landing's dismiss affordance) the role falls back to the
// visitor's stored choice or the default.
export type CompanyConfig = {
  name: string;
  blurb?: string;
  featuredSlugs?: string[];
  role?: Role;
};

export const companies: Record<string, CompanyConfig> = {
  civai: {
    name: 'CivAI',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta'],
    role: 'pd',
  },
  ramp: {
    name: 'Ramp',
    role: 'de',
  },
  stripe: {
    name: 'Stripe',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    role: 'pd',
  },
  atomicdust: {
    name: 'Atomicdust',
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'sqshbook', 'fracta'],
  },

  // ── Design Engineer targets ──
  // Canonical order already leads with the CareSignal design system,
  // which is the strongest signal for these, so most are role-only.
  ashby: {
    name: 'Ashby',
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'fracta', 'sqshbook'],
    role: 'de', // also has a Senior PD role — flip to 'pd' if applying to that
  },
  vercel: {
    name: 'Vercel',
    role: 'de',
  },
  infisical: {
    name: 'Infisical',
    role: 'de',
  },
  vvd: {
    name: 'vvd',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    role: 'de',
  },
  weedmaps: {
    name: 'Weedmaps',
    role: 'de',
  },
  a16z: {
    name: 'a16z',
    role: 'de', // Design Systems Lead — flip to 'pd' if the role leans pure-design
  },

  // ── Health / clinical / AI ── lead with the AI + health work
  maven: {
    name: 'Maven Clinic',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'sqshbook', 'fracta'],
    role: 'pd',
  },
  counsel: {
    name: 'Counsel Health',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    role: 'pd',
  },
  flatiron: {
    name: 'Flatiron Health',
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'fracta', 'sqshbook'],
    role: 'pd',
  },
  headway: {
    name: 'Headway',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    role: 'pd',
  },
  hume: {
    name: 'Hume AI',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    role: 'pd',
  },

  // ── Craft studio ── lead with design-system craft, then community work
  upstatement: {
    name: 'Upstatement',
    featuredSlugs: ['caresignal-platform', 'sqshbook', 'caresignal-ai', 'fracta'],
    role: 'pd',
  },

  // ── Other product-design targets ── canonical order
  sapiom: {
    name: 'Sapiom',
    role: 'pd',
  },
  instrumentl: {
    name: 'Instrumentl',
    role: 'pd',
  },

  // elicit: { name: 'Elicit', role: 'de' }, // posting was closed last we checked — re-add if it reopens
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
