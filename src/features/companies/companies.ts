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
  // `resume` — a custom URL for the Header's Resume link while this
  // company's context is active (e.g. a tailored résumé). When unset the
  // link falls back to the role-specific PDF (see role-context.ROLE_RESUME).
  resume?: string;
  featuredSlugs?: string[];
  featuredProjects?: string[];
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
  upstatement: {
    name: 'Upstatement',
    featuredSlugs: ['caresignal-ai', 'caresignal-platform', 'fracta', 'sqshbook'],
    featuredProjects: ['caresignal-ai'],
    salutation_colors: {
      foreground_color: 'rgb(255,255,255)',
      background_color: 'rgb(0,0,0)',
    },
    seal: {
      foreground_color: 'rgb(255,255,255)',
      background_color: '#1f1f1f',
    },
  },
  decimals: {
    name: 'Decimals',
    featuredSlugs: ['caresignal-platform', 'fracta', 'sqshbook', 'caresignal-ai'],
    featuredProjects: ['caresignal-platform'],
    salutation_colors: {
      foreground_color: '#4d4638',
      background_color: 'rgb(233,195,185)',
    },
    seal: {
      foreground_color: 'rgb(256,241,233)',
      background_color: 'rgb(90,75,61)',
    },
  },
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
  li: {
    name: 'You',
    featuredSlugs:['caresignal-ai', 'caresignal-platform', 'sqshbook', 'fracta'],
    featuredProjects: ['caresignal-ai'],
    salutation_colors: {
      foreground_color: 'rgb(255,255,255)',
      background_color: 'rgb(45,100,188)',
    },
    seal: {
      background_color: 'rgb(255,255,255)',
      foreground_color: 'rgb(45,100,188)',
    },
  },
  riffle: {
    name: 'Riffle',
    featuredProjects: ['caresignal-platform'],
    salutation_colors: {
      foreground_color: 'rgb(255,255,255)',
      background_color: 'rgb(0,0,0)',
    },
    seal: {
      foreground_color: 'rgb(255,255,255)',
      background_color: 'rgb(33,82,211)',
    },
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
  instrumentl: {
    name: 'Instrumentl',
    featuredSlugs: ['caresignal-platform', 'fracta', 'sqshbook', 'caresignal-ai'],
    featuredProjects: ['caresignal-platform'],
    role: 'pd',
    // colors: {
    //   brand: 'rgb(255, 79, 43)',
    //   light: 'rgb(255, 255, 255)',
    //   dark: 'rgb(0, 0, 0)',
    // },
    salutation_colors: {
      foreground_color: 'rgb(255, 255, 255)',
      background_color: 'rgb(255, 79, 43)',
    },
    seal: {
      foreground_color: 'rgb(51, 51, 51)',
      background_color: 'rgb(225, 255, 141)',
    },
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
  maven_clinic: {
    name: 'Maven Clinic',
    resume: '/resumes/C-Stavridis-Resume_Maven-Clinic.pdf',
    colors: { brand: '#09866f', light: 'rgb(237, 233, 227)', dark: 'rgb(1, 49, 38)' },
    salutation_colors: {
      foreground_color: 'rgb(255,255,255)',
      background_color: '#09866F',
    },
    seal: {
      foreground_color: 'rgb(88, 237, 162)',
      background_color: 'rgb(3, 87, 72)',
    },
    featuredSlugs: ['caresignal-platform', 'caresignal-ai', 'sqshbook', 'fracta'],
    featuredProjects: ['caresignal-platform'],
    role: 'pd',
  },
  counsel_health: {
    name: 'Counsel Health',
    resume: '/resumes/C-Stavridis-Resume_Counsel-Health.pdf',
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

  // ── Other product-design targets ── canonical order
  sapiom: {
    name: 'Sapiom',
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
