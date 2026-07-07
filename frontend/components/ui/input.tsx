import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "mt-1 block w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-foreground placeholder:text-muted-foreground",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
