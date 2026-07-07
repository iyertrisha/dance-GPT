import { cn } from "@/lib/cn";

export function Spinner({
  className,
  label,
  size = "md",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-12";
  return (
    <div
      className={cn(dim, "animate-spin rounded-full border-2 border-muted border-t-accent", className)}
      role="status"
      aria-busy="true"
      aria-label={label ?? "Loading"}
    >
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
