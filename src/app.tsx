import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { routes } from './routes.js';

const BlogIndex = lazy(() =>
  import('./features/blog/blog-index.js').then((module) => ({ default: module.BlogIndex }))
);

const BlogPost = lazy(() =>
  import('./features/blog/blog-post.js').then((module) => ({ default: module.BlogPost }))
);

const BlogPostNotFound = lazy(() =>
  import('./features/blog/blog-post.js').then((module) => ({ default: module.BlogPostNotFound }))
);

const ProjectSolLewitt = lazy(() => import('./features/projects/sol-lewitt.js'));

export function App() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:py-20">
      <Suspense fallback={<RoutePending />}>
        <Switch>
          <Route path={routes.home.path} component={BlogIndex} />
          <Route path={routes.blogPost.path}>{(params) => <BlogPost slug={params.slug} />}</Route>
          <Route path={routes.projectSolLewitt.path} component={ProjectSolLewitt} />
          <Route component={BlogPostNotFound} />
        </Switch>
      </Suspense>
    </main>
  );
}

function RoutePending() {
  return <p className="text-sm text-gray-500">Loading...</p>;
}
