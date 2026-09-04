import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names, letting later Tailwind utilities win over
 * earlier ones of the same family. Use this instead of template-literal
 * concatenation so callers can override a component's defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
