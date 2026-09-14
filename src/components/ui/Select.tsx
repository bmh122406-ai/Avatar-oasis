import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={clsx(
      "w-full rounded-xl bg-surface-2 border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
