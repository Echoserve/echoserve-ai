// Utility for conditional classNames (Shadcn style)
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
} 