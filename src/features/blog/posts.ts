import type { MDXContent } from 'mdx/types';

export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  // Optional v2 fields. `dek` is a longer subtitle shown beneath the title in
  // the post layout; falls back to `summary` when absent so legacy posts still
  // read correctly. `tags` is a free-form pipe-or-bullet-separated string
  // mirroring the project chrome's TopNavigation convention (e.g. "Notes ·
  // Engineering").
  dek?: string;
  tags?: string;
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
  .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(`${date}T00:00:00`));
}

// Estimate reading time from the raw MDX body. Strips frontmatter, code
// fences, MDX/HTML tags, and markdown image syntax, then counts words at 220
// wpm (a comfortable rate for reflective writing). Rounds up and returns
// "N min read" — minimum of 1.
const WORDS_PER_MINUTE = 220;

function rawBodyForSlug(slug: string): string | undefined {
  const entry = Object.entries(postRawModules).find(([path]) => slugFromPath(path) === slug);
  return entry?.[1];
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
