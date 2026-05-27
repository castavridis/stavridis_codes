import type { MDXContent } from 'mdx/types';

export type ProjectFrontmatter = {
  title: string;
  date: string;
  summary: string;
};

export type Project = ProjectFrontmatter & {
  slug: string;
  loadComponent: () => Promise<MDXContent>;
};

const projectFrontmatterModules = import.meta.glob<ProjectFrontmatter>(
  '../../../content/projects/*.mdx',
  { eager: true, import: 'frontmatter' },
);

const projectComponentModules = import.meta.glob<MDXContent>(
  '../../../content/projects/*.mdx',
  { import: 'default' },
);

function slugFromPath(path: string) {
  return path.replace(/^..\/..\/..\/content\/projects\//, '').replace(/\.mdx$/, '');
}

export const projects: Project[] = Object.entries(projectFrontmatterModules)
  .map(([path, frontmatter]) => ({
    ...frontmatter,
    slug: slugFromPath(path),
    loadComponent: async () => {
      const loadComponent = projectComponentModules[path];
      if (!loadComponent) {
        throw new Error(`Could not find MDX component for ${path}.`);
      }
      return loadComponent();
    },
  }))
  .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function formatProjectDate(date: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00`),
  );
}
