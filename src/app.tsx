import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { routes } from './routes.js';
import { TransitionProvider, useTransition } from './components/RadialTransition';
import { Analytics } from "@vercel/analytics/next"

const BlogIndex = lazy(() =>
  import('./features/blog/blog-index.js').then((module) => ({ default: module.BlogIndex }))
);

const BlogPost = lazy(() =>
  import('./features/blog/blog-post.js').then((module) => ({ default: module.BlogPost }))
);

const BlogPostNotFound = lazy(() =>
  import('./features/blog/blog-post.js').then((module) => ({ default: module.BlogPostNotFound }))
);

export function App() {
  return (
    <TransitionProvider>
      <main className="font-light color-[#251900]">
        <Suspense fallback={<RoutePending />}>
          <Switch>
            <Route path={routes.home.path} component={BlogIndex} />
            <Route path={routes.blogPost.path}>
              {(params) => <BlogPostRoute slug={params.slug} />}
            </Route>
            <Route component={BlogPostNotFound} />
          </Switch>
        </Suspense>
      </main>
      <Analytics />
    </TransitionProvider>
  );
}

// Lets the post's "Back to posts" run the same cream radial transition home,
// instead of cutting instantly.
function BlogPostRoute({ slug }: { slug: string }) {
  const { start } = useTransition();
  return <BlogPost slug={slug} onBack={() => start(routes.home.href())} />;
}

function RoutePending() {
  return <p className="text-sm text-gray-500">Loading...</p>;
}
