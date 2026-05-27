import type { MDXContent } from 'mdx/types';
import { createElement, Suspense, use } from 'react';
import { Link } from 'wouter';
import author from '../../../content/author.json';
import { MDXColumn, MDXWrapper } from '../../components/mdx/Layout.js';
import { routes } from '../../routes.js';
import { formatProjectDate, getProject, type Project } from './projects.js';
import { ProjectNavigation } from '../../components/ProjectNavigation.js';

const mdxComponents = { MDXWrapper, MDXColumn };

const projectComponentPromises = new Map<string, Promise<MDXContent>>();

export function ProjectPost({ slug, onBack }: { slug: string; onBack?: () => void }) {
  const project = getProject(slug);

  if (!project) {
    return <ProjectNotFound />;
  }

  const backClassName =
    "cursor-pointer font-mono text-[12px] leading-normal text-[#7d7d7d] mix-blend-difference text-right transition-colors hover:text-black";

  return (
    <article className="mx-auto max-w-[1280px] px-18 py-12">
      <div className="flex grid-col-12">
        <ProjectNavigation closeElement={
          onBack ? (
            <button type="button" className={backClassName} onClick={onBack}>
              Close project
            </button>
          ) : (
            <Link className={backClassName} href={routes.home.href()}>
              Back home
            </Link>
          )}
        />
      </div>
      <header className="border-b border-gray-200 pb-8">
        <p className="max-w-2xl text-lg text-gray-600">{project.summary}</p>
      </header>
      <div className="prose prose-gray mt-8 max-w-none">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading project...</p>}>
          <ProjectContent project={project} />
        </Suspense>
      </div>
    </article>
  );
}

function ProjectContent({ project }: { project: Project }) {
  const Component = use(getProjectComponentPromise(project));
  return createElement(Component, { components: mdxComponents });
}

function getProjectComponentPromise(project: Project) {
  const cached = projectComponentPromises.get(project.slug);
  if (cached) return cached;
  const promise = project.loadComponent();
  projectComponentPromises.set(project.slug, promise);
  return promise;
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
