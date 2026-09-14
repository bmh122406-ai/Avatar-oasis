import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "gradient-bg text-white hover:opacity-90 shadow-lg shadow-violet-900/20",
  secondary: "bg-surface-2 text-foreground hover:bg-surface-2/70 border border-border",
  ghost: "text-foreground hover:bg-surface-2",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  outline: "border border-border text-foreground hover:bg-surface-2",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-6 py-3 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
