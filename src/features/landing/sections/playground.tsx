// ---------------------------------------------------------------------------
// Playground — Figma node 4213:16301. A bento-masonry wall of creative
// experiments. Captions are intentionally omitted (every tile's Details/Preview
// layers are hidden in the design); each tile is a pure visual, with any text
// baked into the artwork itself.
//
// Layout: a single 6-column grid (col = 144px, 16px gap → 944px content width).
// Every tile carries an `aspect-[w/h]` matching its Figma slot, so within a
// fixed-width desktop grid the row heights self-align (each row's spans sum to
// 6 and its tiles share a height). On mobile the grid collapses to one column
// and tiles stack in source order at their natural aspect ratio.
//
// Assets live under /public/images/playground/ and are named to match their
// Figma frame. Videos ship a `{name}-thumb.png` poster and play on hover
// (preload="none") so the heavy source — washes-facets-motion.mp4 is ~44MB —
// is only fetched on interaction, not at page load.
// ---------------------------------------------------------------------------

import Text from '../../../components/Text.js';

const ASSET = '/images/playground/';

type Media =
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'video'; src: string; poster: string; label: string; objectClass: string };

// A single visual within a cell. `aspect` matches the Figma slot (w/h) so the
// desktop grid derives the correct height from the cell's column width.
// `bg` overrides the tile's fill (defaults to a faint neutral). Useful when a
// clip is object-contain and its letterbox should match the artwork.
type Slot = { aspect: string; media: Media; bg?: string };

// A grid cell. `span` is the md+ column span (mobile is always full-width).
// Most cells hold one slot; a cell with multiple slots is a vertical stack
// sized so its total height matches the taller neighbour in the same row.
type Cell = { id: string; span: string; slots: Slot[] };

const img = (file: string, alt: string): Media => ({ kind: 'image', src: ASSET + file, alt });
// `objectClass` sets the video's object-fit (defaults to object-cover; pass
// e.g. 'object-fill' to stretch a clip to its slot instead of cropping).
const video = (name: string, label: string, objectClass = 'object-cover'): Media => ({
  kind: 'video',
  src: `${ASSET}${name}.mp4`,
  poster: `${ASSET}${name}-thumb.png`,
  label,
  objectClass,
});

