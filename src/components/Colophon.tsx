import { ArrowUpRight } from 'lucide-react';
import {
  colophon as DEFAULT_COLOPHON,
  acknowledgements as DEFAULT_ACKNOWLEDGEMENTS,
  coDevelopedTag as DEFAULT_CO_DEVELOPED_TAG,
} from '../../content/footer.js';
import Text from './Text.js';

type ColophonProps = {
  // Each block is a single flowing paragraph in the Figma — strings,
  // not arrays. Author-overridable via these props.
  colophon?: string;
  acknowledgements?: string;
  coDevelopedTag?: string;
};

// © year — live so the footer rolls forward automatically.
const CURRENT_YEAR = new Date().getFullYear();

// "Last Updated" stamp values are injected at build time by vite.config.ts
// `define` from the latest git commit. Empty strings indicate the build
// didn't have access to git metadata (e.g. tarball install) — in that
// case we render the © year on its own without the link.
const LAST_UPDATED_DATE = __LAST_UPDATED__;
const LAST_COMMIT_SHA = __LAST_COMMIT_SHA__;
const COMMIT_URL =
  LAST_COMMIT_SHA && __REPO_URL__ ? `${__REPO_URL__}/commit/${LAST_COMMIT_SHA}` : null;

// Footer layout: 12-col grid, two rows. Each row has two cells —
//   row 1: Colophon (col 2–6) + Acknowledgements (col 7–11)
//   row 2: © / Last Updated (col 2–6) + Co-developed tag (col 7–11)
// Col 1 + col 12 are gutters. All text is text-align: left (the right
// column is left-aligned within its own column, not flush-right against
// the grid edge).
export default function Colophon({
  colophon = DEFAULT_COLOPHON,
  acknowledgements = DEFAULT_ACKNOWLEDGEMENTS,
  coDevelopedTag = DEFAULT_CO_DEVELOPED_TAG,
}: ColophonProps) {
  return (
    <div className="text-white/75 grid w-full grid-cols-12 gap-x-[16px] gap-y-[48px] py-[120px] text-left">
      {/* Row 1 — body columns */}
      <div className="col-span-5 col-start-2 flex flex-col items-start gap-[24px]">
        <Text variant="headline-small" className="w-full">
          Colophon
        </Text>
        <p className="type-tag m-0 w-full">{colophon}</p>
      </div>
      <div className="col-span-5 col-start-7 flex flex-col items-start gap-[24px]">
        <Text variant="headline-small" className="w-full">
          Acknowledgements
        </Text>
        <p className="type-tag m-0 w-full">{acknowledgements}</p>
      </div>

      {/* Row 2 — metadata. Left: © year + Last Updated link to the
          latest commit. Right: co-development tag. */}
      <p className="type-tag col-span-5 col-start-2 m-0">
        <span>© {CURRENT_YEAR}</span>
        {LAST_UPDATED_DATE ? (
          <>
            <span aria-hidden> · </span>
            <span>Last Updated on </span>
            {COMMIT_URL ? (
              <a
                href={COMMIT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="decoration-from-font [text-underline-position:from-font] inline-flex items-baseline gap-[2px] underline decoration-dotted"
              >
                {LAST_UPDATED_DATE}
                <ArrowUpRight size={12} strokeWidth={1.6} aria-hidden />
              </a>
            ) : (
              <span>{LAST_UPDATED_DATE}</span>
            )}
            <span>.</span>
          </>
        ) : null}
      </p>
      <p className="type-tag col-span-5 col-start-7 m-0">{coDevelopedTag}</p>
    </div>
  );
}
