export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  blogPost: {
    path: '/blog/:slug',
    href: ({ slug }: { slug: string }) => `/blog/${encodeURIComponent(slug)}`,
  },
  projectSolLewitt: {
    path: '/projects/sol-lewitt',
    href: () => '/projects/sol-lewitt',
  },
} as const;
