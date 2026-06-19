import { Link } from 'wouter';
import Button from '../../components/Button.js';
import { routes } from '../../routes.js';
import { formatPostDate, posts, readingTimeForPost, type Post } from './posts.js';

// Blog index — list of posts on /blog. Visual language matches the landing
// page's Featured Work grid: cream-paper background, Funnel Sans 24/32 for
// titles, Spline Sans Mono 12/20 for metadata. The page sits inside the same
// 944px column the project chrome uses, so navigating between landing → blog
// → post is dimensionally continuous.
export function BlogIndex() {
  return (
    <div className="min-h-full w-full bg-washes-paper">
      <div className="relative mx-auto max-w-[1280px] px-[88px]">
        <div className="relative pt-[128px] pb-[128px]">
          <div className="mx-auto flex w-[944px] flex-col items-start gap-[64px]">
            <header className="flex w-full items-center gap-[24px]">
              <p className="font-mono flex-1 min-w-0 text-[12px] leading-[20px] text-confetti-black opacity-50">
                Notes &amp; essays
              </p>
              <Link href={routes.home.href()}>
                <Button variant="outline" label="Back to home" />
              </Link>
            </header>

            <div className="flex w-full flex-col items-start gap-[16px] text-confetti-black">
              <h1 className="font-kyoto m-0 w-full text-[48px] font-medium leading-[60px]">
                Writing
              </h1>
              <p className="font-body m-0 max-w-[704px] text-[24px] font-normal leading-[32px]">
                Short notes on engineering, design systems, and the projects
                that surround them.
              </p>
            </div>

            {posts.length === 0 ? (
              <p className="font-body text-[18px] leading-[30px] text-confetti-black opacity-60">
                No posts yet.
              </p>
            ) : (
              <ul className="flex w-full flex-col gap-0">
                {posts.map((post, i) => (
                  <PostListItem
                    key={post.slug}
                    post={post}
                    showDivider={i < posts.length - 1}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostListItem({ post, showDivider }: { post: Post; showDivider: boolean }) {
  const dek = post.dek ?? post.summary;
  const readingTime = readingTimeForPost(post);

  return (
    <li
      className={`w-full ${showDivider ? 'border-b border-confetti-black/15' : ''}`}
    >
      <Link
        href={routes.blogPost.href({ slug: post.slug })}
        className="group flex w-full flex-col gap-[12px] py-[32px]"
      >
        <p className="font-mono text-[12px] leading-[20px] text-confetti-black opacity-50">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span className="px-[8px]">·</span>
          <span>{readingTime}</span>
          {post.tags ? (
            <>
              <span className="px-[8px]">·</span>
              <span>{post.tags}</span>
            </>
          ) : null}
        </p>
        <p className="font-body w-full text-[24px] leading-[32px] text-confetti-black transition-opacity group-hover:opacity-80">
          {post.title}
        </p>
        <p className="font-body max-w-[704px] text-[18px] leading-[30px] text-confetti-black opacity-70">
          {dek}
        </p>
      </Link>
    </li>
  );
}
