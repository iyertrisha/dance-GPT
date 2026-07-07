import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Alert({
  children,
  variant = "danger",
  className,
}: {
  children: ReactNode;
  variant?: "danger";
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-danger-border bg-danger px-3 py-2 text-sm text-danger-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
