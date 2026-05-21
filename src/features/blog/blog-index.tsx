import { Link } from 'wouter';
import author from '../../../content/author.json';
import { routes } from '../../routes.js';
import { formatPostDate, posts } from './posts.js';
import LandingPage from '../../components/LandingPage';

export function BlogIndex() {
  return (
    <>
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <LandingPage />
      </div>
      <section className="border-b border-gray-200 pb-12">
        <p className="text-primary-700 mb-3 text-xs font-bold tracking-[0.12em] uppercase">
          Personal notes by {author.name}
        </p>
        <h1 className="mb-4 text-5xl leading-none font-bold text-gray-950 sm:text-6xl">
          Minimal MDX Blog
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">
          A small reproduction of the MDX blog shape: a list of posts, the posts themselves, and just
          enough routing to make the URLs useful.
        </p>
      </section>

      <section className="pt-8" aria-labelledby="posts-heading">
        <h2 className="text-2xl font-semibold text-gray-950" id="posts-heading">
          Posts
        </h2>
        <ol className="mt-6 grid list-none gap-5 p-0">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="border-b border-gray-200 py-5">
                <time className="mb-2 block text-sm text-gray-500" dateTime={post.date}>
                  {formatPostDate(post.date)}
                </time>
                <h3 className="mb-2 text-2xl leading-tight font-semibold">
                  <Link
                    className="text-primary-700 decoration-primary-200 hover:text-primary-800 hover:decoration-primary-400 underline"
                    href={routes.blogPost.href({ slug: post.slug })}
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="m-0 text-gray-600">{post.summary}</p>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
