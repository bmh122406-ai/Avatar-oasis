import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const baseClasses =
  "w-full rounded-xl bg-surface-2 border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={clsx(baseClasses, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={clsx(baseClasses, "resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between">
      <span className="text-sm font-medium text-foreground">{children}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-danger">{children}</p>;
}
