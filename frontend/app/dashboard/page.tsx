"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash, Utensils, ArrowLeft, LayoutGrid, Flame, Clock, ThermometerSnowflake, Search, ChevronDown, CheckCircle2, ChevronRight, Wand2, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry: string;
  imageUrl?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/pantry/items");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          // Mock data for beautiful initialization
          setItems([
            { id: "1", name: "Fresh Milk", quantity: 1, unit: "Litre", expiry: new Date(Date.now() + 86400000 * 2).toISOString(), imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
            { id: "2", name: "Spinach", quantity: 200, unit: "g", expiry: new Date(Date.now() + 86400000 * 1).toISOString(), imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400" },
            { id: "3", name: "Greek Yogurt", quantity: 500, unit: "g", expiry: new Date(Date.now() + 86400000 * 4).toISOString(), imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400" },
          ]);
        }
      } catch (e) {
        console.error("Fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchItems();
  }, [user]);

  const getDaysRemaining = (expiry: string) => {
    const today = new Date();
    const expiryDate = new Date(expiry);
    const diff = expiryDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 2) return "text-[#FF512F]";
    if (days <= 5) return "text-[#F09819]";
    return "text-white/40";
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#1c1b1f] text-white relative overflow-x-hidden font-sans selection:bg-[#6e56cf]/40">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.05]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6e56cf] rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF512F] rounded-full blur-[180px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <nav className="fixed top-0 inset-x-0 h-[72px] flex items-center justify-between px-10 z-[100] bg-[#1c1b1f]/10 backdrop-blur-3xl border-b border-white/[0.04]">
        <div className="flex items-center gap-[48px]">
           <Link href="/" className="flex items-center gap-2 font-bold text-[22px] tracking-tighter">
             <div className="w-[20px] h-[20px] rounded-[4px] bg-gradient-to-tr from-[#FF512F] to-[#DD2476]"></div>
             FoodPrint
           </Link>
           <div className="hidden xl:flex items-center gap-[32px] text-[14px] font-bold tracking-widest uppercase text-white/40">
             Dashboard Core
           </div>
        </div>
        <div className="flex items-center gap-8">
           <Link href="/substitutes" className="text-[14px] font-bold text-white/60 hover:text-white transition">Substitutes</Link>
           <button className="bg-white text-black py-2.5 px-7 rounded-full text-[13px] font-semibold hover:bg-neutral-200 transition active:scale-95 shadow-xl">
             New Item
           </button>
        </div>
      </nav>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-10 pt-[140px] pb-32">
         {/* WELCOME SECTION */}
         <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12">
            <div>
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-[64px] font-serif leading-none tracking-tight mb-8">Pantry <span className="italic font-normal opacity-40">Intelligence</span></h1>
                  <p className="text-[20px] text-white/40 leading-relaxed font-medium max-w-[600px]">
                    Hello, <span className="text-white">{user?.displayName || "Culinary Explorer"}</span>. <br />
                    Your inventory is optimized. 3 items require immediate attention.
                  </p>
               </motion.div>
            </div>
            
            {/* HEATMAP ACTION CARD */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <Link href="/expiry-heatmap">
                  <div className="relative group cursor-pointer">
                    <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-[#FF512F] to-[#6e56cf] opacity-50 group-hover:opacity-100 blur-[2px] transition duration-700"></div>
                    <div className="relative bg-[#1c1b1f] rounded-[32px] p-10 border border-white/5 flex items-center gap-10">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF512F] mb-3">Live Analysis</span>
                          <span className="text-[24px] font-bold mb-2">Expiry Heatmap</span>
                          <span className="text-[14px] text-white/40">Visual impact visualization</span>
                       </div>
                       <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-white/80 group-hover:bg-[#FF512F] group-hover:text-white transition duration-500">
                          <ArrowUpRight size={28} />
                       </div>
                    </div>
                  </div>
               </Link>
            </motion.div>
         </div>

         {/* PANTRY GRID */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
               {items.map((item, idx) => {
                 const days = getDaysRemaining(item.expiry);
                 const urgencyColor = getUrgencyColor(days);
                 
                 return (
                   <motion.div 
                     initial={{ opacity: 0, y: 30 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     transition={{ delay: idx * 0.1 }} 
                     key={item.id}
                     className="group relative rounded-[40px] bg-[#1c1b1f] border border-white/5 p-10 hover:border-white/10 transition-all duration-700 hover:-translate-y-3 shadow-2xl"
                   >
                     <div className="flex justify-between items-start mb-10">
                        <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#6e56cf] group-hover:bg-[#6e56cf] group-hover:text-white transition duration-500 overflow-hidden">
                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover opacity-80" /> : <Utensils size={32} />}
                        </div>
                        <div className={`px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[11px] font-bold uppercase tracking-widest ${urgencyColor}`}>
                           {days} days
                        </div>
                     </div>

                     <h3 className="text-[28px] font-bold tracking-tight mb-3 transition group-hover:text-[#6e56cf]">{item.name}</h3>
                     <p className="text-[16px] text-white/30 font-medium mb-10">{item.quantity} {item.unit}</p>

                     <div className="flex gap-4">
                        <button className="flex-1 py-4 px-2 rounded-2xl bg-white/[0.04] border border-white/5 text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition flex items-center justify-center gap-3">
                           <Minus size={14} /> Use
                        </button>
                        <button className="flex-1 py-4 px-2 rounded-2xl bg-white/[0.04] border border-white/5 text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition">Half</button>
                        <button className="w-14 h-14 rounded-2xl bg-[#FF512F]/10 border border-[#FF512F]/20 text-[#FF512F] flex items-center justify-center hover:bg-[#FF512F] hover:text-white transition">
                           <Trash size={18} />
                        </button>
                     </div>
                   </motion.div>
                 );
               })}
            </AnimatePresence>

            {/* ADD ITEM PLACEHOLDER */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 hover:border-[#6e56cf]/40 transition duration-500 cursor-pointer group">
               <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center text-white/20 group-hover:bg-[#6e56cf]/20 group-hover:text-[#6e56cf] transition duration-500 mb-6">
                  <Plus size={32} />
               </div>
               <span className="text-[14px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40 transition">Append Inventory</span>
            </motion.div>
         </div>
      </main>

      <footer className="w-full bg-[#1c1b1f] border-t border-white/5 py-16 px-12 relative z-30 opacity-40">
         <div className="max-w-[1400px] mx-auto flex justify-between items-center text-[12px] font-bold uppercase tracking-widest text-white/40">
            <span>© 2026 FoodPrint Systems</span>
            <div className="flex gap-12">
               <span className="hover:text-white cursor-pointer transition">Terminal</span>
               <span className="hover:text-white cursor-pointer transition">Neural Link</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
