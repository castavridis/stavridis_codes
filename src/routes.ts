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
  // Role aliases. `/de` is the canonical home as Design Engineer (clears any
  // stored role override). `/pd` is the same landing with the H1 swapped to
  // "Product Designer" and the override persisted in localStorage.
  roleDe: {
    path: '/de',
    href: () => '/de',
  },
  rolePd: {
    path: '/pd',
    href: () => '/pd',
  },
  // `/clear` reverts any stored role override back to the canonical
  // default H1 ("Designer and Engineer"). The page itself still renders
  // the home landing — no redirect.
  roleClear: {
    path: '/clear',
    href: () => '/clear',
  },
} as const;
