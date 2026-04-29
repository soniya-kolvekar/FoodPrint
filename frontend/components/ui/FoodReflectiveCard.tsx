"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { Utensils, Phone, Tag } from "lucide-react";

interface FoodItem {
  id?: string;
  title: string;
  description: string;
  contactInfo?: string;
  price?: string;
  userName?: string;
  imageUrl?: string;
}

interface FoodReflectiveCardProps {
  item: FoodItem;
  blurStrength?: number;
  metalness?: number;
  roughness?: number;
  overlayColor?: string;
  displacementStrength?: number;
  noiseScale?: number;
  specularConstant?: number;
}

const springValues = {
  damping: 30,
  stiffness: 120,
  mass: 2
};

export function FoodReflectiveCard({
  item,
  blurStrength = 8,
  metalness = 0.6,
  roughness = 0.3,
  overlayColor = "rgba(69, 9, 32, 0.02)",
  displacementStrength = 15,
  noiseScale = 1.2,
  specularConstant = 1.5
}: FoodReflectiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 3D Tilt Values
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  // Pointer tracking for shine
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -10);
    rotateY.set((offsetX / (rect.width / 2)) * 10);

    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleMouseEnter() {
    scale.set(1.03);
  }

  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);

  return (
    <div className="[perspective:1000px] w-full h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full rounded-[32px] overflow-hidden bg-[#450920] shadow-[0_20px_50px_rgba(69,9,32,0.15),0_0_0_1px_rgba(255,255,255,0.05)_inset] p-6 flex flex-col gap-4 transition-all duration-500 group isolate"
      >
        {/* SVG Filters for Reflective Metal/Glass Shimmer */}
        <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
          <defs>
            <filter id={`reflective-shimmer-${item.id || "def"}`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="turbulence" baseFrequency={baseFrequency} numOctaves="2" result="noise" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={displacementStrength}
                xChannelSelector="R"
                yChannelSelector="G"
                result="rippled"
              />
              <feSpecularLighting
                in="noiseAlpha"
                surfaceScale={displacementStrength}
                specularConstant={specularConstant}
                specularExponent="25"
                lightingColor="#ffffff"
                result="light"
              >
                <fePointLight x="0" y="0" z="300" />
              </feSpecularLighting>
              <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
              <feBlend in="light-effect" in2="SourceGraphic" mode="screen" />
            </filter>
          </defs>
        </svg>

        {/* Static Glass Noise Layer */}
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27noiseFilter%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.8%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noiseFilter)%27%2F%3E%3C%2Fsvg%3E')] mix-blend-overlay" />

        {/* Shine/Gloss Layer tracking pointer */}
        <motion.div 
          className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-60"
          style={{
            background: useMotionTemplate`
              radial-gradient(${displacementStrength * 15}px circle at ${mouseX}px ${mouseY}px,
                rgba(255, 255, 255, 0.8),
                rgba(255, 255, 255, 0) 80%
              )
            `,
          }}
        />

        {/* Card Media Section */}
        <div 
          className="h-48 w-full rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/10 relative [transform:translateZ(20px)]"
          style={{
            filter: `url(#reflective-shimmer-${item.id || "def"})`
          }}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
          ) : (
            <Utensils className="text-[#f9dbbd]/30 animate-pulse" size={44} />
          )}
        </div>

        {/* Text/Content Section */}
        <div className="[transform:translateZ(30px)] flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-black text-[#fffbfa] text-2xl tracking-tight font-sans truncate pr-2 group-hover:text-[#f9dbbd] transition-colors antialiased transform-gpu [backface-visibility:hidden]">
              {item.title}
            </h3>
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm shrink-0 mt-1">
              <Tag size={12} className="text-[#f9dbbd]" />
              <span className="text-[11px] font-black tracking-widest text-[#f9dbbd] uppercase">{item.price || "Free"}</span>
            </div>
          </div>
          <p className="text-xs font-medium text-[#fffbfa]/70 mb-5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          
          <div className="mt-auto flex flex-col gap-2.5 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-[#fffbfa]">
              <span className="text-[#da627d] font-black uppercase tracking-widest text-[10px]">Donor</span>
              <span className="font-black">{item.userName || "Neighbor"}</span>
            </div>
            
            {item.contactInfo && (
              <div className="flex items-center justify-between text-xs font-bold text-[#fffbfa] border-t border-white/10 pt-2.5 border-dashed">
                <span className="text-[#da627d] font-black uppercase tracking-widest text-[10px] flex items-center gap-1">
                  <Phone size={11} /> Contact
                </span>
                <span className="truncate max-w-[150px] font-black text-[#fffbfa]/80">{item.contactInfo}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
