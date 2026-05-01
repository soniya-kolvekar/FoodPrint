"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import GooeyNav from "@/components/ui/GooeyNav";
import { MagicCard } from "@/components/ui/MagicCard";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { ChevronRight, Utensils, Search } from "lucide-react";

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

const PALETTE = {
  critical: "#ff3341", // Cotton Candy 400
  urgent: "#ee9944",   // Soft Apricot 400
  monitor: "#cf3053",  // Blush Rose 500
  stable: "#10b981"    // Emerald 500 (Green)
};

export default function ExpiryHeatmap() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const normalize = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().trim().replace(/s$/, "");
  };

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
    });
  }, [user]);

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
    if (!expiry) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expiry);
    expiryDate.setHours(0, 0, 0, 0);
    const diff = expiryDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getHeatData = (days: number) => {
    if (days <= 2) return { color: PALETTE.critical, label: "Critical", glow: "rgba(255, 51, 65, 0.4)" };
    if (days <= 5) return { color: PALETTE.urgent, label: "Urgent", glow: "rgba(238, 153, 68, 0.4)" };
    if (days <= 10) return { color: PALETTE.monitor, label: "Monitor", glow: "rgba(207, 48, 83, 0.4)" };
    return { color: PALETTE.stable, label: "Stable", glow: "rgba(190, 65, 111, 0.4)" };
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay()); // go back to Sunday

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    
    let count = 0;
    items.forEach(item => {
      const soonest = getSoonestExpiry(item);
      if (soonest) {
        const expDate = new Date(soonest);
        expDate.setHours(0, 0, 0, 0);
        if (expDate.getTime() === d.getTime()) count++;
      }
    });

    return {
      date: d,
      expiringItems: count,
      isPast: d.getTime() < today.getTime()
    };
  });

  const getCalendarColor = (count: number, isPast: boolean, isSelected: boolean) => {
    let base = "bg-white/60 border-apricot-100 text-bordeaux-800";
    if (isPast) base = "bg-gray-100/30 border-gray-200/50 text-gray-400";
    else if (count === 1) base = "bg-apricot-200/80 border-apricot-300 text-bordeaux-900 shadow-sm hover:bg-apricot-300/80";
    else if (count === 2) base = "bg-[#da627d]/90 border-[#cf3053] text-white shadow-md hover:bg-[#da627d]";
    else if (count > 2) base = "bg-[#450920] border-[#450920] text-white shadow-xl hover:bg-[#450920]/90";
    else if (count === 1) base = "bg-apricot-200/80 border-apricot-300 text-bordeaux-900 shadow-sm";
    else if (count === 2) base = "bg-[#da627d]/90 border-[#cf3053] text-white shadow-md";
    else if (count > 2) base = "bg-[#450920] border-[#450920] text-white shadow-xl";

    if (isSelected) {
      base += " ring-4 ring-offset-2 ring-apricot-500 scale-105 z-10";
    }
    return base;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedDate) {
      const soonest = getSoonestExpiry(item);
      if (!soonest) return false;
      const expDate = new Date(soonest);
      expDate.setHours(0, 0, 0, 0);
      return matchesSearch && expDate.getTime() === selectedDate.getTime();
    }
    
    return matchesSearch;
  }).sort((a, b) => {
    const daysA = getDaysRemaining(getSoonestExpiry(a));
    const daysB = getDaysRemaining(getSoonestExpiry(b));
    return daysA - daysB;
  });

  if (authLoading || !user) return <div className="min-h-screen bg-[#fffbfa]"></div>;

  return (
    <div className="min-h-screen bg-[#fffbfa] text-[#1d070c] overflow-x-hidden font-sans relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <main className="relative z-10 w-full max-w-[1240px] mx-auto px-6 flex flex-col pt-[40px] pb-40">
        <div className="mb-6 flex justify-start w-full">
          <div className="inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
            <GooeyNav items={[{ label: "Dashboard", href: "/dashboard" }]} />
          </div>
        </div>

        <div className="text-center mb-12 flex flex-col items-center">
          <motion.h1
            className="text-[60px] md:text-[84px] font-serif leading-[1.05] tracking-tight mb-[30px] max-w-[1100px] text-bordeaux-800"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          >
            Expiry <span className="text-[#da627d]">Heatmap</span>
          </motion.h1>

          <motion.p
            className="text-[20px] md:text-[22px] text-bordeaux-600/40 font-normal max-w-[900px] mb-[40px] leading-[1.5]"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            Visualize when your food goes bad to plan your meals. <br />
            Don't let your food become a memory. Track the heat, save the treat.
          </motion.p>
        </div>

        {/* CALENDAR GRID */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mb-12 w-full max-w-[1100px] mx-auto">
           <div className="grid grid-cols-7 gap-3 mb-8">
             {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center font-black uppercase tracking-widest text-[11px] text-bordeaux-300 mb-2">{day}</div>
             ))}
             {calendarDays.map((d, i) => {
                const isSelected = selectedDate?.getTime() === d.date.getTime();
                const isEmpty = d.expiringItems === 0 || d.isPast;
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (!isEmpty) setSelectedDate(isSelected ? null : d.date);
                    }}
                    className={`h-28 rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 ${!isEmpty ? 'hover:scale-105 cursor-pointer hover:shadow-lg' : 'cursor-default opacity-80'} backdrop-blur-sm ${getCalendarColor(d.expiringItems, d.isPast, isSelected)}`}
                  >
                    <span className={`text-[14px] font-black ${d.isPast ? 'opacity-50' : ''}`}>{d.date.getDate()}</span>
                    {d.expiringItems > 0 && !d.isPast && (
                       <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1.5 bg-black/20 rounded-xl w-fit flex items-center gap-1.5 text-white shadow-sm backdrop-blur-md">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                          {d.expiringItems} Expiring
                       </div>
                    )}
                  </div>
                );
             })}
           </div>
        </motion.div>

        {/* SEARCH AND ITEMS - ONLY SHOWN WHEN A DATE IS SELECTED */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full"
            >
              {/* LEGEND */}
              <div className="flex flex-wrap gap-8 justify-center mb-12 px-2 overflow-x-auto scrollbar-hide max-w-[1100px] mx-auto">
                {Object.entries(PALETTE).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-3 whitespace-nowrap">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-bordeaux-300">{key} Zone</span>
                  </div>
                ))}
              </div>
              {/* SEARCH BAR */}
              <div className="mb-12 max-w-[1100px] mx-auto w-full">
                <div className="relative flex-1 group">
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-[24px] border border-apricot-100 shadow-sm group-focus-within:border-apricot-500 transition-all duration-500"></div>
                  <div className="relative flex items-center px-8 py-7">
                    <Search className="text-bordeaux-200 mr-4" size={24} />
                    <input
                      type="text"
                      placeholder={`Search items expiring on ${selectedDate.toLocaleDateString()}...`}
                      className="bg-transparent text-bordeaux-800 outline-none w-full text-[18px] font-medium placeholder:text-bordeaux-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ITEMS DISPLAY */}
              <div className="w-full max-w-[1240px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  <AnimatePresence mode="popLayout">
                    {!loading && filteredItems.map((item, idx) => {
                      const soonest = getSoonestExpiry(item);
                      const days = getDaysRemaining(soonest);
                      const { color, label, glow } = getHeatData(days);

                      const cardStyles = [
                        { bg: "#fef2e7", border: "border-[#f9dbbd]", text: "text-[#450920]", textMuted: "text-[#a53860]/80" },
                        { bg: "#ffe5e7", border: "border-[#ffa5ab]/60", text: "text-[#450920]", textMuted: "text-[#a53860]/80" },
                        { bg: "#fcecee", border: "border-[#da627d]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80" },
                        { bg: "#f9ebf0", border: "border-[#a53860]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80" },
                      ];

                      const style = cardStyles[idx % cardStyles.length];

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.6 }}
                          key={item.id}
                          className="h-[480px] rounded-[48px] overflow-hidden relative"
                        >
                          <MagicCard
                            className={`w-full h-full rounded-[48px] shadow-xl border-2 ${style.border} relative overflow-hidden flex flex-col p-0`}
                            gradientFrom="#da627d"
                            gradientTo="#450920"
                            backgroundColor={style.bg}
                          >
                            <BorderBeam size={250} duration={12} colorFrom="#da627d" colorTo="#450920" borderRadius={48} />
                            
                            <div className="relative h-64 overflow-hidden bg-white/20">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition duration-[2s] scale-100 group-hover:scale-110 opacity-90" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-apricot-50/30">
                                  <Utensils size={64} className="text-apricot-200" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent"></div>

                              <div className="absolute top-8 left-8 flex items-center gap-3 px-5 py-2 rounded-full backdrop-blur-md border bg-white/80 border-apricot-100" style={{ boxShadow: `0 0 20px ${glow}` }}>
                                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color }}>{label}</span>
                              </div>
                            </div>

                            <div className="p-10 flex-1 flex flex-col justify-between relative z-10 text-left">
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <h3 className="text-[28px] font-black tracking-tight text-[#450920] line-clamp-1">{item.name}</h3>
                                  <div className="text-right flex-shrink-0 text-[#450920]">
                                    <div className="text-[16px] font-black">{item.quantity}</div>
                                    <div className="text-[9px] uppercase font-black tracking-widest text-[#a53860]/60">{item.unit}</div>
                                  </div>
                                </div>
                                <p className={`text-[13px] ${style.textMuted} font-semibold italic font-serif`}>Added on {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</p>
                              </div>

                              <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-black tracking-widest text-[#a53860]/60 mb-1">Time Remaining</span>
                                  <span className="text-[18px] font-black" style={{ color }}>{days <= 0 ? "Expired" : `${days} Earth Days`}</span>
                                </div>
                                <button className="w-12 h-12 rounded-2xl bg-white/60 border border-black/5 flex items-center justify-center hover:bg-[#450920] transition group/btn shadow-sm">
                                  <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition text-[#a53860] group-hover:text-white" />
                                </button>
                              </div>
                            </div>
                          </MagicCard>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {!loading && filteredItems.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center w-full">
                    <p className="text-[24px] font-serif italic text-bordeaux-300 text-center">
                      No items expiring on {selectedDate.toLocaleDateString()}.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
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
    </div>
  );
}
