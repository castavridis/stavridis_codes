import MDXLayout from '../projects/components/MDXLayout.js';
import { ALL_CELLS, ExplorationGrid } from './explorations-grid.js';

// /explorations — the full Creative Explorations wall. Rides the same
// SheetOverlay as the case studies and renders through the case-study chrome
// (MDXLayout): white sheet surface, sticky chrome row (tags left, Close
// right, headline fading in on scroll) and the FrontMatter headline block.
// The 944px six-column grid sits 72px below the front matter — the same gap
// a case study's first section takes.
const FRONT = {
  headline: 'Recent Explorations',
  introduction: '',
  tags: 'Playground',
};

export function ExplorationsPage({ onClose }: { onClose: () => void }) {
  return (
    <MDXLayout front={FRONT} onClose={onClose} scopeId="explorations">
      <div className="mt-[72px] w-full max-w-[944px]">
        <ExplorationGrid cells={ALL_CELLS} />
      </div>
    </MDXLayout>
  );
}
