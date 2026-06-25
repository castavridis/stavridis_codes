import {
  ProjectDescription,
  ProjectImage,
  ProjectSubheader,
  MDXColumn,
  MDXWrapper,
} from '../../src/components/mdx/Layout';

export function Intro () {
  return (
    <>
      <MDXWrapper>
        <MDXColumn span={6} start={4}>
          <p></p>
        </MDXColumn>
      </MDXWrapper>
      <MDXWrapper>
        <MDXColumn span={10} start={2}>
          <ProjectImage
            src="/images/caresignal-ai/iPad Mockup.png"
            alt="" />
        </MDXColumn>
      </MDXWrapper>
    </>
  )
}
export function DesignDetails () {
  return (
    <>
      <MDXWrapper>
        <MDXColumn span={12}>
          <ProjectSubheader className="text-center text-cs-white">Design Details</ProjectSubheader>
        </MDXColumn>
      </MDXWrapper>
      <MDXWrapper>
        <MDXColumn span={4}>
          <ProjectImage
            src="/images/caresignal-ai/Sticker IBM.png"
            alt="" />
        </MDXColumn>
        <MDXColumn span={8}>
          <ProjectImage
            src="/images/caresignal-ai/Data Chart.png"
            alt="" />
        </MDXColumn>
      </MDXWrapper>
    </>
  )
}
export function Stickers () {
  return (
    <MDXWrapper>
      <MDXColumn span={12}>
        <ProjectImage
          src="/images/caresignal-ai/Sticker Panel.png"
          alt="" />
      </MDXColumn>
    </MDXWrapper>
  )
}
export function Blocks () {
  return (
    <MDXWrapper>
      <MDXColumn span={4}>
        <ProjectImage
          src="/images/caresignal-ai/Block 1.png"
          alt="" />
      </MDXColumn>
      <MDXColumn span={4}>
        <ProjectImage
          className="mt-40"
          src="/images/caresignal-ai/Block 2.png"
          alt="" />
      </MDXColumn>
      <MDXColumn span={4}>
        <ProjectImage
          className="mt-80"
          src="/images/caresignal-ai/Block 3.png"
          alt="" />
      </MDXColumn>
    </MDXWrapper>
  )
}
export function Illustrations () {
  return (
    <MDXWrapper>
      <MDXColumn span={12}>
        <ProjectImage
          src="/images/caresignal-ai/Illo Panel.png"
          alt="" />
      </MDXColumn>
    </MDXWrapper>
  )
}
export function Close () {
  return (
    <MDXWrapper>
      <MDXColumn span={8}>
        <ProjectImage
          src="/images/caresignal-ai/Info Card.png"
          alt="" />
      </MDXColumn>
      <MDXColumn span={4}>
        <ProjectImage
          src="/images/caresignal-ai/Robot Illo.png"
          alt="" />
      </MDXColumn>
    </MDXWrapper>
  )
}
export function CTA () {
  return (
    <MDXWrapper>
      <MDXColumn span={12}>
        <div className="text-center">
          <a className="border border-cs-white text-cs-white rounded-md px-5 py-4 text-cs-white no-underline" target="_blank" href="https://caresignal-ai.vercel.app">Visit Live Site</a>
        </div>
      </MDXColumn>
    </MDXWrapper>
  )
}
