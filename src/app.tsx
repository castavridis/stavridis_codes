import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { routes } from './routes.js';
import { useRadialReveal } from './components/useRadialReveal';

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
    <main>
      <Suspense fallback={<RoutePending />}>
        <Switch>
          <Route path={routes.home.path} component={BlogIndex} />
          <Route path={routes.blogPost.path}>{(params) => <BlogPostRoute slug={params.slug} />}</Route>
          <Route component={BlogPostNotFound} />
        </Switch>
      </Suspense>
    </main>
  );
}

// Wraps the post in the same cream radial transition the landing page uses, so
// "Back to posts" fades home from the cursor instead of cutting instantly.
function BlogPostRoute({ slug }: { slug: string }) {
  const { start, overlay } = useRadialReveal();
  return (
    <>
      <BlogPost slug={slug} onBack={() => start(routes.home.href())} />
      {overlay}
    </>
  );
}

function RoutePending() {
  return <p className="text-sm text-gray-500">Loading...</p>;
}
