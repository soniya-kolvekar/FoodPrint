"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash, Utensils, ArrowLeft, LayoutGrid, Flame, Clock, ThermometerSnowflake, Search, ChevronDown, CheckCircle2, ChevronRight, Wand2, ArrowUpRight, Loader2, ScanLine, Edit2, Info, Check, X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import { BatchBreakdown } from "@/components/dashboard/BatchBreakdown";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { MagicCard } from "@/components/ui/MagicCard";
import TiltedCard from "@/components/ui/TiltedCard";
import FallingText from "@/components/ui/FallingText";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry: string;
  imageUrl?: string;
  batches?: any[];
  createdAt?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [viewingBatchesItem, setViewingBatchesItem] = useState<any | null>(null);
  const [deductValue, setDeductValue] = useState("");

  const normalize = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().trim().replace(/s$/, "");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "pantry", user.uid, "items"), orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const merged: PantryItem[] = [];
      const groups: Record<string, any> = {};

      raw.forEach((item) => {
        const key = `${normalize(item.name)}|${normalize(item.unit)}`;
        if (!groups[key]) {
          groups[key] = { ...item };
          if (!groups[key].batches) {
            groups[key].batches = [{ 
              id: "legacy", 
              quantity: item.quantity, 
              expiry: item.expiry, 
              addedAt: item.createdAt || new Date().toISOString() 
            }];
          }
          merged.push(groups[key]);
        } else {
          const target = groups[key];
          const batches = item.batches || [{ 
            id: `dup-${item.id}`, 
            quantity: item.quantity, 
            expiry: item.expiry, 
            addedAt: item.createdAt || new Date().toISOString() 
          }];
          target.batches = [...target.batches, ...batches];
          target.quantity = target.batches.reduce((acc: number, b: any) => acc + b.quantity, 0);
        }
      });

      setItems(merged);
      setLoading(false);
      setDataLoaded(true);
    });
  }, [user]);

  const handleAction = async (id: string, action: "use" | "half") => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`http://localhost:5000/api/pantry/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` }
      });
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const handleAdjust = async (id: string) => {
    if (!user || !deductValue) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/api/pantry/${id}/adjust`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify({ deductAmount: Number(deductValue) })
      });
      if (response.ok) {
        setAdjustingId(null);
        setDeductValue("");
      }
    } catch (error) {
      console.error("Error adjusting quantity:", error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch(`http://localhost:5000/api/pantry/${id}/finish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` }
      });
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const getSoonestExpiry = (item: any) => {
    if (item.batches && item.batches.length > 0) {
      const expiries = item.batches
        .map((b: any) => b.expiry)
        .filter(Boolean)
        .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
      return expiries[0] || null;
    }
    return item.expiry || null;
  };

  const getDaysRemaining = (expiry: string) => {
    const today = new Date();
    const expiryDate = new Date(expiry);
    const diff = expiryDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#fffbfa] text-[#450920] relative overflow-x-hidden font-sans selection:bg-[#da627d]/20">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.3]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#ffa5ab]/20 rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#f9dbbd]/30 rounded-full blur-[180px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-10 pt-[80px] pb-32">
         <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-12">
            <div>
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-[64px] font-black leading-none tracking-tight mb-8 text-[#450920] font-sans">My <span className="italic font-light text-[#da627d]">Dashboard</span></h1>
                  <p className="text-[20px] text-[#450920]/70 leading-relaxed font-medium max-w-[600px]">
                    Hello, <span className="text-[#a53860] font-bold">{user?.displayName || "Culinary Explorer"}</span>. <br />
                    Your inventory is optimized. <span className="text-[#cf3053] font-bold">{items.filter(item => getDaysRemaining(getSoonestExpiry(item) || "") <= 3).length} items</span> require attention.
                  </p>
               </motion.div>
            </div>
         </div>

         <div className="flex justify-between items-end mb-8 mt-10">
            <div>
               <h2 className="text-[32px] font-black text-[#450920] flex items-center gap-3 font-sans">
                  My <span className="italic font-light text-[#da627d]">Inventory</span>
               </h2>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
                {items.map((item, idx) => {
                  const soonest = getSoonestExpiry(item);
                  const days = soonest ? getDaysRemaining(soonest) : 999;
                  const urgencyColor = days <= 2 ? "text-[#cf3053]" : days <= 5 ? "text-[#e98016]" : "text-[#da627d]";
                  const urgencyBg = days <= 2 ? "bg-[#cf3053]/10 border-[#cf3053]/20" : days <= 5 ? "bg-[#e98016]/10 border-[#e98016]/20" : "bg-[#450920]/10 border-[#450920]/10";
                  
                  const cardStyles = [
                    { bg: "#fef2e7", border: "border-[#f9dbbd]", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#450920] to-[#a53860]", btnBg: "bg-[#450920]/5 border-[#450920]/10 text-[#450920] hover:bg-[#450920]/10" },
                    { bg: "#ffe5e7", border: "border-[#ffa5ab]/60", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#a53860] to-[#da627d]", btnBg: "bg-[#a53860]/5 border-[#a53860]/10 text-[#450920] hover:bg-[#a53860]/10" },
                    { bg: "#fcecee", border: "border-[#da627d]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#da627d] to-[#ffa5ab]", btnBg: "bg-[#da627d]/5 border-[#da627d]/10 text-[#450920] hover:bg-[#da627d]/10" },
                    { bg: "#f9ebf0", border: "border-[#a53860]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#a53860] to-[#450920]", btnBg: "bg-[#a53860]/5 border-[#a53860]/10 text-[#450920] hover:bg-[#a53860]/10" },
                    { bg: "#f8eaec", border: "border-[#450920]/30", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#450920] to-[#da627d]", btnBg: "bg-[#450920]/5 border-[#450920]/10 text-[#450920] hover:bg-[#450920]/10" },
                  ];

                  const style = cardStyles[idx % cardStyles.length];
                  const isMagic = idx % 2 === 0;

                  const cardContent = (
                     <div className={`p-8 flex flex-col h-full w-full relative z-30 font-sans ${style.text}`}>
                        <div className="flex justify-between items-start mb-6">
                           <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${style.iconBg} flex items-center justify-center text-white overflow-hidden shadow-md`}>
                              {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Utensils size={28} />}
                           </div>
                           <div className="flex flex-col items-end gap-2">
                             <div className={`px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${urgencyColor} ${urgencyBg}`}>
                                {days <= 0 ? "Expired" : `${days} days`}
                             </div>
                             {item.batches && item.batches.length > 1 && (
                               <button 
                                 onClick={() => setViewingBatchesItem(item)}
                                 className="text-[10px] font-black text-[#a53860] flex items-center gap-1 hover:text-[#450920] transition"
                               >
                                 <Info size={10} /> {item.batches.length} Batches
                               </button>
                             )}
                           </div>
                        </div>

                        <h3 className="text-2xl font-black tracking-tight mb-1 truncate capitalize text-[#450920]">{item.name}</h3>
                        <p className={`text-[15px] ${style.textMuted} font-semibold mb-8`}>{item.quantity} {item.unit}</p>

                        <div className="mt-auto">
                           <AnimatePresence mode="wait">
                             {adjustingId === item.id ? (
                               <motion.div 
                                 key="deduct-mode"
                                 initial={{ scale: 0.9, opacity: 0 }} 
                                 animate={{ scale: 1, opacity: 1 }}
                                 exit={{ scale: 0.9, opacity: 0 }}
                                 className="bg-[#450920]/5 p-3 rounded-2xl border border-[#450920]/10 flex flex-col gap-2"
                               >
                                  <div className="flex gap-2 items-center">
                                     <input 
                                       autoFocus
                                       type="number" 
                                       step="0.01"
                                       placeholder="..."
                                       value={deductValue}
                                       onChange={(e) => setDeductValue(e.target.value)}
                                       className="w-[90px] flex-grow bg-white border border-[#450920]/20 text-sm px-3 py-2 rounded-xl outline-none focus:border-[#da627d] transition-colors font-bold text-[#450920]"
                                     />
                                     <div className="flex gap-1 shrink-0">
                                       <button onClick={() => handleAdjust(item.id)} className="p-2.5 bg-green-500/20 hover:bg-green-500 text-green-700 hover:text-white rounded-xl transition border border-green-500/20"><Check size={16} /></button>
                                       <button onClick={() => setAdjustingId(null)} className="p-2.5 bg-gray-200/50 text-gray-700 hover:bg-gray-300 rounded-xl transition border border-gray-200"><X size={16} /></button>
                                     </div>
                                  </div>
                               </motion.div>
                             ) : (
                               <motion.div 
                                 key="standard-mode"
                                 initial={{ opacity: 0 }} 
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 className="flex gap-2"
                               >
                                 <button onClick={() => handleAction(item.id, "use")} className={`flex-1 py-3 rounded-xl border ${style.btnBg} text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2`}>
                                    <Minus size={12} /> Use
                                 </button>
                                 <button onClick={() => handleAction(item.id, "half")} className={`flex-1 py-3 rounded-xl border ${style.btnBg} text-[11px] font-black uppercase tracking-widest transition`}>Half</button>
                                 
                                 <button onClick={() => setAdjustingId(item.id)} className="w-11 h-11 rounded-xl bg-white border border-[#450920]/20 text-[#450920]/60 flex items-center justify-center hover:bg-gray-50 hover:text-[#450920] transition shadow-sm">
                                    <Edit2 size={14} />
                                 </button>
                                 
                                 <button onClick={() => deleteItem(item.id)} className="w-11 h-11 rounded-xl bg-[#cf3053]/10 border border-[#cf3053]/30 text-[#cf3053] flex items-center justify-center hover:bg-[#cf3053] hover:text-white transition shadow-sm">
                                    <Trash size={14} />
                                 </button>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                     </div>
                  );


                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.05 }} 
                      key={item.id}
                      className="h-[320px] rounded-[32px] overflow-hidden relative"
                    >
                        <MagicCard 
                          className={`w-full h-full rounded-[32px] shadow-xl border-2 ${style.border} relative overflow-hidden`}
                          gradientFrom="#da627d"
                          gradientTo="#450920"
                          backgroundColor={style.bg}
                        >
                          <BorderBeam size={250} duration={12} colorFrom="#da627d" colorTo="#450920" />
                          {cardContent}
                        </MagicCard>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
         </div>
      </main>

      <footer className="w-full bg-[#1d070c] py-14 px-6 md:px-12 text-[#fffbfa] mt-20 relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#f9dbbd]/70 font-semibold font-sans">
           <div className="w-full md:w-2/3">
              <FallingText 
                text="© 2026 FoodPrint. Save food, save money, save the planet. 100% Free Web App. No credit card required."
                trigger="auto"
                fontSize="14px"
                backgroundColor="transparent"
              />
           </div>
           <div className="flex gap-6 justify-center md:justify-end w-full md:w-1/3">
              <span className="hover:text-[#da627d] transition-colors">Privacy</span>
              <span className="hover:text-[#da627d] transition-colors">Terms</span>
              <span className="hover:text-[#da627d] transition-colors">Support</span>
           </div>
        </div>
      </footer>

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <BatchBreakdown
        isOpen={!!viewingBatchesItem}
        onClose={() => setViewingBatchesItem(null)}
        itemName={viewingBatchesItem?.name || ""}
        unit={viewingBatchesItem?.unit || ""}
        batches={viewingBatchesItem?.batches || []}
      />
    </div>
  );
}
