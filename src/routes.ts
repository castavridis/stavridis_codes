export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  blogPost: {
    path: '/blog/:slug',
    href: ({ slug }: { slug: string }) => `/blog/${encodeURIComponent(slug)}`,
  },
  projectCareSignalDs: {
    path: '/projects/caresignal-design-system',
    href: () => '/projects/caresignal-design-system',
  },
} as const;
