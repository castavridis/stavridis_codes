import { Link } from 'wouter';
import Button from '../../../components/Button.js';
import Text from '../../../components/Text.js';
import { routes } from '../../../routes.js';

type BlogTopNavigationProps = {
  tags?: string;
  // When provided, the back affordance is a button (used by the sheet overlay
  // host to run a transition before navigation). When absent, we render a
  // standard wouter <Link> to /blog so the chrome works standalone.
  onBack?: () => void;
};

// Blog analogue of the project chrome's TopNavigation: the meta strip at the
// top of a post showing tags on the left and a back affordance on the right.
// Width and spacing mirror FrontMatter's 944px column so the two chromes
// align when navigating between project and blog views.
export default function BlogTopNavigation({ tags, onBack }: BlogTopNavigationProps) {
  return (
    <div className="flex w-[944px] items-center gap-[24px] overflow-clip">
      <Text variant="tag" className="flex-1 min-w-0 text-confetti-black opacity-50">
        {tags ?? ''}
      </Text>
      {onBack ? (
        <Button variant="outline" label="Back to posts" onClick={onBack} />
      ) : (
        <Link href={routes.blogIndex.href()}>
          <Button variant="outline" label="Back to posts" />
        </Link>
      )}
    </div>
  );
}
