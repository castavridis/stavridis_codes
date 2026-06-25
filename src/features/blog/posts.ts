import type { MDXContent } from 'mdx/types';

export type PostFrontmatter = {
  title: string;
  // YAML parses zero-padded ISO dates (`2026-05-12`) as Date objects under
  // the default schema, while non-padded dates (`2026-6-21`) stay strings.
  // Accept both shapes; `parseDate` below normalizes them.
  date: string | Date;
  summary: string;
  // Optional v2 fields. `dek` is a longer subtitle shown beneath the title in
  // the post layout; falls back to `summary` when absent so legacy posts still
  // read correctly. `tags` is a free-form pipe-or-bullet-separated string
  // mirroring the project chrome's TopNavigation convention (e.g. "Notes ·
  // Engineering").
  dek?: string;
  tags?: string;
  // Production visibility is opt-in: only posts with `status: 'published'`
  // ship. Anything else (missing field, `'draft'`, or any unrecognized
  // value) is hidden in prod. Dev still surfaces everything so WIPs can be
  // previewed at the local URL.
  status?: 'draft' | 'published';
};

export type Post = PostFrontmatter & {
  slug: string;
  loadComponent: () => Promise<MDXContent>;
};

const postFrontmatterModules = import.meta.glob<PostFrontmatter>('../../../content/posts/*.mdx', {
  eager: true,
  import: 'frontmatter',
});

const postRawModules = import.meta.glob<string>('../../../content/posts/*.mdx', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const postComponentModules = import.meta.glob<MDXContent>('../../../content/posts/*.mdx', {
  import: 'default',
});

function slugFromPath(path: string) {
  return path.replace(/^..\/..\/..\/content\/posts\//, '').replace(/\.mdx$/, '');
}

export const posts: Post[] = Object.entries(postFrontmatterModules)
  .map(([path, frontmatter]) => ({
    ...frontmatter,
    slug: slugFromPath(path),
    loadComponent: async () => {
      const loadComponent = postComponentModules[path];

      if (!loadComponent) {
        throw new Error(`Could not find MDX component for ${path}.`);
      }

      return loadComponent();
    },
  }))
  .filter((post) => import.meta.env.DEV || post.status === 'published')
  .sort((first, second) => parseDate(second.date).getTime() - parseDate(first.date).getTime());

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

// Normalize a frontmatter date into a Date object. Accepts Date instances
// (YAML's default-schema timestamp), zero-padded ISO strings (`2026-05-12`),
// and loose `YYYY-M-D` strings — Safari rejects the loose form via the
// Date string constructor, so we parse the parts manually as a safety net.
function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(date);
}

export function formatPostDate(date: string | Date): string {
  const d = parseDate(date);
  if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(d);
}

// ISO-8601 string suitable for a `<time dateTime="…">` attribute. Falls back
// to the original string when the date can't be parsed.
export function isoPostDate(date: string | Date): string {
  const d = parseDate(date);
  if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  return d.toISOString().slice(0, 10);
}

// Estimate reading time from the raw MDX body. Strips frontmatter, code
// fences, MDX/HTML tags, and markdown image syntax, then counts words at 220
// wpm (a comfortable rate for reflective writing). Rounds up and returns
// "N min read" — minimum of 1.
const WORDS_PER_MINUTE = 220;

function rawBodyForSlug(slug: string): string | undefined {
  const entry = Object.entries(postRawModules).find(([path]) => slugFromPath(path) === slug);
  const value = entry?.[1];
  // `?raw` should return a string, but the MDX plugin (`@mdx-js/rollup`)
  // intercepts `.mdx` imports regardless of the query suffix, so we can
  // get an MDX module object instead. Guard the type so the calling code
  // doesn't blow up — falls back to "1 min read" via the caller.
  return typeof value === 'string' ? value : undefined;
}

export function readingTimeForPost(post: Post): string {
  const raw = rawBodyForSlug(post.slug);
  if (!raw) return '1 min read';
  const stripped = raw
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~-]/g, ' ');
  const words = stripped.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
