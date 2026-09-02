import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
  priority?: boolean;
}

const SRC = "/logo/rd-group-logo.png";

/**
 * Intrinsic pixels of the source asset. The declared box has to carry this
 * ratio or `w-auto` reserves a slot wider than the mark and `object-contain`
 * letterboxes it — dead space that reads as a broken logo at header sizes.
 */
const ASPECT_RATIO = 827 / 432;

/**
 * `width` is the layout hint next/image builds its srcset from; the Tailwind
 * height is what actually sets the rendered scale. Both are kept here so a
 * surface only ever picks a name, never a number.
 */
const SIZES = {
  sm: { width: 130, className: "h-8 w-auto" }, // Navigation header (AppHeader)
  md: { width: 160, className: "h-11 w-auto" }, // Candidate signing portal header
  lg: { width: 220, className: "h-16 w-auto" }, // Login card
} as const;

export function BrandLogo({
  href = "/",
  className,
  size = "md",
  showLink = false,
  priority = true,
}: BrandLogoProps) {
  const config = SIZES[size];

  const image = (
    <Image
      src={SRC}
      alt="R&D Group — Innovate Your Business"
      width={config.width}
      height={Math.round(config.width / ASPECT_RATIO)}
      priority={priority}
      // shrink-0: a flex sibling that overflows must not squash the mark.
      className={cn("shrink-0 object-contain transition-opacity", config.className, className)}
    />
  );

  if (!showLink) return image;

  return (
    <Link
      href={href}
      // shrink-0: the mark holds its width even when a sibling nav overflows.
      className="focus-visible:ring-action inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:outline-none"
    >
      {image}
    </Link>
  );
}
