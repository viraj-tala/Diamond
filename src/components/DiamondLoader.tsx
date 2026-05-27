import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  label?: string;
  fullPage?: boolean;
  className?: string;
}

export function DiamondLoader({ size = 64, label, fullPage = false, className }: Props) {
  const w = size * 0.85;
  const h = size * 1.2;

  const inner = (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ perspective: `${size * 9}px` }}
      >
        {/* Diamond — spins on Y axis with implied lighting */}
        <div
          className="relative animate-spin3d"
          style={{ transformStyle: "preserve-3d", width: w, height: h }}
        >
          <svg
            viewBox="0 0 100 140"
            width={w}
            height={h}
            aria-hidden="true"
            className="block"
          >
            <defs>
              {/* Table reflection — brightest, sunlit */}
              <linearGradient id="lustraDF-table" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.6" />
              </linearGradient>
              {/* Crown left — cooler indigo wash */}
              <linearGradient id="lustraDF-cl" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
              </linearGradient>
              {/* Crown right — warm magenta highlight */}
              <linearGradient id="lustraDF-cr" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
              </linearGradient>
              {/* Pavilion left — deep shadow */}
              <linearGradient id="lustraDF-pl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0d0d18" stopOpacity="0.95" />
              </linearGradient>
              {/* Pavilion right — caught cyan light */}
              <linearGradient id="lustraDF-pr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#181828" stopOpacity="0.9" />
              </linearGradient>
              {/* Full prism for the orbiting highlight */}
              <linearGradient id="lustraD-prism" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Table reflection (brightest, top) */}
            <polygon points="35,25 65,25 50,40" fill="url(#lustraDF-table)" />

            {/* Crown left */}
            <polygon
              points="35,25 50,40 50,60 15,60"
              fill="url(#lustraDF-cl)"
            />

            {/* Crown right */}
            <polygon
              points="65,25 50,40 50,60 85,60"
              fill="url(#lustraDF-cr)"
            />

            {/* Pavilion left */}
            <polygon points="15,60 50,60 50,130" fill="url(#lustraDF-pl)" />

            {/* Pavilion right */}
            <polygon points="85,60 50,60 50,130" fill="url(#lustraDF-pr)" />

            {/* Facet edge lines — the sharp creases between facets */}
            <path
              d="M35 25 L65 25 M35 25 L15 60 M65 25 L85 60 M15 60 L85 60 M50 40 L50 60 M50 60 L50 130 M15 60 L50 130 M85 60 L50 130"
              stroke="white"
              strokeOpacity="0.45"
              strokeWidth="0.45"
              fill="none"
              strokeLinejoin="round"
            />

            {/* Outer silhouette — bright */}
            <polygon
              points="35,25 65,25 85,60 50,130 15,60"
              fill="none"
              stroke="white"
              strokeOpacity="0.9"
              strokeWidth="0.55"
              strokeLinejoin="round"
            />

            {/* Travelling prism highlight that orbits the perimeter */}
            <polygon
              points="35,25 65,25 85,60 50,130 15,60"
              fill="none"
              stroke="url(#lustraD-prism)"
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="0.3 1"
              pathLength={1}
              className="diamond-trace"
            />

            {/* A small bright sparkle on the table — a hot pixel */}
            <circle cx="44" cy="32" r="1.2" fill="white" opacity="0.95" />
          </svg>
        </div>

        {/* Ground reflection — softens the 3D illusion */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none animate-floatY"
          style={{
            bottom: -size * 0.05,
            width: w * 0.95,
            height: size * 0.1,
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 75%)",
            filter: "blur(3px)",
          }}
        />
      </div>

      {label && (
        <div
          className="mt-5 text-[11px] font-semibold text-slate-500 tracking-[0.2em] uppercase"
        >
          {label}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        {inner}
      </div>
    );
  }
  return inner;
}
