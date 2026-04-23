/**
 * Minimal className join. Replaces the cabinet's clsx + tailwind-merge
 * shim. Cosmic-gardener does not ship Tailwind.
 */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}
