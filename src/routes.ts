export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  blogPost: {
    path: '/blog/:slug',
    href: ({ slug }: { slug: string }) => `/blog/${encodeURIComponent(slug)}`,
  },
  project: {
    path: '/project/:slug',
    href: ({ slug }: { slug: string }) => `/project/${encodeURIComponent(slug)}`,
  },
} as const;
