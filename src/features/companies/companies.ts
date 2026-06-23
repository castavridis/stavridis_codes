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
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
