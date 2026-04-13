import { Link } from "react-router-dom";

const sizes = {
  sm: { text: "text-[1.35rem] leading-none", gap: "gap-2", img: "h-9 w-9" },
  md: { text: "text-[1.65rem] leading-none", gap: "gap-2.5", img: "h-11 w-11" },
  lg: {
    text: "text-4xl sm:text-5xl leading-[0.95]",
    gap: "gap-3 sm:gap-4",
    img: "h-14 w-14 sm:h-16 sm:w-16",
  },
};

type Props = {
  size?: keyof typeof sizes;
  className?: string;
  /** null = sem link (ex.: login hero) */
  to?: string | null;
};

export function BrandLogo({ size = "md", className = "", to = "/" }: Props) {
  const s = sizes[size];
  const inner = (
    <span
      className={`inline-flex items-center ${s.gap} ${className}`}
      aria-label="Fit Flow"
    >
      <img
        src="/fit-flow-mark.svg"
        alt=""
        width={64}
        height={64}
        className={`${s.img} shrink-0 rounded-2xl shadow-sm`}
      />
      <span
        className={`font-display tracking-[0.04em] text-ink uppercase ${s.text}`}
      >
        FIT FLOW
      </span>
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="focus-ring inline-flex rounded-xl"
      >
        {inner}
      </Link>
    );
  }
  return <span className="inline-flex">{inner}</span>;
}
