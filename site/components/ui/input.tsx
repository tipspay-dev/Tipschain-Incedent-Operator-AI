import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-white/12 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none ring-0 transition focus:border-cyan-300/40 focus:bg-white/8",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
