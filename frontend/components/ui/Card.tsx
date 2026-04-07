"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-3xl border p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all",
          glass
            ? "border-white/40 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-black/40"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";
