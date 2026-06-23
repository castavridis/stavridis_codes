import type { MDXComponents, MDXContent } from 'mdx/types';
import { createElement, Suspense, use } from 'react';
import { Link } from 'wouter';
import { MDXColumn, MDXWrapper } from '../../components/mdx/Layout.js';
import { routes } from '../../routes.js';
import { getProject, type Project } from './projects.js';
import { ProjectNavigation } from '../../components/ProjectNavigation.js';
import MDXLayout, { mdxComponents as v2MdxComponents } from './components/MDXLayout.js';

const v1MdxComponents = { MDXWrapper, MDXColumn };

const projectComponentPromises = new Map<string, Promise<MDXContent>>();

export type ProjectGradientType = 'magenta' | 'yellow' | 'blue'
const PROJECT_GRADIENT: Record<ProjectGradientType, string> = {
  'magenta': 'radial-gradient(500px 89px at 50% 100%, rgba(165, 14, 83, 0.5) 0%, rgba(165, 14, 83, 0) 100%)',
  'yellow': 'radial-gradient(500px 89px at 50% 100%, rgba(227, 175, 8, 0.5) 0%, rgba(227, 175, 8, 0) 100%)',
  'blue': 'radial-gradient(500px 89px at 50% 100%, rgba(16, 139, 160, 0.5) 0%, rgba(16, 139, 160, 0) 100%)',
}

function formatTags(tags: string[]) {
  let _tags = ``;
  for (let i = 0; i < tags.length; i++) {
    const tagArr = tags[i].split(' ');
    let _tag = ``;
    for (let j = 0; j < tagArr.length; j++) {
      const part = tagArr[j];
      _tag += `${part}&nbsp;`;
    }
    _tags += _tag;
    if (i < tagArr.length) {
      _tags += '·&nbsp;';
    }
  }
  return _tags;
}

// A project is v2-shape when its frontmatter declares the new copy fields
// `headline` and `introduction`. v2 posts render bare body inside MDXLayout;
// v1 posts keep the legacy gradient header + prose column chrome.
function isV2Project(project: Project): boolean {
  return Boolean(project.headline && project.introduction);
}

export function ProjectPost({
  slug,
  onBack,
  stampCompanyName,
}: {
  slug: string;
  onBack?: () => void;
  stampCompanyName?: string;
}) {
  const project = getProject(slug);

  if (!project) {
    return <ProjectNotFound />;
  }

  if (isV2Project(project)) {
    return <V2ProjectPost project={project} onBack={onBack} stampCompanyName={stampCompanyName} />;
  }

  return <V1ProjectPost project={project} onBack={onBack} />;
}

function V2ProjectPost({
  project,
  onBack,
  stampCompanyName,
}: {
  project: Project;
  onBack?: () => void;
  stampCompanyName?: string;
}) {
  const front = {
    headline: project.headline ?? project.summary,
    introduction: project.introduction ?? '',
    tags: project.tags.join(' · '),
  };
  return (
    <MDXLayout front={front} onClose={onBack} stampCompanyName={stampCompanyName}>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading project...</p>}>
        <ProjectContent project={project} components={v2MdxComponents} />
      </Suspense>
    </MDXLayout>
  );
}

function V1ProjectPost({ project, onBack }: { project: Project; onBack?: () => void }) {
  const backClassName =
    "cursor-pointer font-mono text-[12px] leading-normal text-cream rounded-md py-[4px] px-[8px] mix-blend-difference text-right transition-colors hover:text-black bg-[rgba(79,61,27,0.5)]";

  return (
    <article style={{ color: project.color }}>
      <div
        className="mix-blend-multiply"
        style={{
          background: `${PROJECT_GRADIENT[project.gradient || 'yellow']}`,
          boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.25)',
        }}>
        <div className="mx-auto max-w-[1280px] px-4 md:px-18">
        <header className="grid grid-cols-12 pb-12 pt-4">
          <div className="col-span-12 md:col-span-6 md:col-start-4">
            <div>
              <ProjectNavigation color={project.color} closeElement={
                onBack ? (
                  <button type="button" className={backClassName} onClick={onBack}>
                      Close
                    </button>
                  ) : (
                    <Link className={backClassName} href={routes.home.href()}>
                      Back home
                    </Link>
                  )}
                />
              </div>
              <h1 className="font-display text-2xl mt-14">
                {project.summary}
              </h1>
              <p className="font-mono text-xs text-gray-600 mt-4" dangerouslySetInnerHTML={{__html: formatTags(project.tags)}}>
              </p>
            </div>
          </header>
        </div>
      </div>
      <div className="prose prose-gray max-w-none" style={{ backgroundColor: project.background }}>
        <div className="max-w-[1280px] mx-auto p-4 md:p-18">
          <Suspense fallback={<p className="text-sm text-gray-500">Loading project...</p>}>
            <ProjectContent project={project} components={v1MdxComponents} />
          </Suspense>
        </div>
      </div>
    </article>
  );
}

function ProjectContent({
  project,
  components,
}: {
  project: Project;
  components: MDXComponents;
}) {
  const Component = use(getProjectComponentPromise(project));
  return createElement(Component, { components });
}

function getProjectComponentPromise(project: Project) {
  const cached = projectComponentPromises.get(project.slug);
  if (cached) return cached;
  const promise = project.loadComponent();
  projectComponentPromises.set(project.slug, promise);
  return promise;
}

export function prefetchProject(slug: string): void {
  const project = getProject(slug);
  if (project) getProjectComponentPromise(project);
}

function ProjectNotFound() {
  return (
    <section className="py-20">
      <p className="text-primary-700 mb-3 text-xs font-bold tracking-[0.12em] uppercase">404</p>
      <h1 className="mb-4 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
        Project not found
      </h1>
      <p className="mb-6 max-w-2xl text-lg text-gray-600">
        This route does not have a matching project.
      </p>
      <Link
        className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
        href={routes.home.href()}
      >
        Back home
      </Link>
    </section>
  );
}
