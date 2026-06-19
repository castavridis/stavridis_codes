// `heroProjectIds` is the legacy override for the old animated hero (kept
// for the app.tsx mapping into HERO_PROJECTS but a no-op in v2 since the
// hero is gone). `featuredSlugs` is the v2 mechanism — an ordered list of
// FeaturedWork card slugs (`caresignal`, `fracta`, `sqshbook`,
// `caresignal-ai`) to show for this company. When absent, FeaturedWork
// renders its canonical 4 in canonical order.
export type CompanyConfig = {
  name: string;
  blurb?: string;
  featuredSlugs?: string[];
  heroProjectIds?: string[];
  creativeCardIds?: string[];
  experimentCardIds?: string[];
};

export const companies: Record<string, CompanyConfig> = {
  civai: {
    name: 'CivAI',
    heroProjectIds: ['proj-careSignal-ai', 'proj-sol-lewitt', 'proj-careSignal-ds'],
    featuredSlugs: ['caresignal-ai', 'caresignal', 'fracta'],
  },
  ramp: {
    name: 'Ramp',
  },
  stripe: {
    name: 'Stripe',
    heroProjectIds: ['proj-careSignal-ai', 'proj-careSignal-ds', 'proj-sol-lewitt'],
    featuredSlugs: ['caresignal-ai', 'caresignal', 'fracta', 'sqshbook'],
  },
  atomicdust: {
    name: 'Atomicdust',
    heroProjectIds: ['proj-careSignal-ds', 'proj-careSignal-ai', 'proj-sol-lewitt'],
    featuredSlugs: ['caresignal', 'caresignal-ai', 'sqshbook', 'fracta'],
  },
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
