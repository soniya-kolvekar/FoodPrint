"use client";

import { motion, MotionStyle, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Transition;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
  borderRadius?: number;
}

export const BorderBeam = ({
  className,
  size = 100,
  delay = 0,
  duration = 6,
  colorFrom = "#ffa5ab",
  colorTo = "#f9dbbd",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 2,
  borderRadius = 40,
}: BorderBeamProps) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent z-20",
        className
      )}
      style={
        {
          borderWidth: `${borderWidth}px`,
          maskImage: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
          WebkitMaskImage: "linear-gradient(transparent, transparent), linear-gradient(#000, #000)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-out",
          maskClip: "padding-box, border-box",
          WebkitMaskClip: "padding-box, border-box",
          ...style,
        } as React.CSSProperties
      }
    >
      <motion.div
        className="absolute aspect-square bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent"
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${borderRadius}px)`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </div>
  );
};
