import type { Role } from '../role/role-context.js';

// `featuredSlugs` — ordered list of FeaturedWork card slugs to show for
// this company. Slugs must match `PROJECTS` in featured-work.tsx
// (`caresignal-platform`, `fracta`, `sqshbook`, `caresignal-ai`). When
// absent, FeaturedWork renders its canonical 4 in canonical order.
//
// `featuredProjects` — slugs that get a rotating "Featured Project"
// seal stamp over the thumbnail. Supports multiple entries
// (every matching card gets its own stamp). Use to highlight the work
// most relevant to this company. Slugs that aren't also in
// `featuredSlugs` (or in the canonical 4 when `featuredSlugs` is
// absent) silently no-op.
//
// `role` — optional role override applied while this company's context
// is active. `'de'` → "Design Engineer", `'pd'` → "Product Designer".
// Takes precedence over the visitor's stored role but is subordinate to
// an explicit `/de` / `/pd` URL visit. When the company is dismissed
// (via the landing's dismiss affordance) the role falls back to the
// visitor's stored choice or the default.
// `colors` — the company's brand palette. `brand` is the primary brand
// hue; `light` / `dark` are the tints/shades used for surfaces + text on
// company-themed chrome. All CSS color strings (hex, rgb(), etc.).
export type CompanyColors = {
  brand: string;
  light: string;
  dark: string;
};

// `seal` — colors for the rotating "Featured Project" seal stamp. Consumed
// by RotatingSeal: `foreground_color` paints the curved + center text,
// `background_color` paints the disc (defaults to Hansa Yellow when the
// company has no `seal` set). Snake_case mirrors the source palette export.
export type SealColors = {
  foreground_color: string;
  background_color: string;
};

// `salutation_colors` — colors for the landing greeting chip.
// `foreground_color` paints the text, `background_color` the chip fill.
// When unset, the chip falls back to the brand palette (`colors.brand`
// background + `colors.dark` text). Set this to fix contrast for dark
// brands (e.g. Counsel, ambrook) where dark-on-brand is illegible.
export type SalutationColors = {
  foreground_color: string;
  background_color: string;
};

export type CompanyConfig = {
  name: string;
  // `salutation` — greeting shown in the per-company chip on the landing
  // page. When unset it defaults to `Hey! {name}` (the "hey.c" voice).
  // Set it to override per company, e.g. "Hey there, team Ramp".
  salutation?: string;
  // `salutation_colors` — override the greeting chip's colors. See
  // SalutationColors; defaults to the brand palette when unset.
  salutation_colors?: SalutationColors;
  blurb?: string;
  featuredSlugs?: string[];
  featuredProjects?: string[];
  // `previewProjects` — slugs shown with a "Preview Only" tag on their
  // FeaturedWork card, for case studies surfaced as a preview to this
  // company (e.g. an unpublished draft). Slugs not on screen silently no-op.
  previewProjects?: string[];
  role?: Role;
  colors?: CompanyColors;
  seal?: SealColors;
};

// NOTE: `colors` is populated only where a real brand value could be
// sourced. Still missing (no public palette found — add manually from the
// brand's CSS/logo SVG): civai, atomicdust, vvd, counsel, hume, sapiom,
// instrumentl. The two seal-rendering companies (civai, counsel) are among
// these, so their seals currently fall back to the Hansa Yellow default.
// `seal` is intentionally unset everywhere for now — see RotatingSeal.
export const companies: Record<string, CompanyConfig> = {
  civai: {
    name: 'CivAI',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta'],
    featuredProjects: ['fracta'],
    role: 'pd',
  },
  ramp: {
    name: 'Ramp',
    colors: { brand: '#E4F222', light: '#FFFFFF', dark: '#1F1F1F' },
    featuredProjects: ['caresignal-platform'],
    role: 'de',
  },
  stripe: {
    name: 'Stripe',
    colors: { brand: '#635BFF', light: '#F6F9FC', dark: '#0A2540' },
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
    colors: { brand: '#5D4ED6', light: '#FFFFFF', dark: '#141415' },
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'fracta', 'sqshbook'],
    role: 'de', // also has a Senior PD role — flip to 'pd' if applying to that
  },
  vercel: {
    name: 'Vercel',
    colors: { brand: '#000000', light: '#FFFFFF', dark: '#171717' },
    role: 'de',
  },
  infisical: {
    name: 'Infisical',
    colors: { brand: '#E0ED34', light: '#FCFCE8', dark: '#19191C' },
    role: 'de',
  },
  vvd: {
    name: 'vvd',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    role: 'de',
  },
  weedmaps: {
    name: 'Weedmaps',
    colors: { brand: '#00CDBE', light: '#FFFFFF', dark: '#252935' },
    role: 'de',
  },
  a16z: {
    name: 'a16z',
    // medium confidence — verify against a16z.com
    colors: { brand: '#ED8B00', light: '#FFFFFF', dark: '#4B5058' },
    role: 'de', // Design Systems Lead — flip to 'pd' if the role leans pure-design
  },

  // ── Health / clinical / AI ── lead with the AI + health work
  maven: {
    name: 'Maven Clinic',
    // medium confidence — verify against mavenclinic.com
    colors: { brand: '#02856F', light: '#FFFFFF', dark: '#263633' },
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'sqshbook', 'fracta'],
    role: 'pd',
  },
  counsel_health: {
    name: 'Counsel Health',
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'fracta', 'sqshbook'],
    featuredProjects: ['caresignal-platform'],
    colors: {
      brand: '#243866',
      light: 'rgb(215, 221, 197)',
      dark: 'rgb(36, 56, 102)',
    },
    salutation_colors: {
      background_color: 'rgb(215, 221, 197)',
      foreground_color: 'rgb(36, 56, 102)',
    },
    seal: {
      foreground_color: 'rgb(36, 56, 102)',
      background_color: 'rgb(176, 213, 18)',
    },
    role: 'pd',
  },
  flatiron: {
    name: 'Flatiron Health',
    // medium confidence — verify against brand.flatiron.com
    colors: { brand: '#5051DB', light: '#3882F5', dark: '#5051DB' },
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'fracta', 'sqshbook'],
    role: 'pd',
  },
  headway: {
    name: 'Headway',
    // low confidence — palette only, verify against headway.co
    colors: { brand: '#74E4C4', light: '#A3B9E2', dark: '#213843' },
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
    // medium confidence — verify against upstatement.com/brand
    colors: { brand: '#3F3E3A', light: '#F3EFE1', dark: '#000000' },
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
  
	ambrook: {
		name: 'ambrook',
		featuredSlugs: ['fracta', 'sqsh', 'caresignal-platform','caresignal-ai'],
		featuredProjects: ['fracta'],
		colors: {
			brand: 'rgb(67, 79, 64)',
			light: 'rgb(252, 250, 241)',
			dark: 'rgb(33, 27, 21)',
		},
		seal: {
			foreground_color: 'rgb(37, 42, 35)',
			background_color: 'rgb(232, 182, 114)',
		},
	}  
};

export function getCompany(slug: string): CompanyConfig | null {
  return companies[slug.toLowerCase()] ?? null;
}
