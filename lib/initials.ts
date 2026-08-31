/**
 * Initials for an avatar chip. Ethiopian names are given-name-first with no
 * surname, so the first two words are the meaningful pair — never the last.
 * Returns "?" for a missing or punctuation-only name so the chip never renders
 * empty and collapses.
 */
export function getInitials(name: string | undefined | null, max = 2): string {
  if (!name) return "?";

  const letters = name
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word)[0] ?? "")
    .filter((char) => /\p{L}|\p{N}/u.test(char))
    .slice(0, max)
    .join("");

  return letters.toUpperCase() || "?";
}
