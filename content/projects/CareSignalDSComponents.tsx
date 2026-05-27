import {
  ProjectDescription,
  ProjectImage,
  ProjectSubheader,
  MDXWrapper,
  MDXColumn
} from '../../src/components/mdx/Layout';

export function GuidingPrinciple () {
  return (
    <MDXWrapper>
      <MDXColumn span={4} start={2}>
        <div className="bg-cs-black text-cs-white rounded-lg px-9 h-full content-center">
          <ProjectSubheader className="text-cs-white">
            Guiding<br />Principle    
          </ProjectSubheader>
          <p className="text-xl" style={{
            hangingPunctuation: 'first',
          }}>
            “You have to understand... Everybody is busy. All we’re doing is putting out fires and we just want to know if a fire is put out and move on to the next one.”
          </p>
          <p className="mb-0 font-mono text-md text-amber-50">
            <strong className="text-amber-50">CareSignal Clinical User</strong><br/>
            RN and Diabetes Educator
          </p>
        </div>
      </MDXColumn>
      <MDXColumn span={6}>
        <ProjectImage
          src="/images/caresignal-ds/Triage Statuses Illustration.png"
          alt="CareSignal alert and triage statuses. Alerts are bell-shaped. Triage statuses are high-, medium-, and low-risk." />
      </MDXColumn>
    </MDXWrapper>
  )
}

export function Alerts () {
  return (
    <MDXWrapper>
      <MDXColumn span={3} start={2}>
        <ProjectDescription>
          <ProjectSubheader>Alerts</ProjectSubheader>
          <p>
            CareSignal triggers alerts based on a patient’s data. They signal an opportunity for a provider to prevent deterioration of their condition and avert a costly ED visit.
          </p>
          <p>
            Users needed to be able to scan alerts the should action and hide alerts they attempted to address but could not. (Snoozing.)
          </p>
        </ProjectDescription>
      </MDXColumn>
      <MDXColumn span={6} start={6}>
        <ProjectImage
          src="/images/caresignal-ds/Alerts Illustration.png"
          alt="Sample CareSignal alerts" />
      </MDXColumn>
    </MDXWrapper>
   )
}

export function Patients () {
  return (
    <MDXWrapper>
      <MDXColumn span={6} start={2}>
        <ProjectImage
          src="/images/caresignal-ds/Patients Illustration.png"
          alt="An example of patient data, alerts, and triage statuses displayed together."
          />
      </MDXColumn>
      <MDXColumn span={3} start={9}>
        <ProjectDescription>
        <ProjectSubheader>Patients</ProjectSubheader>
          <p>
            Summaries take alerts into consideration but give users high-level overviews about their patients’ most recent clinical statuses.
          </p>
        </ProjectDescription>
      </MDXColumn>
    </MDXWrapper>
  )
}

export function CodeSample () {
  return (
    <MDXWrapper>
      <MDXColumn span={8} start={3}>
        <div>
          Hello.
        </div>
        <pre>
          Code snippet here.
        </pre>
      </MDXColumn>
    </MDXWrapper>
  )
}

export function Dashboard () {
  return (
    <MDXWrapper>
      <MDXColumn span={12}>
        <ProjectSubheader className="text-center mb-0">CareSignal Dashboard</ProjectSubheader>
      </MDXColumn>
      <MDXColumn span={6} start={4}>
        <ul>
          <ol>150 to 1500 patients</ol>
          <ol>Desktop-only, providers have multi-monitor setups or tablets if accessing from a hand-held</ol>
          <ol>Highlight patients based on an organizations’ SOPs</ol>
        </ul>
      </MDXColumn>
      <MDXColumn span={12}>
        <ProjectImage
          src="/images/caresignal-ds/Dashboard.png"
          alt="CareSignal dashboard" />
      </MDXColumn>
    </MDXWrapper>
  )
}

export function DesignDetails () {
  return (
    <>
      <MDXWrapper>
        <MDXColumn span={12}>
          <ProjectSubheader className="text-center mb-0">Design Details</ProjectSubheader>
        </MDXColumn>
        <MDXColumn span={12}>
          <ProjectImage
            src="/images/caresignal-ds/Icons Illustration.png"
            alt="" />
        </MDXColumn>
      </MDXWrapper>
      <MDXWrapper>
        <MDXColumn span={5}>
          <ProjectImage
            src="/images/caresignal-ds/Dashboard Statistic.png"
            alt="" />
        </MDXColumn>
        <MDXColumn span={7}>
          <ProjectImage
            src="/images/caresignal-ds/Response Graph.png"
            alt="" />
        </MDXColumn>
      </MDXWrapper>
      <MDXWrapper>
        <MDXColumn span={6}>
          <ProjectImage
            src="/images/caresignal-ds/Digital Summary.png"
            alt="" />
        </MDXColumn>
        <MDXColumn span={6}>
          <ProjectImage
            src="/images/caresignal-ds/Faxable Summary.png"
            alt="" />
        </MDXColumn>
      </MDXWrapper>
      <MDXWrapper>
        <MDXColumn span={8}>
          <ProjectImage
            src="/images/caresignal-ds/Patient Quote.png"
            alt="" />
        </MDXColumn>
        <MDXColumn span={4}>
          <ProjectImage
            src="/images/caresignal-ds/Outcome Lockup.png"
            alt="" />
        </MDXColumn>
      </MDXWrapper>
    </>
  )
}
