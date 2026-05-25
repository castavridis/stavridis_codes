import { Link } from 'wouter';
import author from '../../../content/author.json';
import { routes } from '../../routes.js';
import { formatPostDate, posts } from './posts.js';
import PageTransitionWrapper from '../../components/PageTransitionWrapper';

export function BlogIndex() {
  return (
    <>
      <div className="relative left-1/2 w-screen -translate-x-1/2">
        <PageTransitionWrapper />
      </div>
    </>
  );
}
