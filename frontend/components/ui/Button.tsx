"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<"button">>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gradient-to-r from-apricot-500 to-berry-500 text-white shadow-lg hover:shadow-xl hover:shadow-apricot-300/30": variant === "primary",
            "bg-cotton-100 text-bordeaux-800 hover:bg-cotton-200": variant === "secondary",
            "border-2 border-blush-300 text-bordeaux-700 bg-transparent hover:bg-blush-50": variant === "outline",
            "bg-transparent text-berry-700 hover:bg-berry-100": variant === "ghost",
          },
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
