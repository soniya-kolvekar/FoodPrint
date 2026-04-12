"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Loader2, X, Globe, ChevronDown, CheckCircle2, ChevronRight, Wand2, Share2, Mail, MessageSquare } from "lucide-react";

const complexLogos = [
  "chatandbuild", "Apple", "NETFLIX", "Walmart", "Disney", "Deloitte.", "amazon", "bolt", "replit"
];

export default function FoodPrintSubstitutes() {
  const [ingredient, setIngredient] = useState("");
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [placeholderValue, setPlaceholderValue] = useState("");
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

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
    let typingSpeed = 50;

    const interval = setInterval(() => {
      const fullText = placeholders[currentPlaceholderIndex];
      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
        typingSpeed = 30;
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
        typingSpeed = 40;
      }
      setPlaceholderValue(currentText);

      if (!isDeleting && currentText === fullText) {
        isDeleting = true;
        typingSpeed = 1200;
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
        typingSpeed = 400;
      }
    }, typingSpeed);
    return () => clearInterval(interval);
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
    <div className="min-h-screen bg-blush-50 text-bordeaux-950 relative overflow-x-hidden font-sans selection:bg-apricot-200/40">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* ======================= BACKGROUND ANIMATION ======================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full opacity-[0.4]" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <motion.circle 
            cx="300" cy="400" r="280" stroke="#f2b373" strokeWidth="1" fill="none"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.ellipse 
            cx="700" cy="650" rx="350" ry="200" stroke="#cf3053" strokeWidth="1" fill="none"
            animate={{ 
              rotate: 360,
              opacity: [0.1, 0.05, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      <main className="relative z-10 w-full max-w-[1240px] mx-auto px-6 flex flex-col items-center text-center pt-[180px] pb-40">
         <motion.h1 
           className="text-[60px] md:text-[84px] font-serif leading-[1.05] tracking-tight mb-[30px] max-w-[1100px] text-bordeaux-800"
           initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
         >
           AI with an Eye for <span className="text-apricot-500">Ingredients</span>
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
           className="w-full max-w-[840px] mx-auto relative group mb-[90px]"
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
              <div className="flex items-center justify-between w-full mt-auto">
                 <div className="flex gap-[12px]">
                    <button type="button" className="py-[10px] px-[16px] rounded-[12px] bg-apricot-50 border border-apricot-100 flex items-center gap-[10px] text-[13px] font-bold text-apricot-600 hover:bg-apricot-100 transition">
                       <Wand2 size={16} className="text-apricot-500" />
                       Import Recipe
                    </button>
                    <button type="button" className="py-[10px] px-[16px] rounded-[12px] bg-apricot-50 border border-apricot-100 flex items-center gap-[10px] text-[13px] font-bold text-bordeaux-300 hover:bg-apricot-100 transition">
                       <Globe size={16} className="text-bordeaux-200" />
                       Clone meal
                    </button>
                 </div>
                 <button disabled={loading || !ingredient.trim()} className="w-[48px] h-[40px] rounded-[10px] bg-apricot-500 flex items-center justify-center text-white hover:bg-bordeaux-800 transition active:scale-95 shadow-md">
                   {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} />}
                 </button>
              </div>
           </form>
         </motion.div>

         {/* ======================= AUTO-SCROLLING "TRUSTED BY" SECTION ======================= */}
         {!searched && (
           <div className="w-full flex flex-col items-center gap-12 mt-10 relative">
              <span className="text-bordeaux-300 text-[13px] font-medium tracking-wide">Trusted by 1.5 Million humans and leading AI agents</span>
              
              <div className="w-full overflow-hidden relative">
                 {/* Gradient Fades for Smooth Side Edges */}
                 <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-blush-50 to-transparent z-10" />
                 <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-blush-50 to-transparent z-10" />
                 
                 <motion.div 
                   className="flex gap-x-20 items-center whitespace-nowrap px-10"
                   animate={{ x: [0, -1500] }}
                   transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                 >
                    {/* Triple the logos to ensure gapless loop */}
                    {[...complexLogos, ...complexLogos, ...complexLogos].map((logo, index) => (
                       <div key={index} className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition duration-500 cursor-default">
                          {logo === "Apple" && (
                            <svg viewBox="0 0 384 512" width="22" fill="#5a0c2a"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.8-42.3 1-84.6 25-108.5 67.2-46.1 81.3-11.7 203.2 32.7 267.3 21.7 31.4 47.9 66.4 81.4 65.2 31.5-1.1 43.1-20.3 81.4-20.3 38.3 0 49.3 20.3 81.4 19.3 34.3-1.1 57.5-31.5 79.2-62.8 24.8-35.9 35-70.8 35.3-72.3-.8-.3-67.9-26.1-68.1-103.2zM286.7 82.2c16.3-19.8 27.2-47.3 24.2-74.6-23.4 1-51.6 15.6-68.3 35.2-15 17.5-28.2 45.4-25.2 72.3 25.8 2 52.8-13 69.3-32.9z"/></svg>
                          )}
                          <span className={`text-bordeaux-800 font-bold tracking-tight text-[24px] ${logo === "NETFLIX" ? "tracking-tighter" : ""}`}>
                            {logo !== "Apple" && logo}
                          </span>
                       </div>
                    ))}
                 </motion.div>
              </div>
           </div>
         )}

         {/* RESULTS SECTION */}
         <div className="w-full relative z-20 mt-28">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-full border-b-2 border-apricot-500 animate-spin mb-8"></div>
                  <h3 className="text-[20px] text-bordeaux-300 font-serif italic tracking-widest uppercase">Consulting Engine...</h3>
              </motion.div>
            )}
            {!loading && searched && (
              <motion.div key="results" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-left w-full mx-auto pb-40 px-4">
                 <div className="flex items-center gap-10 mb-16 max-w-[1240px] mx-auto">
                    <h2 className="text-[44px] font-serif tracking-tight leading-none text-bordeaux-800">Intelligence for <span className="opacity-40 italic">"{ingredient}"</span></h2>
                    <div className="flex-1 h-[1px] bg-apricot-100"></div>
                    <button onClick={() => setSearched(false)} className="text-[12px] font-bold uppercase tracking-widest text-apricot-300 hover:text-apricot-500 transition">Reset</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-[1240px] mx-auto">
                   {substitutes.map((sub: any, i) => (
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="relative group rounded-[32px] overflow-hidden bg-white border border-apricot-50 hover:border-apricot-300 transition-all duration-700 hover:-translate-y-4 shadow-sm hover:shadow-xl">
                         <div className="h-56 w-full overflow-hidden relative">
                           <img src={sub.image} alt={sub.name} className="w-full h-full object-cover transition duration-[4s] group-hover:scale-125 opacity-90 group-hover:opacity-100" />
                           <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                         </div>
                         <div className="p-8 relative">
                            <h3 className="text-[22px] font-bold text-bordeaux-800 group-hover:text-apricot-500 transition-colors mb-4">{sub.name}</h3>
                            <button onClick={() => setSelectedSub(sub)} className="flex items-center justify-between w-full group/btn pt-6 border-t border-apricot-50/50">
                               <span className="text-[12px] font-bold uppercase tracking-widest text-bordeaux-300 group-hover/btn:text-bordeaux-800 transition-colors">See Details</span>
                               <ChevronRight size={18} className="text-apricot-200 group-hover/btn:translate-x-2 transition-transform" />
                            </button>
                         </div>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
         </div>
      </main>

      <footer className="w-full bg-white border-t border-apricot-50 pt-[100px] pb-[60px] px-12 relative z-30">
         <div className="max-w-[1240px] mx-auto grid grid-cols-2 lg:grid-cols-5 gap-20 mb-[100px]">
            <div className="col-span-2 lg:col-span-2 text-left">
               <div className="flex items-center gap-2 font-bold text-[36px] tracking-tighter mb-10 italic text-bordeaux-800">
                 <div className="w-[28px] h-[28px] rounded-sm bg-apricot-500"></div>
                 FoodPrint
               </div>
               <p className="text-bordeaux-300 text-[18px] leading-relaxed max-w-[360px]">Reimagining the bridge between food science and digital intelligence.</p>
               <div className="flex gap-8 mt-12 text-bordeaux-200">
                  <Share2 className="hover:text-apricot-500 cursor-pointer transition" size={20} />
                  <Globe className="hover:text-apricot-500 cursor-pointer transition" size={20} />
                  <Mail className="hover:text-apricot-500 cursor-pointer transition" size={20} />
                  <MessageSquare className="hover:text-apricot-500 cursor-pointer transition" size={20} />
               </div>
            </div>
            {['Product', 'Resources', 'Company'].map((col, idx) => (
              <div key={idx} className="text-left">
                 <h4 className="font-bold text-[12px] mb-12 text-bordeaux-200 tracking-[0.4em] uppercase">{col}</h4>
                 <ul className="space-y-6 text-[16px] text-bordeaux-400 font-medium tracking-normal">
                    <li className="hover:text-apricot-500 cursor-pointer transition">Navigation</li>
                    <li className="hover:text-apricot-500 cursor-pointer transition">Intelligence</li>
                    <li className="hover:text-apricot-500 cursor-pointer transition">Molecular</li>
                 </ul>
              </div>
            ))}
         </div>
         <div className="max-w-[1240px] mx-auto border-t border-apricot-50 pt-12 flex justify-between items-center opacity-60">
            <span className="text-[13px] font-bold tracking-widest uppercase text-bordeaux-300">© 2026 FoodPrint. All rights reserved.</span>
            <div className="flex gap-12 text-[12px] font-bold uppercase tracking-widest text-bordeaux-300">
               <span className="hover:text-apricot-500 cursor-pointer transition">Privacy Policy</span>
               <span className="hover:text-apricot-500 cursor-pointer transition">Terms of Service</span>
            </div>
         </div>
      </footer>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-bordeaux-950/20 backdrop-blur-md">
             <motion.div initial={{ scale: 0.94, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 40 }} className="w-full max-w-[800px] bg-white rounded-[40px] overflow-hidden border border-apricot-100 shadow-2xl flex flex-col md:flex-row relative">
                <button onClick={() => setSelectedSub(null)} className="absolute top-8 right-8 w-11 h-11 rounded-full bg-apricot-50 flex items-center justify-center text-bordeaux-300 hover:text-bordeaux-800 transition z-10 border border-apricot-100"><X size={22} /></button>
                <div className="w-full md:w-1/2 h-[450px] relative">
                   <img src={selectedSub.image} alt={selectedSub.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-10 md:p-14 flex-1 flex flex-col justify-center text-left">
                   <div className="flex items-center gap-3 text-apricot-500 mb-6 uppercase text-[11px] font-bold tracking-[0.4em]">
                      <CheckCircle2 size={16} />
                      Intelligence Mapped
                   </div>
                   <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-[1.1] tracking-tight text-bordeaux-800">{selectedSub.name}</h2>
                   <p className="text-[17px] text-bordeaux-600/60 leading-relaxed font-serif italic mb-10">{selectedSub.preparation || "Ideal culinary replacement discovered by Agent Intelligence."}</p>
                   <button className="w-full py-5 rounded-[18px] bg-apricot-500 text-white font-bold text-[15px] hover:bg-bordeaux-800 transition shadow-lg tracking-[0.3em] uppercase active:scale-95">Integrate Suggestion</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