// Ordered exactly as the design reads top-to-bottom, left-to-right. Each row's
// spans sum to 6; `aspect` values are the Figma slot dimensions.
const CELLS: Cell[] = [
  // Row 1 — pmndrs design-system explorations (three ⅓ tiles)
  { id: 'pmndrs-type-test', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/265]', media: img('pmndrs-type-test.png', 'pmndrs type-scale test') }] },
  { id: 'pmndrs-navigation-menu-test', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/265]', media: img('pmndrs-navigation-menu-test.png', 'pmndrs navigation-menu test') }] },
  { id: 'pmndrs-hover-test', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/265]', media: img('pmndrs-hover-test.png', 'pmndrs hover-state test') }] },

  // Row 2 — three square tiles
  { id: 'washes-facets', span: 'md:col-span-2', slots: [{ aspect: 'aspect-square', media: img('washes-facets.png', 'Washes + facets') }] },
  { id: 'washes-demo', span: 'md:col-span-2', slots: [{ aspect: 'aspect-square', media: img('washes-demo.png', 'Washes demo') }] },
  { id: 'pang-ping', span: 'md:col-span-2', slots: [{ aspect: 'aspect-square', media: img('pang-ping.png', 'Pang Ping') }] },

  // Row 3 — two half-width tiles (left is a motion demo)
  { id: 'washes-facets-motion', span: 'md:col-span-3', slots: [{ aspect: 'aspect-[464/368]', media: video('washes-facets-motion', 'Washes + facets motion study') }] },
  { id: 'facets-bookmarklet', span: 'md:col-span-3', slots: [{ aspect: 'aspect-[464/368]', media: img('facets-bookmarklet.png', 'facets bookmarklet') }] },

  // Row 4 — type-system tile (⅔) + a ⅓ stack (3D crystal over landing), the
  // stack (146 + 16 + 316 = 478) matches the type-system tile's height.
  { id: 'facets-type-system', span: 'md:col-span-4', slots: [{ aspect: 'aspect-[624/478]', media: img('facets-type-system.png', 'facets type system') }] },
  {
    id: 'facets-stack',
    span: 'md:col-span-2',
    slots: [
      { aspect: 'aspect-[304/146]', media: video('facets-3d-crystal', 'facets 3D crystal', 'object-contain'), bg: 'bg-[#111111]' },
      { aspect: 'aspect-[304/316]', media: img('facets-landing.png', 'facets landing page') },
    ],
  },

  // Row 5 — Nathan Draws (logo + English + Spanish)
  { id: 'nathan-draws-logo', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/171]', media: img('nathan-draws-logo.png', 'Nathan Draws logo') }] },
  { id: 'nathan-draws-english-title', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/171]', media: img('nathan-draws-english-title.png', 'Nathan Draws — English') }] },
  { id: 'nathan-draws-spanish-title', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/171]', media: img('nathan-draws-spanish-title.png', 'Nathan Draws — Spanish') }] },

  // Row 6 — three rain-check screens
  { id: 'rain-check-1', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/382]', media: img('rain-check-1-form-elements.png', 'Rain Check — form elements') }] },
  { id: 'rain-check-2', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/382]', media: img('rain-check-2-progress-bar.png', 'Rain Check — progress bar') }] },
  { id: 'rain-check-3', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/382]', media: img('rain-check-3-potential-rain-check.png', 'Rain Check — potential rain check') }] },

  // Row 7 — confetti UI (⅓) + confetti start screen (⅔)
  { id: 'confetti-ui', span: 'md:col-span-2', slots: [{ aspect: 'aspect-[304/316]', media: img('confetti-ui.png', 'Confetti UI') }] },
  { id: 'confetti-start-screen', span: 'md:col-span-4', slots: [{ aspect: 'aspect-[624/316]', media: img('confetti-start-screen.png', 'Confetti start screen') }] },

  // Row 8 — pocket pikatama (⅔) + codepen fortune (⅓)
  { id: 'pocket-pika-tama', span: 'md:col-span-4', slots: [{ aspect: 'aspect-[624/304]', media: img('pocket-pika-tama.png', 'Pocket Pikatama — 3D render') }] },
  { id: 'codepen-fortune', span: 'md:col-span-2', slots: [{ aspect: 'aspect-square', media: img('codepen-fortune.png', 'CodePen — fortune') }] },

  // Row 9 — wompshop (½) + sun buddy (½), both motion
  { id: 'wompshop', span: 'md:col-span-3', slots: [{ aspect: 'aspect-[464/304]', media: video('wompshop', 'wompshop mask tool') }] },
  { id: 'sun-buddy', span: 'md:col-span-3', slots: [{ aspect: 'aspect-[464/304]', media: video('sun-buddy', 'sun buddy') }] },
];

// Video tile — autoplays a muted loop, with its poster ({name}-thumb.png)
// shown as the fallback until the first frame is ready (and if autoplay is
// blocked or the source fails to load).
function VideoTile({ media }: { media: Extract<Media, { kind: 'video' }> }): React.ReactElement {
  return (
    <video
      src={media.src}
      poster={media.poster}
      aria-label={media.label}
      className={`block size-full ${media.objectClass}`}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

function MediaSlot({ media }: { media: Media }): React.ReactElement {
  if (media.kind === 'video') return <VideoTile media={media} />;
  return <img src={media.src} alt={media.alt} loading="lazy" decoding="async" className="block size-full object-cover" />;
}

function TileCell({ cell }: { cell: Cell }): React.ReactElement {
  return (
    <div className={`flex flex-col gap-[16px] ${cell.span}`}>
      {cell.slots.map((slot, i) => (
        <div key={i} className={`relative w-full overflow-hidden rounded-[8px] ${slot.bg ?? 'bg-confetti-black/[0.03]'} ${slot.aspect}`}>
          <MediaSlot media={slot.media} />
        </div>
      ))}
    </div>
  );
}

export function Playground(): React.ReactElement {
  return (
    <section className="w-full max-w-[944px] px-[16px] md:px-0">
      <div className="mb-[24px]">
        <Text variant="headline-small" className="text-[#251900]">
          Playground
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-6">
        {CELLS.map((cell) => (
          <TileCell key={cell.id} cell={cell} />
        ))}
      </div>
    </section>
  );
}
