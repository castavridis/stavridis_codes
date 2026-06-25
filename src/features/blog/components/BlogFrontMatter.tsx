import Text from '../../../components/Text.js';
import BlogTopNavigation from './BlogTopNavigation.js';

type BlogFrontMatterProps = {
  title: string;
  // Long-form subtitle. Falls back to the post's summary when the author
  // hasn't written a distinct dek.
  dek: string;
  // Already-formatted date string (see formatPostDate in posts.ts).
  date: string;
  // E.g. "5 min read".
  readingTime: string;
  tags?: string;
  onBack?: () => void;
};

// The text-first analogue of the project chrome's <FrontMatter>: top nav,
// title (PP Kyoto Medium 48/60), dek (Funnel Sans 24/32), and a meta line
// pairing the date with reading time in Spline Sans Mono 12/20.
export default function BlogFrontMatter({
  title,
  dek,
  date,
  readingTime,
  tags,
  onBack,
}: BlogFrontMatterProps) {
  return (
    <div className="flex w-[944px] flex-col items-start gap-[84px]">
      <BlogTopNavigation tags={tags} onBack={onBack} />
      <div className="flex w-full flex-col items-start gap-[24px] text-confetti-black">
        <Text variant="tag" className="m-0 text-confetti-black opacity-50">
          <time dateTime={date}>{date}</time>
          <span className="px-[8px]">·</span>
          <span>{readingTime}</span>
        </Text>
        <div className="flex w-full flex-col items-start gap-[16px]">
          <Text variant="headline" as="h1" className="m-0 w-full">{title}</Text>
          <Text variant="copy-large" className="m-0 max-w-[704px]">
            {dek}
          </Text>
        </div>
      </div>
    </div>
  );
}
