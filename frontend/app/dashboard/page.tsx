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
      
      // CLIENT-SIDE SMART MERGE
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
          // Recalculate total quantity
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
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="bg-white text-black py-2.5 px-7 rounded-full text-[13px] font-semibold hover:bg-neutral-200 transition active:scale-95 shadow-xl"
           >
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
                    Your inventory is optimized. {items.filter(item => getDaysRemaining(getSoonestExpiry(item) || "") <= 3).length} items require immediate attention.
                  </p>
               </motion.div>
            </div>
            
            {/* HEATMAP ACTION CARD */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="flex gap-6">
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
               </div>
            </motion.div>
         </div>

         {/* PANTRY GRID */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
               {items.map((item, idx) => {
                 const soonest = getSoonestExpiry(item);
                 const days = soonest ? getDaysRemaining(soonest) : 999;
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
                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[11px] font-bold uppercase tracking-widest ${urgencyColor}`}>
                             {days <= 0 ? "Expired" : `${days} days`}
                          </div>
                          {item.batches && item.batches.length > 1 && (
                            <button 
                              onClick={() => setViewingBatchesItem(item)}
                              className="text-[10px] font-bold text-[#6e56cf] flex items-center gap-1 hover:text-white transition"
                            >
                              <Info size={10} /> {item.batches.length} Batches
                            </button>
                          )}
                        </div>
                     </div>

                     <h3 className="text-[28px] font-bold tracking-tight mb-3 transition group-hover:text-[#6e56cf] truncate capitalize">{item.name}</h3>
                     <p className="text-[16px] text-white/30 font-medium mb-10">{item.quantity} {item.unit}</p>

                     <div className="flex flex-col gap-4">
                        <AnimatePresence mode="wait">
                          {adjustingId === item.id ? (
                            <motion.div 
                              key="deduct-mode"
                              initial={{ scale: 0.9, opacity: 0 }} 
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-4"
                            >
                               <div className="flex gap-2">
                                  <input 
                                    autoFocus
                                    type="number" 
                                    step="0.01"
                                    placeholder="Amount..."
                                    value={deductValue}
                                    onChange={(e) => setDeductValue(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 text-sm px-4 rounded-xl outline-none focus:border-[#6e56cf] transition-colors font-bold text-white"
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleAdjust(item.id)} className="p-3 bg-green-500/20 hover:bg-green-500 text-white rounded-xl transition"><Check size={18} /></button>
                                    <button onClick={() => setAdjustingId(null)} className="p-3 bg-white/5 text-white/40 hover:bg-white/10 rounded-xl transition"><X size={18} /></button>
                                  </div>
                               </div>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="standard-mode"
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex gap-4"
                            >
                              <button onClick={() => handleAction(item.id, "use")} className="flex-1 py-4 px-2 rounded-2xl bg-white/[0.04] border border-white/5 text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition flex items-center justify-center gap-3">
                                 <Minus size={14} /> Use
                              </button>
                              <button onClick={() => handleAction(item.id, "half")} className="flex-1 py-4 px-2 rounded-2xl bg-white/[0.04] border border-white/5 text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition">Half</button>
                              
                              <button onClick={() => setAdjustingId(item.id)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 hover:text-white transition">
                                 <Edit2 size={18} />
                              </button>
                              
                              <button onClick={() => deleteItem(item.id)} className="w-14 h-14 rounded-2xl bg-[#FF512F]/10 border border-[#FF512F]/20 text-[#FF512F] flex items-center justify-center hover:bg-[#FF512F] hover:text-white transition">
                                 <Trash size={18} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                   </motion.div>
                 );
               })}
            </AnimatePresence>

            {/* ADD ITEM PLACEHOLDER */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} 
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 hover:border-[#6e56cf]/40 transition duration-500 cursor-pointer group"
            >
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

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Batch Breakdown Modal */}
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


