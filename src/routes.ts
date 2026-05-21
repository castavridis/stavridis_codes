export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  blogPost: {
    path: '/blog/:slug',
    href: ({ slug }: { slug: string }) => `/blog/${encodeURIComponent(slug)}`,
  },
  projectCareSignalAi: {
    path: '/projects/caresignal-ai',
    href: () => '/projects/caresignal-ai',
  },
} as const;
