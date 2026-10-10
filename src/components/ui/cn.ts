/** Joins class names, skipping anything that is not a non-empty string: cn('a', cond && 'b', undefined) → 'a b'. */
export function cn(...parts: unknown[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p !== '').join(' ');
}
