import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block min-h-[120px] w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-foreground placeholder:text-muted-foreground",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
