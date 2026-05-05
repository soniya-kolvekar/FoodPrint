"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, X, Globe, CheckCircle2, ChevronRight, Wand2 } from "lucide-react";
import { Roboto_Flex } from "next/font/google";
import Link from "next/link";

import TiltedCard from "@/components/ui/TiltedCard";
import { IconCloud } from "@/components/ui/IconCloud";
import SplashCursor from "@/components/ui/SplashCursor";
import { BorderBeam } from "@/components/ui/BorderBeam";
import Orbit from "@/components/ui/Orbit";
import FallingText from "@/components/ui/FallingText";
import MagicRings from "@/components/ui/MagicRings";

const robotoFlex = Roboto_Flex({ subsets: ["latin"], variable: "--font-roboto-flex" });

export default function FoodPrintSubstitutes() {
  const [ingredient, setIngredient] = useState("");
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [placeholderValue, setPlaceholderValue] = useState("");
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [orbitImages, setOrbitImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchUnsplashImages = async () => {
      try {
        const res = await fetch("https://api.unsplash.com/photos/random?query=food&count=10&client_id=CeUUU5iaAbJGyZOmom9tqDzDKaf9Yt4DYRqRvPDtVqY");
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrbitImages(data.map((img: any) => img.urls.small));
        }
      } catch (err) {
        console.error("Failed to fetch unsplash images:", err);
      }
    };
    fetchUnsplashImages();
  }, []);

  const placeholders = [
    "What can I use instead of buttermilk?",
    "Find a substitute for heavy cream",
    "Healthy alternative to sugar",
    "Baking powder replacement"
  ];



  useEffect(() => {
    let currentPlaceholderIndex = 0;
    let currentText = "";
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const fullText = placeholders[currentPlaceholderIndex];
      let typingSpeed = isDeleting ? 30 : 50;

      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
      }

      setPlaceholderValue(currentText);

      if (!isDeleting && currentText === fullText) {
        isDeleting = true;
        typingSpeed = 1500; // Pause at the end
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
        typingSpeed = 500; // Pause before starting new text
      }

      timeoutId = setTimeout(type, typingSpeed);
    };

    timeoutId = setTimeout(type, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const fetchSubstitutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setSelectedSub(null);

    try {
      const res = await fetch(`http://localhost:5000/api/recipes/substitutes?ingredient=${encodeURIComponent(ingredient)}`);
      const data = await res.json();
      if (res.ok && data && data.substitutes) {
        const seen = new Set();
        const items = (Array.isArray(data.substitutes) ? data.substitutes : [data.substitutes])
          .filter((sub: any) => {
            if (!sub.image || sub.image.includes("ba9599a7e63c") || seen.has(sub.name)) return false;
            seen.add(sub.name);
            return true;
          });
        setSubstitutes(items);
      } else {
        setError(data.error || "No substitutes found.");
      }
    } catch {
      setError("Intelligence engine offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blush-50 text-bordeaux-950 relative overflow-x-hidden font-sans selection:bg-apricot-200/40 -mt-28 pt-28">
      <SplashCursor
        COLOR="rgba(30, 3, 12, 1)"
        SPLAT_RADIUS={0.35}
        SPLAT_FORCE={8000}
      />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* ======================= BACKGROUND ANIMATION ======================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <MagicRings
          color="#cf3053"
          colorTwo="#cf3053"
          ringCount={10}
          speed={1.5}
          attenuation={15}
          lineThickness={2.5}
          baseRadius={0.25}
          radiusStep={0.15}
          scaleRate={0.12}
          opacity={0.4}
          blur={0}
          noiseAmount={0.08}
          rotation={0}
          ringGap={1.6}
          fadeIn={0.5}
          fadeOut={0.3}
          followMouse={true}
          mouseInfluence={0.15}
          hoverScale={1.2}
          parallax={0.06}
          clickBurst={true}
        />
      </div>

      <main className="relative z-10 w-full max-w-[1240px] mx-auto px-6 flex flex-col items-center text-center pt-[100px] pb-0">
        <motion.h1
          className="text-[60px] md:text-[84px] font-serif leading-[1.05] tracking-tight mb-[30px] max-w-[1100px] text-bordeaux-800"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        >
          AI with an Eye for <span className="text-[#da627d]">Ingredients</span>
        </motion.h1>

        <motion.p
          className="text-[20px] md:text-[22px] text-bordeaux-600/40 font-normal max-w-[900px] mb-[60px] leading-[1.5]"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
        >
          Find substitutes for recipes, single ingredients, or by cloning a meal. <br />
          The same ingredient engine behind FoodPrint and PantryIntelligence, now in your hands.
        </motion.p>

        {/* PROMPT BOX */}
        <motion.div
          className="w-full max-w-[840px] mx-auto relative group mb-2"
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="absolute -inset-[1px] rounded-[20px] bg-apricot-500/10 opacity-20 group-hover:opacity-40 transition duration-700 blur-[1px]"></div>
          <form onSubmit={fetchSubstitutes} className="relative w-full bg-white rounded-[20px] flex flex-col p-[24px] border border-apricot-100 shadow-xl text-left overflow-hidden min-h-[190px]">
            <span className="text-bordeaux-300 text-[14px] font-medium mb-4">Let's find an ingredient substitute</span>
            <textarea
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              placeholder={placeholderValue}
              className="w-full h-24 bg-transparent text-bordeaux-800 text-[19px] outline-none resize-none placeholder:text-bordeaux-200 font-medium"
            />
            <div className="flex items-center justify-end w-full mt-auto">
              <button disabled={loading || !ingredient.trim()} className="w-[48px] h-[40px] rounded-[10px] bg-[#da627d] flex items-center justify-center text-white hover:bg-[#cf3053] active:bg-[#450920] transition-all active:scale-95 shadow-md shadow-[#da627d]/40 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} />}
              </button>
            </div>
            <BorderBeam duration={8} size={150} colorFrom="#f9dbbd" colorTo="#cf3053" />
          </form>
        </motion.div>

        {/* ORBIT ANIMATION */}
        {!searched && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6, duration: 1 }} 
            className="w-full flex justify-center mt-[-60px] mb-[-40px]"
          >
             <Orbit 
               images={orbitImages.length > 0 ? orbitImages : [
                 "https://images.unsplash.com/photo-1596422846543-7dc3defc1d76?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1587049352847-4d4b126a3121?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1577905187768-3e4b7c152a5c?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1615486171448-4fbaf0115049?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1540148426945-044120fdb4c3?w=200&h=200&fit=crop", 
                 "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop"  
               ]}
               radius={350}
               duration={40}
               iconSize={72}
            />
          </motion.div>
        )}


        {/* RESULTS SECTION */}
        <div className="w-full relative z-20 mt-28">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full border-b-2 border-apricot-500 animate-spin mb-8"></div>
                <h3 className="text-[20px] text-[#fffbfa]/40 font-serif italic tracking-widest uppercase">Consulting Engine...</h3>
              </motion.div>
            )}
            {!loading && searched && (
              <motion.div key="results" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-left w-full mx-auto pb-40 px-4">
                <div className="flex items-center gap-10 mb-16 max-w-[1240px] mx-auto">
                  <h2 className="text-[44px] font-serif tracking-tight leading-none text-bordeaux-800">Intelligence for <span className="opacity-40 italic">"{ingredient}"</span></h2>
                  <div className="flex-1 h-[1px] bg-apricot-100"></div>
                  <button onClick={() => setSearched(false)} className="text-[12px] font-bold uppercase tracking-widest text-apricot-300 hover:text-apricot-500 transition">Reset</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
                  {substitutes.map((sub: any, i) => (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="w-full">
                      <TiltedCard
                        containerHeight="400px"
                        containerWidth="100%"
                        imageHeight="100%"
                        imageWidth="100%"
                        rotateAmplitude={12}
                        scaleOnHover={1.05}
                        showMobileWarning={false}
                        showTooltip={false}
                        displayOverlayContent={true}
                        overlayContent={
                          <div className="w-full h-full rounded-[24px] bg-white/90 backdrop-blur-sm border-2 border-apricot-100 p-8 flex flex-col justify-between shadow-sm group relative overflow-hidden">
                            <BorderBeam size={200} duration={8} colorFrom="#e98016" colorTo="#f2b373" />
                            <div className="h-48 w-full rounded-2xl overflow-hidden mb-6">
                              <img src={sub.image} alt={sub.name} className="w-full h-full object-cover transition duration-[4s] group-hover:scale-125" />
                            </div>
                            <div>
                              <h3 className="text-[24px] font-black text-[#450920] mb-4">{sub.name}</h3>
                              <button
                                onClick={() => setSelectedSub(sub)}
                                className="flex items-center justify-between w-full group/btn pt-6 border-t border-apricot-100"
                              >
                                <span className="text-[12px] font-black uppercase tracking-widest text-[#a53860]">Intelligence Details</span>
                                <ChevronRight size={18} className="text-apricot-500 group-hover/btn:translate-x-2 transition-transform" />
                              </button>
                            </div>
                          </div>
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#1d070c] py-14 px-6 md:px-12 text-[#fffbfa] mt-auto relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#f9dbbd]/70 font-semibold font-sans">
          <div className="w-full md:w-2/3">
            <span>© 2026 FoodPrint. Save food, save money, save the planet. 100% Free Web App. No credit card required.</span>
          </div>
          <div className="flex gap-6 justify-center md:justify-end w-full md:w-1/3">
            <span className="hover:text-[#da627d] transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-[#da627d] transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-[#da627d] transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </footer>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#450920]/20 backdrop-blur-md">
            <motion.div initial={{ scale: 0.94, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 40 }} className="w-full max-w-[800px] bg-white rounded-[40px] overflow-hidden border border-apricot-100 shadow-2xl flex flex-col md:flex-row relative">
              <button onClick={() => setSelectedSub(null)} className="absolute top-8 right-8 w-11 h-11 rounded-full bg-apricot-50 flex items-center justify-center text-[#a53860] hover:text-[#450920] transition z-10 border border-apricot-100"><X size={22} /></button>
              <div className="w-full md:w-1/2 p-10 flex items-center justify-center relative bg-[#f9dbbd]/20 border-b md:border-b-0 md:border-r border-apricot-100">
                <div className="w-full aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-xl relative">
                  <img src={selectedSub.image} alt={selectedSub.name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
              <div className="p-10 md:p-14 flex-1 flex flex-col justify-center text-left">
                <div className="flex items-center gap-3 text-apricot-500 mb-6 uppercase text-[11px] font-black tracking-[0.4em]">
                  <CheckCircle2 size={16} />
                  Intelligence Mapped
                </div>
                <h2 className={`text-4xl md:text-5xl font-black mb-8 leading-[1.1] tracking-tight text-[#450920] ${robotoFlex.className}`}>{selectedSub.name}</h2>
                <p className="text-[17px] text-[#a53860]/80 leading-relaxed font-semibold italic mb-10">{selectedSub.preparation || "Ideal culinary replacement discovered by Agent Intelligence."}</p>
                <button className="w-full h-16 text-[18px] font-black rounded-[24px] shadow-2xl shadow-[#da627d]/30 bg-gradient-to-r from-[#da627d] via-[#a53860] to-[#450920] border-0 text-white hover:scale-[1.02] transition-all tracking-[0.2em] uppercase active:scale-95">Integrate Suggestion</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}