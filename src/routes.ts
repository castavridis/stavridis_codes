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
  explorations: {
    path: '/explorations',
    href: () => '/explorations',
  },
  project: {
    path: '/project/:slug',
    href: ({ slug }: { slug: string }) => `/project/${encodeURIComponent(slug)}`,
  },
  forCompany: {
    path: '/for/:company',
    href: ({ company }: { company: string }) => `/for/${encodeURIComponent(company)}`,
  },
  // Source-tagged alias of forCompany, e.g. /for/acme/via/resume or
  // /for/acme/via/twitter. Renders the same page; the `via/:source` segment
  // exists only so each channel shows up as its own path in Vercel Web
  // Analytics. The canonical (bookmarkable, persisted) URL stays /for/:company.
  forCompanyVia: {
    path: '/for/:company/via/:source',
    href: ({ company, source }: { company: string; source: string }) =>
      `/for/${encodeURIComponent(company)}/via/${encodeURIComponent(source)}`,
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
