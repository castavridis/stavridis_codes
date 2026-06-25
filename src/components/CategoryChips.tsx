import { Fragment } from 'react';

type CategoryChipsProps = {
  categories: string[];
};

export default function CategoryChips({ categories }: CategoryChipsProps) {
  return (
    <span className="inline-flex items-center gap-[6px] font-mono font-normal text-[12px] leading-[20px] text-caresignal-none">
      {categories.map((category, i) => (
        <Fragment key={`${category}-${i}`}>
          {i > 0 ? <span aria-hidden>·</span> : null}
          <span>{category}</span>
        </Fragment>
      ))}
    </span>
  );
}
