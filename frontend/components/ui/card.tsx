import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-8 shadow-xl shadow-purple-950/20 ring-1 ring-card-ring backdrop-blur",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
