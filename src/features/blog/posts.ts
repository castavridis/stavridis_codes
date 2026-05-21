import type { ComponentType } from 'react';

export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
};

export type Post = PostFrontmatter & {
  slug: string;
  loadComponent: () => Promise<ComponentType>;
};

const postFrontmatterModules = import.meta.glob<PostFrontmatter>('../../../content/posts/*.mdx', {
  eager: true,
  import: 'frontmatter',
});

const postComponentModules = import.meta.glob<ComponentType>('../../../content/posts/*.mdx', {
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
