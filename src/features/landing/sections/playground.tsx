// ---------------------------------------------------------------------------
// Playground — the landing's "Creative Explorations" section. Shows the
// curated LANDING_CELLS set (five tiles) followed by a View more button that
// opens the full wall on /explorations. Tile data and renderers live in
// features/explorations/explorations-grid.tsx.
// ---------------------------------------------------------------------------

import { useLocation } from 'wouter';

import Button from '../../../components/Button.js';
import Text from '../../../components/Text.js';
import { routes } from '../../../routes.js';
import { ExplorationGrid, LANDING_CELLS } from '../../explorations/explorations-grid.js';

export function Playground(): React.ReactElement {
  const [, navigate] = useLocation();
  return (
    <section className="w-full max-w-[944px] px-[16px] md:px-0">
      <div className="mb-[24px]">
        <Text variant="headline-small" className="text-[#251900]">
          Creative Explorations
        </Text>
      </div>
      <ExplorationGrid cells={LANDING_CELLS} />
      <div className="mt-[24px] flex justify-center">
        <Button variant="outline" label="View more" onClick={() => navigate(routes.explorations.href())} />
      </div>
    </section>
  );
}
