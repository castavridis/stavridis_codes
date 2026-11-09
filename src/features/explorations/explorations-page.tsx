import { Link } from 'wouter';
import Button from '../../components/Button.js';
import { routes } from '../../routes.js';
import { ALL_CELLS, ExplorationGrid } from './explorations-grid.js';

// /explorations — the full Recent Design Explorations wall. Rides the same
// SheetOverlay as the blog (landing stays mounted beneath), and mirrors the
// BlogIndex chrome: washes-paper background, mono eyebrow + Back to home,
// Kyoto title, then the 944px six-column grid.
export function ExplorationsPage() {
  return (
    <div className="min-h-full w-full bg-washes-paper">
      <div className="mx-auto w-full max-w-[944px] px-[16px] pt-[64px] pb-[128px] md:box-content md:px-[88px] md:pt-[128px]">
        <div className="flex w-full flex-col items-start gap-[48px] md:gap-[64px]">
          <header className="flex w-full items-center gap-[24px]">
            <p className="font-mono min-w-0 flex-1 text-[12px] leading-[20px] text-confetti-black opacity-50">
              Playground
            </p>
            <Link href={routes.home.href()}>
              <Button variant="outline" label="Back to home" />
            </Link>
          </header>

          <h1 className="font-kyoto m-0 w-full text-[36px] font-medium leading-[44px] text-confetti-black md:text-[48px] md:leading-[60px]">
            Recent Explorations
          </h1>

          <div className="w-full">
            <ExplorationGrid cells={ALL_CELLS} />
          </div>
        </div>
      </div>
    </div>
  );
}
