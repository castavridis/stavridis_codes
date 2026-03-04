import { getAllProjects, getProjectBySlug } from '@/lib/supabase/queries'
import { notFound } from 'next/navigation'
import { sono } from '(fonts)/sono'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  return (
    <main
      className={sono.className}
      style={{ background: '#6b1212', minHeight: '100vh' }}
    >
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Back */}
        <a
          href="/"
          className="text-white/50 text-sm hover:text-white transition-colors"
        >
          ← Back
        </a>

        {/* Cover */}
        {project.cover_image_url && (
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="mt-8 w-full rounded-2xl object-cover"
            style={{ maxHeight: 480 }}
          />
        )}

        {/* Title */}
        <h1 className="mt-10 text-4xl md:text-5xl font-semibold text-white leading-tight">
          {project.name}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-white/50">
          {project.year && <span>{project.year}</span>}
          {project.role && <span>{project.role}</span>}
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
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

        {/* Description */}
        {project.description && (
          <p className="mt-8 text-white/75 text-lg leading-relaxed max-w-2xl">
            {project.description}
          </p>
        )}
      </div>
    </main>
  )
}
