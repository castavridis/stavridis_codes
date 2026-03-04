import HeroSection from './components/hero/HeroSection'
import ProjectsSection from './components/projects/ProjectsSection'
import { getAllProjects } from '@/lib/supabase/queries'
import { sono } from '(fonts)/sono'

export const dynamic = 'force-static'

export default async function Page() {
  const projects = await getAllProjects()

  return (
    <main className={sono.className}>
      <HeroSection />
      <ProjectsSection projects={projects} />
    </main>
  )
}
