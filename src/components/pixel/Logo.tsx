import type { SpriteMode } from "@/components/pixel/Sprite";

/** A logo as its owner made it; only a medal still to get goes grey. */
export function Logo({
  src,
  mode,
  label,
  className = "size-full object-contain",
}: {
  src: string;
  mode: SpriteMode;
  label: string;
  className?: string;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: logos come from Storage, at most 1 MB; next/image adds nothing here
    <img
      src={src}
      alt={label}
      loading="lazy"
      decoding="async"
      data-mode={mode}
      className={`logo ${className}`}
    />
  );
}
