import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex cursor-pointer shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        brand: 'bg-brand text-brand-foreground hover:opacity-90 shadow-sm',
        outline:
          'border-border text-foreground bg-background transition-all duration-200 ease-in-out hover:bg-muted hover:border-foreground/40 aria-expanded:bg-muted aria-expanded:text-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary',
        ghost:
          'hover:bg-muted hover:text-foreground text-foreground/80 aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        link: 'text-foreground underline-offset-4 hover:underline',
        editorial:
          'border border-foreground bg-transparent text-foreground uppercase tracking-[0.2em] text-xs font-semibold hover:bg-foreground hover:text-background transition-all duration-300',
      },
      size: {
        default: 'h-9 gap-2 px-4 text-sm',
        xs: "h-7 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-sm px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 gap-2 px-6 text-base tracking-wide',
        icon: 'size-9 rounded-md',
        'icon-xs': 'size-6 rounded-sm',
        'icon-sm': 'size-7 rounded-sm',
        'icon-lg': 'size-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

