// ---------------------------------------------------------------------------
// Playground — Figma node 4213:16301. A bento-masonry wall of ~19 creative
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
// Most tiles are bespoke visuals (illustrations, 3D renders, app-UI mockups)
// exported from Figma as assets under /public/images/playground/. Until an
// asset lands, a tile renders a labeled placeholder naming the file to export.
// The four tiles at the bottom (pocket pikatama, codepen, wompshop, sun buddy)
// already have real media and render live.
// ---------------------------------------------------------------------------

import Text from '../../../components/Text.js';

// The media a slot renders. `placeholder` is the pre-asset state — a dashed
// box naming the file to drop into /public/images/playground/.
type Media =
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'video'; src: string }
  | { kind: 'embed'; src: string; title: string }
  | { kind: 'placeholder'; file: string };

// A single visual within a cell. `aspect` matches the Figma slot (w/h) so the
// desktop grid derives the correct height from the cell's column width.
type Slot = {
  aspect: string;
  // Tint behind the media — visible while it loads and in any letterboxing.
  bg: string;
  media: Media;
};

// A grid cell. `span` is the md+ column span (mobile is always full-width).
// Most cells hold one slot; a cell with multiple slots is a vertical stack
// (sized so the stack height matches the taller neighbor in its row).
type Cell = {
  id: string;
  span: string;
  slots: Slot[];
};

const PLACEHOLDER_BG = 'bg-confetti-black/[0.035]';

// Ordered exactly as the design reads top-to-bottom, left-to-right. Each row's
// spans sum to 6. `aspect` values are the Figma slot dimensions.
const CELLS: Cell[] = [
  // Row 1 — blog proposal (⅓) + pmndrs Refraction showcase (⅔)
  {
    id: 'blog-post-proposal',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/265]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'blog-post-proposal.webp' } }],
  },
  {
    id: 'pmndrs-refraction',
    span: 'md:col-span-4',
    slots: [{ aspect: 'aspect-[624/265]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'pmndrs-refraction.webp' } }],
  },

  // Row 2 — three square tiles
  {
    id: 'screenshot-a',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-square', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'screenshot-a.webp' } }],
  },
  {
    id: 'screenshot-b',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-square', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'screenshot-b.webp' } }],
  },
  {
    id: 'fat-apple',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-square', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'fat-apple.webp' } }],
  },

  // Row 3 — two half-width tiles
  {
    id: 'washes-facets',
    span: 'md:col-span-3',
    slots: [{ aspect: 'aspect-[464/368]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'washes-facets.webp' } }],
  },
  {
    id: 'facets-app-frame',
    span: 'md:col-span-3',
    slots: [{ aspect: 'aspect-[464/368]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'facets-app-frame.webp' } }],
  },

  // Row 4 — base palette (⅔) + a ⅓ stack (research over intro), stack height
  // (146 + 16 + 316 = 478) matches the base-palette tile.
  {
    id: 'facets-base-palette',
    span: 'md:col-span-4',
    slots: [{ aspect: 'aspect-[624/478]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'facets-base-palette.webp' } }],
  },
  {
    id: 'facets-stack',
    span: 'md:col-span-2',
    slots: [
      // facets.mp4 (user-provided) — the short slot directly below the facets
      // collector. Object-cover crops the landscape recording to this slot.
      { aspect: 'aspect-[304/146]', bg: 'bg-[#191716]', media: { kind: 'video', src: '/images/playground/facets.mp4' } },
      { aspect: 'aspect-[304/316]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'facets-intro.webp' } },
    ],
  },

  // Row 5 — Nathan Draws: title + English + Spanish
  {
    id: 'nathan-title',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/171]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'nathan-draws-title.webp' } }],
  },
  {
    id: 'nathan-english',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/171]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'nathan-draws-english.webp' } }],
  },
  {
    id: 'nathan-spanish',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/171]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'nathan-draws-spanish.webp' } }],
  },

  // Row 6 — three raincheck / facets app screens
  {
    id: 'raincheck-note',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/382]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'raincheck-note.webp' } }],
  },
  {
    id: 'raincheck-checklist',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/382]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'raincheck-checklist.webp' } }],
  },
  {
    id: 'raincheck-canceled',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/382]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'raincheck-canceled.webp' } }],
  },

  // Row 7 — a ⅓ tile + a ⅔ tile (content TBC — confirm with design)
  {
    id: 'tile-4214-17879',
    span: 'md:col-span-2',
    slots: [{ aspect: 'aspect-[304/316]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'tile-4214-17879.webp' } }],
  },
  {
    id: 'tile-4213-16988',
    span: 'md:col-span-4',
    slots: [{ aspect: 'aspect-[624/316]', bg: PLACEHOLDER_BG, media: { kind: 'placeholder', file: 'tile-4213-16988.webp' } }],
  },

  // Row 8 — pocket pikatama (⅔) + CodePen embed (⅓). The pikatama image was
  // present pre-reset (as a 10 MB PNG) but is gone now — re-export it as an
  // optimized WebP. The CodePen embed needs no asset and renders live.
  {
    id: 'pocket-pikatama',
    span: 'md:col-span-4',
    slots: [{ aspect: 'aspect-[624/304]', bg: 'bg-[#211e1f]', media: { kind: 'placeholder', file: 'pocket-pikatama.webp' } }],
  },
  {
    id: 'codepen-eayorpz',
    span: 'md:col-span-2',
    slots: [
      {
        aspect: 'aspect-square',
        bg: 'bg-[#191716]',
        media: { kind: 'embed', src: 'https://codepen.io/castavridis/embed/EayoRPZ?default-tab=result', title: 'CodePen — castavridis/EayoRPZ' },
      },
    ],
  },

  // Row 9 — wompshop (½) + sun buddy (½). Both videos were present pre-reset
  // and need re-providing.
  {
    id: 'wompshop-mask-tool',
    span: 'md:col-span-3',
    slots: [{ aspect: 'aspect-[464/304]', bg: 'bg-[#1a1aff]', media: { kind: 'placeholder', file: 'wompshop-mask-tool.mp4' } }],
  },
  {
    id: 'sun-buddy',
    span: 'md:col-span-3',
    slots: [{ aspect: 'aspect-[464/304]', bg: 'bg-washes-hansa-yellow', media: { kind: 'placeholder', file: 'sun-buddy.mp4' } }],
  },
];

function MediaSlot({ media }: { media: Media }): React.ReactElement {
  switch (media.kind) {
    case 'image':
      return <img src={media.src} alt={media.alt} loading="lazy" decoding="async" className="block size-full object-cover" />;
    case 'video':
      return <video src={media.src} className="block size-full object-cover" autoPlay loop muted playsInline aria-hidden="true" />;
    case 'embed':
      return (
        <iframe
          src={media.src}
          title={media.title}
          className="block size-full"
          loading="lazy"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      );
    case 'placeholder':
      return (
        <div className="flex size-full items-center justify-center border border-dashed border-confetti-black/20 p-[12px]">
          <span className="text-confetti-black/40 text-center font-mono text-[11px] leading-[16px] break-all select-none">
            {media.file}
          </span>
        </div>
      );
  }
}

function TileCell({ cell }: { cell: Cell }): React.ReactElement {
  return (
    <div className={`flex flex-col gap-[16px] ${cell.span}`}>
      {cell.slots.map((slot, i) => (
        <div
          key={i}
          className={`relative w-full overflow-hidden rounded-[8px] ${slot.aspect} ${slot.bg}`}
        >
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
