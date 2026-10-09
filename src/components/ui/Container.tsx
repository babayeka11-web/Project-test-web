import type { ElementType, HTMLAttributes } from 'react';
import { cn } from './cn';

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  /** page = 1216px (default) · text = 672px reading measure · wide = 1408px */
  size?: 'page' | 'text' | 'wide';
  as?: ElementType;
};

const SIZES = { page: 'max-w-page', text: 'max-w-text', wide: 'max-w-wide' } as const;

/** Centres content and applies the page gutter (16px on phones → 40px on desktop). */
export function Container({ size = 'page', as: Tag = 'div', className, ...rest }: ContainerProps) {
  return <Tag className={cn('mx-auto w-full px-gutter', SIZES[size], className)} {...rest} />;
}
