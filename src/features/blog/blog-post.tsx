import type { MDXContent } from 'mdx/types';
import { createElement, Suspense, use } from 'react';
import { Link } from 'wouter';
import { routes } from '../../routes.js';
import BlogLayout, { blogMdxComponents } from './components/BlogLayout.js';
import { formatPostDate, getPost, readingTimeForPost, type Post } from './posts.js';

const postComponentPromises = new Map<string, Promise<MDXContent>>();

// `onBack`, when provided, intercepts the back affordance so the host can run
// a page transition before navigating (mirrors ProjectPost's `onBack`). When
// absent, BlogTopNavigation falls back to a plain <Link> to /blog.
export function BlogPost({ slug, onBack }: { slug: string; onBack?: () => void }) {
  const post = getPost(slug);

  if (!post) {
    return <BlogPostNotFound />;
  }

  const front = {
    title: post.title,
    dek: post.dek ?? post.summary,
    date: formatPostDate(post.date),
    readingTime: readingTimeForPost(post),
    tags: post.tags,
  };

  return (
    <BlogLayout front={front} onBack={onBack}>
      <Suspense
        fallback={
          <p className="font-mono text-[12px] leading-[20px] text-confetti-black opacity-50">
            Loading post...
          </p>
        }
      >
        <PostContent post={post} />
      </Suspense>
    </BlogLayout>
  );
}

function PostContent({ post }: { post: Post }) {
  const Component = use(getPostComponentPromise(post));

  return createElement(Component, { components: blogMdxComponents });
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

export function prefetchPost(slug: string): void {
  const post = getPost(slug);
  if (post) getPostComponentPromise(post);
}

export function BlogPostNotFound() {
  return (
    <div className="min-h-full w-full bg-washes-paper">
      <div className="relative mx-auto max-w-[1280px] px-[88px]">
        <div className="relative pt-[128px] pb-[128px]">
          <div className="mx-auto flex w-[944px] flex-col items-start gap-[24px] text-confetti-black">
            <p className="font-mono text-[12px] leading-[20px] text-confetti-black opacity-50">
              404
            </p>
            <h1 className="font-kyoto m-0 w-full text-[48px] font-medium leading-[60px]">
              Post not found
            </h1>
            <p className="font-body m-0 max-w-[704px] text-[18px] leading-[30px] text-confetti-black opacity-70">
              This route does not have a matching MDX post.
            </p>
            <Link
              href={routes.blogIndex.href()}
              className="font-body text-confetti-black underline decoration-dotted decoration-from-font [text-underline-position:from-font]"
            >
              Return to the post list
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
