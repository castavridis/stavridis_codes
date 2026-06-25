/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const frontmatter: {
    title: string;
    date: string;
    summary: string;
  };

  const MDXComponent: ComponentType;
  export default MDXComponent;
}

// Build-time injected by vite.config.ts (define). Read by the footer's
// "Last Updated on …" stamp and "View commit" link. Empty strings
// indicate the build didn't have access to git metadata.
declare const __LAST_UPDATED__: string;
declare const __LAST_COMMIT_SHA__: string;
declare const __REPO_URL__: string;
