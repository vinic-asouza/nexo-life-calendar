import * as React from 'react';
import { Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Visual checkbox indicator used across the app for toggling done state.
 * Encapsulates the repeated `border-muted-foreground/40 hover:border-primary` pattern.
 *
 * - `size="sm"`: 4x4 (used inside checklists)
 * - `size="md"`: 5x5 (used in day/month item rows)
 * - When `done` is true and no `color` is provided, fills with `primary`.
 * - When `color` (HSL string like "217 91% 60%") is provided and `done` is true,
 *   fills with that color (used for area-colored item rows).
 */
const indicatorVariants = cva(
  'flex shrink-0 items-center justify-center transition-colors',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 rounded-sm border',
        md: 'h-5 w-5 rounded-lg border-2',
      },
      done: {
        true: 'border-transparent',
        false: 'border-muted-foreground/40 hover:border-primary',
      },
    },
    compoundVariants: [
      { done: true, size: 'sm', class: 'bg-primary border-primary' },
    ],
    defaultVariants: { size: 'md', done: false },
  }
);

export interface CheckIndicatorProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof indicatorVariants> {
  done?: boolean;
  /** Optional HSL triple (e.g. "217 91% 60%") used when `done` is true. */
  color?: string;
}

export const CheckIndicator = React.forwardRef<HTMLButtonElement, CheckIndicatorProps>(
  ({ className, size = 'md', done = false, color, style, ...props }, ref) => {
    const colorStyle =
      done && color
        ? { backgroundColor: `hsl(${color})`, borderColor: `hsl(${color})`, ...style }
        : style;

    const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

    return (
      <button
        ref={ref}
        type="button"
        className={cn(indicatorVariants({ size, done }), className)}
        style={colorStyle}
        {...props}
      >
        {done && <Check className={cn(iconSize, 'text-primary-foreground')} />}
      </button>
    );
  }
);
CheckIndicator.displayName = 'CheckIndicator';
