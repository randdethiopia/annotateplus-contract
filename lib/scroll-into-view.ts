export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scroll `target` into view, honouring the reduced-motion preference.
 *
 * "instant" rather than "auto" is deliberate: `app/layout.tsx` puts
 * `scroll-smooth` on <html>, and "auto" resolves to the computed CSS
 * scroll-behavior — so "auto" would animate anyway and silently ignore the
 * preference it was meant to respect.
 */
export function scrollIntoViewRespectingMotion(
  target: Element | null | undefined,
  options: Omit<ScrollIntoViewOptions, "behavior"> = { block: "start" }
) {
  if (!target) return;
  target.scrollIntoView({
    ...options,
    behavior: prefersReducedMotion() ? "instant" : "smooth",
  });
}
