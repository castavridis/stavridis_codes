import { execSync } from 'node:child_process';
import babel from '@rolldown/plugin-babel';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

// Read git metadata at build time so the footer's "Last Updated on …"
// stamp stays honest without manual maintenance. Wrapped in try/catch
// so a tarball install (no .git directory) still builds — the values
// fall back to safe defaults and the footer hides the link.
function gitInfo() {
  try {
    const date = execSync('git log -1 --format=%cI', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const sha = execSync('git log -1 --format=%H', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return { date: date.slice(0, 10), sha };
  } catch {
    return { date: '', sha: '' };
  }
}

const GIT = gitInfo();
const REPO_URL = 'https://github.com/castavridis/stavridis_codes';

export default defineConfig({
  base: '/',
  server: {
    allowedHosts: ["celeste.local"],
  },
  // three and @react-three/fiber are only imported by the CareSignal
  // clinician figures (orbit/*.js), which load through .mdx — and Vite's
  // startup dependency scan can't read .mdx. Without this, the dev server
  // discovers them on the first visit to that case study, re-bundles every
  // dependency with new chunk export names, and forces a reload; Safari can
  // run old and new chunks together first and throw "Importing binding name
  // 't' is not found". Pre-bundling them at startup avoids the re-optimize.
  optimizeDeps: {
    include: ['three', '@react-three/fiber'],
  },
  define: {
    __LAST_UPDATED__: JSON.stringify(GIT.date),
    __LAST_COMMIT_SHA__: JSON.stringify(GIT.sha),
    __REPO_URL__: JSON.stringify(REPO_URL),
  },
  plugins: [
    tailwindcss(),
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
