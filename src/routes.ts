export const routes = {
  home: {
    path: '/',
    href: () => '/',
  },
  blogIndex: {
    path: '/blog',
    href: () => '/blog',
  },
  blogPost: {
    path: '/blog/:slug',
    href: ({ slug }: { slug: string }) => `/blog/${encodeURIComponent(slug)}`,
  },
  project: {
    path: '/project/:slug',
    href: ({ slug }: { slug: string }) => `/project/${encodeURIComponent(slug)}`,
  },
  forCompany: {
    path: '/for/:company',
    href: ({ company }: { company: string }) => `/for/${encodeURIComponent(company)}`,
  },
} as const;
