import { sono } from '(fonts)/sono'
import RainCheckFormIII from 'rc_rain_check/app/(components)/RainCheckFormIII'

export default function RainCheckPage() {
  return (
    <main
      className={sono.className}
      style={{ background: '#6b1212', minHeight: '100vh' }}
    >
      <div className="max-w-4xl mx-auto px-8 py-10">
        <a
          href="/"
          className="text-white/50 text-sm hover:text-white transition-colors"
        >
          ← Back
        </a>

        <h1 className="mt-10 text-4xl md:text-5xl font-semibold text-white leading-tight">
          Rain Check
        </h1>
      </div>

      <RainCheckFormIII />
    </main>
  )
}
