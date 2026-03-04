import HeroSection from './components/hero/HeroSection'
import ProjectsSection from './components/projects/ProjectsSection'
import { sono } from '(fonts)/sono'

export default function Page() {
  return (
    <main className={sono.className}>
      <HeroSection />
      <ProjectsSection />
    </main>
  )
}
