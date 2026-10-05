import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button — variantes : primary (noir), accent (vert, conversion), secondary (gris chaud),
 * outline, ghost, link, danger. Tailles : sm, md, lg, icon, icon-sm.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        outline: "border border-border-strong bg-surface text-foreground hover:bg-paper-2",
        ghost: "text-foreground hover:bg-paper-2",
        link: "text-foreground underline underline-offset-4 hover:text-accent px-0 h-auto",
        danger: "bg-error text-white hover:bg-[#9a1d13]",
        "danger-outline": "border border-error/40 text-error hover:bg-error-soft",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-13 px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...(asChild ? {} : { type: props.type ?? "button" })}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  label: string;
  size?: "icon" | "icon-sm" | "icon-lg";
}

/** IconButton — bouton icône avec libellé accessible obligatoire. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ label, size = "icon", variant = "ghost", children, ...props }, ref) => (
  <Button ref={ref} size={size} variant={variant} aria-label={label} title={label} {...props}>
    {children}
  </Button>
));
IconButton.displayName = "IconButton";
