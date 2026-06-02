export type CompanyConfig = {
  name: string;
  blurb?: string;
  heroProjectIds?: string[];
  creativeCardIds?: string[];
  experimentCardIds?: string[];
};

export const companies: Record<string, CompanyConfig> = {
  civai: {
    name: 'CivAI',
    heroProjectIds: ['proj-careSignal-ai', 'proj-sol-lewitt', 'proj-careSignal-ds'],
  },
  ramp: {
    name: 'Ramp',
  },
  stripe: {
    name: 'Stripe',
    heroProjectIds: ['proj-careSignal-ai', 'proj-careSignal-ds', 'proj-sol-lewitt'],
  },
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
