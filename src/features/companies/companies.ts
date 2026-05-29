export type CompanyConfig = {
  name: string;
  blurb?: string;
  heroProjectIds?: string[];
  creativeCardIds?: string[];
  experimentCardIds?: string[];
};

export const companies: Record<string, CompanyConfig> = {
  ramp: {
    name: 'Ramp',
  },
  stripe: {
    name: 'Stripe',
  },
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
