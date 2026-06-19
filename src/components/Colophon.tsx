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
        <p className="font-kyoto font-medium text-[24px] leading-[32px] w-full">Colophon</p>
        <div className="font-mono font-normal text-[12px] leading-[20px] w-full">
          {colophon.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[24px] items-start py-[120px] w-[384px] shrink-0">
        <p className="font-kyoto font-medium text-[24px] leading-[32px] w-full">Acknowledgements</p>
        <div className="font-mono font-normal text-[12px] leading-[20px] w-full">
          {acknowledgements.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
