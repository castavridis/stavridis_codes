import HeroSection from './components/hero/HeroSection'
import ProjectsSection from './components/projects/ProjectsSection'
import { getAllProjects } from '@/lib/supabase/queries'
import { sono } from '(fonts)/sono'

export const dynamic = 'force-static'

export default async function Page() {
  const projects = await getAllProjects()

  return (
    <main className={sono.className}>
      <div className="h-[100vh] w-full flex items-center justify-center">
        <div>
          Hello there! I'm C Stavridis.<br /><br />
          I am a Design Engineer based in Saint Louis, MO.<br />
          And I'm available for remote opportunities.<br />
          But my portfolio is not ready at the moment. ('''' •᷄ ᴗ •᷅ )<br />
          For now, checkout my <a style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", }} href="https://github.com/castavridis/">GitHub</a> or <a style={{ textDecorationLine: "underline", textDecorationStyle: "wavy", }} href="https://www.linkedin.com/in/castavridis/">LinkedIn</a> for more information.<br /><br/>
          Check back soon!
        </div>
      </div>
    </main>
  )
}
