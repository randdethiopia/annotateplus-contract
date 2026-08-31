import Image from "next/image";
import { cn } from "@/lib/utils";

// Intrinsic size matches the SVG viewBox (240×48) so `w-auto` scales without clipping.
export function BrandLogo({
  className,
  width = 240,
  height = 48,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src="/logo/rd-logo.svg"
      alt="R&D Group"
      width={width}
      height={height}
      className={cn("h-9 w-auto object-contain", className)}
      priority
    />
  );
}
