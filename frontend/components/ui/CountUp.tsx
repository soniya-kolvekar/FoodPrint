"use client";
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = String(direction === "down" ? to : from);
    }
  }, [from, to, direction]);

  useEffect(() => {
    if (isInView && startWhen) {
      const timeoutId = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        const formattedNumber = Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Number(latest.toFixed(decimals)));
        
        const finalValue = separator 
            ? formattedNumber.replace(/,/g, separator) 
            : formattedNumber;

        ref.current.textContent = `${prefix}${finalValue}${suffix}`;
      }
    });
  }, [springValue, decimals, separator, prefix, suffix]);

  return <span className={className} ref={ref} />;
}
