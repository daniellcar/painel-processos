import Image from "next/image";

// Proporção original: 457 × 625 (≈ 0.731 W/H).
const RATIO = 457 / 625;

type Size = "sm" | "md" | "lg" | "xl";

const HEIGHTS: Record<Size, number> = {
  sm: 32, // antes era § em text-2xl
  md: 40, // antes era § em text-3xl
  lg: 48, // antes era § em text-4xl
  xl: 64,
};

export function Logo({
  size = "md",
  priority = false,
  className,
}: {
  size?: Size;
  priority?: boolean;
  className?: string;
}) {
  const height = HEIGHTS[size];
  const width = Math.round(height * RATIO);
  return (
    <Image
      src="/logo-ma.png"
      alt="Painel de Processos"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
