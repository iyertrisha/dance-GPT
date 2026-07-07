import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  forwardRef,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-lg shadow-purple-900/30 hover:bg-accent-hover focus-visible:ring-ring",
  secondary:
    "border border-border bg-muted text-foreground hover:bg-muted/80 hover:border-muted-foreground/30 focus-visible:ring-ring",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring",
};

const sizeClass: Record<Size, string> = {
  sm: "rounded-lg px-3 py-2 text-sm",
  md: "rounded-xl px-5 py-3 text-sm font-medium",
  lg: "rounded-xl px-8 py-3 text-base font-medium",
};

const base =
  "inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  );
});

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: Variant;
  size?: Size;
};

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <Link
      ref={ref}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  );
});
