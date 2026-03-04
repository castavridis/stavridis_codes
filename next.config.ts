import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: ['rc_rain_check'],
  turbopack: {
    root: '/Users/cstavridis/Git/stavridis_codes',
    resolveAlias: {
      // Resolve the ref repo's internal '@/*' alias to its own root
      '@': path.resolve('./node_modules/rc_rain_check'),
    },
  },
  webpack(config) {
    // Same alias resolution for webpack (used in `next build`)
    config.resolve.alias['@'] = path.resolve('./node_modules/rc_rain_check')
    return config
  },
}

export default nextConfig