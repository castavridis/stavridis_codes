// `featuredSlugs` — ordered list of FeaturedWork card slugs to show for
// this company. Slugs must match `PROJECTS` in featured-work.tsx
// (`caresignal-platform`, `fracta`, `sqshbook`, `caresignal-ai`). When
// absent, FeaturedWork renders its canonical 4 in canonical order.
export type CompanyConfig = {
  name: string;
  blurb?: string;
  featuredSlugs?: string[];
};

export const companies: Record<string, CompanyConfig> = {
  civai: {
    name: 'CivAI',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta'],
  },
  ramp: {
    name: 'Ramp',
  },
  stripe: {
    name: 'Stripe',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
  },
  atomicdust: {
    name: 'Atomicdust',
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'sqshbook', 'fracta'],
  },
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
