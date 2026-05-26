import type { MDXContent } from 'mdx/types';
import { createElement, Suspense, use } from 'react';
import { Link } from 'wouter';
import author from '../../../content/author.json';
import { MDXColumn, MDXWrapper } from '../../components/mdx/Layout.js';
import { routes } from '../../routes.js';
import { formatPostDate, getPost, type Post } from './posts.js';

// Capitalized tags used in MDX that aren't imported in the .mdx file itself are
// resolved from this map, so every post can use these without a per-file import.
const mdxComponents = { MDXWrapper, MDXColumn };

const postComponentPromises = new Map<string, Promise<MDXContent>>();

// `onBack`, when provided, intercepts the "Back to posts" link so the host can
// run a page transition before navigating home (see RadialTransition).
export function BlogPost({ slug, onBack }: { slug: string; onBack?: () => void }) {
  const post = getPost(slug);

  if (!post) {
    return <BlogPostNotFound />;
  }

  const backClassName =
    'text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 mb-8 inline-flex cursor-pointer text-sm font-medium underline';

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      {onBack ? (
        <button type="button" className={backClassName} onClick={onBack}>
          Close project
        </button>
      ) : (
        <Link className={backClassName} href={routes.home.href()}>
          Back to posts
        </Link>
      )}
      <header className="border-b border-gray-200 pb-8">
        <time className="mb-2 block text-sm text-gray-500" dateTime={post.date}>
          {formatPostDate(post.date)}
        </time>
        <h1 className="mb-4 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
          {post.title}
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">{post.summary}</p>
        <p className="mt-4 text-base text-gray-600">
          By{' '}
          <a
            className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
            href={author.site}
            rel="noreferrer"
          >
            {author.name}
          </a>
        </p>
      </header>
      <div className="prose prose-gray mt-8 max-w-none">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading post...</p>}>
          <PostContent post={post} />
        </Suspense>
      </div>
    </article>
  );
}

function PostContent({ post }: { post: Post }) {
  const Component = use(getPostComponentPromise(post));

  return createElement(Component, { components: mdxComponents });
}

function getPostComponentPromise(post: Post) {
  const cachedPromise = postComponentPromises.get(post.slug);

  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = post.loadComponent();

  postComponentPromises.set(post.slug, promise);

  return promise;
}

export function BlogPostNotFound() {
  return (
    <section className="py-20">
      <p className="text-primary-700 mb-3 text-xs font-bold tracking-[0.12em] uppercase">404</p>
      <h1 className="mb-4 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
        Post not found
      </h1>
      <p className="mb-6 max-w-2xl text-lg text-gray-600">
        This route does not have a matching MDX post.
      </p>
      <Link
        className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
        href={routes.home.href()}
      >
        Return to the post list
      </Link>
    </section>
  );
}
