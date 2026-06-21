import Text from './Text.js';

type ColophonProps = {
  colophon?: string[];
  acknowledgements?: string[];
};

const DEFAULT_COLOPHON: string[] = [
  'Typeset in',
  'Kyoto by Pangram Pangram Foundry',
  'Funnel Sans by NORD ID, Kristian Möller',
  'Spline Sans Mono by Eben Sorkin, Mirko Velimirović',
];

const DEFAULT_ACKNOWLEDGEMENTS: string[] = [
  'Many thanks to Kris Baumgartner, Matt D. Smith,',
  'Frank Albenesius, Jason Tasso, Kacper Bierylo,',
];

export default function Colophon({
  colophon = DEFAULT_COLOPHON,
  acknowledgements = DEFAULT_ACKNOWLEDGEMENTS,
}: ColophonProps) {
  return (
    <div className="flex gap-[16px] items-start text-white">
      <div className="flex flex-col gap-[24px] items-start py-[120px] w-[384px] shrink-0">
        <Text variant="headline-small" className="w-full">Colophon</Text>
        <div className="type-tag w-full">
          {colophon.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[24px] items-start py-[120px] w-[384px] shrink-0">
        <Text variant="headline-small" className="w-full">Acknowledgements</Text>
        <div className="type-tag w-full">
          {acknowledgements.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
