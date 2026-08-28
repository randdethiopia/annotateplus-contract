import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  width = 160,
  height = 48,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src="/logo/rd-logo.svg"
      alt="R&D"
      width={width}
      height={height}
      className={cn("h-9 w-auto object-contain", className)}
      priority
    />
  );
}
