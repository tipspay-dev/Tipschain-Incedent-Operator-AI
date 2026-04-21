"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "icon";
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-white text-black hover:bg-white/90 border border-white/10 shadow-[0_18px_45px_rgba(255,255,255,0.12)]",
  outline:
    "bg-white/5 text-white border border-white/12 hover:bg-white/10",
  ghost: "bg-transparent text-white border border-transparent hover:bg-white/8",
  destructive:
    "bg-rose-500/90 text-white border border-rose-300/20 hover:bg-rose-500",
};

const sizeClasses = {
  default: "h-12 px-5 py-2 rounded-2xl text-sm font-semibold",
  icon: "h-10 w-10 rounded-full p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
