import { getProjectBySlug } from '@/lib/supabase/queries'
import { sono } from '(fonts)/sono'
import RainCheckFormIII from 'rc_rain_check/app/(components)/RainCheckFormIII'

export const SLUG = 'rain-check'

export default async function RainCheckPage() {
  const project = await getProjectBySlug(SLUG)

  return (
    <main
      className={sono.className}
      style={{ background: '#6b1212', minHeight: '100vh' }}
    >
      <div className="max-w-4xl mx-auto px-8 py-10">
        <a href="/" className="text-white/50 text-sm hover:text-white transition-colors">
          ← Back
        </a>

        <h1 className="mt-10 text-4xl md:text-5xl font-semibold text-white leading-tight">
          {project?.name ?? 'Rain Check'}
        </h1>

        {project && (
          <div className="flex flex-wrap gap-6 mt-4 text-sm text-white/50">
            {project.year && <span>{project.year}</span>}
            {project.role && <span>{project.role}</span>}
          </div>
        )}

        {project?.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full text-white/60"
                style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {project?.description && (
          <p className="mt-4 text-white/60 text-base leading-relaxed max-w-2xl">
            {project.description}
          </p>
        )}
      </div>

      <RainCheckFormIII />
    </main>
  )
}
