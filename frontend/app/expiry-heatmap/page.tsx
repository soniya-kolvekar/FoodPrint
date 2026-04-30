"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Calendar, AlertCircle, ChefHat, CheckCircle2, ChevronRight, LayoutGrid, Flame, Clock, ThermometerSnowflake, X, Upload, Sparkles, Filter, Plus, Save, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Orb } from "@/components/ui/Orb";
import { MagicCard } from "@/components/ui/MagicCard";
import { BorderBeam } from "@/components/ui/BorderBeam";
import GooeyNav from "@/components/ui/GooeyNav";

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
  stable: "#be416f"    // Berry Crush 500
};

export default function ExpiryHeatmap() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({ name: "", quantity: 1, unit: "pieces", daysToExpiry: 3 });
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const daysA = getDaysRemaining(getSoonestExpiry(a));
      const daysB = getDaysRemaining(getSoonestExpiry(b));
      return daysA - daysB;
    });

  const handleSuggestRecipe = () => {
    const atRisk = filteredItems.find(item => getDaysRemaining(getSoonestExpiry(item)) <= 3);
    if (atRisk) {
      router.push(`/recipes?ingredient=${encodeURIComponent(atRisk.name)}`);
    } else {
      router.push("/recipes");
    }
  };

  const handleGalleryClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedFileUrl(url);
      setShowAddModal(true);
    }
  };

  const saveDynamicItem = () => {
    if (!newItemData.name) return;
    setUploading(true);
    setShowAddModal(false);

    // Simulate processing
    setTimeout(() => {
      const newItem: PantryItem = {
        id: `new-${Date.now()}`,
        name: newItemData.name,
        quantity: newItemData.quantity,
        unit: newItemData.unit,
        expiry: new Date(Date.now() + 86400000 * newItemData.daysToExpiry).toISOString(),
        imageUrl: selectedFileUrl || undefined
      };
      setItems(prev => [newItem, ...prev]);
      setUploading(false);
      setSuccess(true);
      setNewItemData({ name: "", quantity: 1, unit: "pieces", daysToExpiry: 3 });
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#fffbfa] text-[#1d070c] overflow-x-hidden font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <Orb hue={0.94} saturation={0.8} brightness={0.4} />

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-10 inset-x-0 mx-auto z-[200] max-w-sm px-6 py-4 rounded-2xl bg-apricot-500 text-white flex items-center gap-4 shadow-3xl font-bold uppercase tracking-widest text-[12px]">
            <CheckCircle2 size={24} />
            Inventory Updated Successfully
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC UPLOAD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-bordeaux-950/20 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-apricot-100 rounded-[48px] overflow-hidden shadow-3xl"
            >
              <div className="p-10 text-bordeaux-800">
                <h2 className="text-[32px] font-serif mb-8">Identify <span className="italic opacity-40">Ingredient</span></h2>

                <div className="space-y-6">
                  <div className="relative h-48 rounded-3xl overflow-hidden border border-apricot-100 mb-8 bg-apricot-50/30">
                    <img src={selectedFileUrl!} className="w-full h-full object-contain" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300">Ingredient Name</label>
                    <input
                      autoFocus
                      className="w-full bg-white border border-apricot-100 rounded-2xl px-6 py-4 outline-none focus:border-apricot-500 transition text-bordeaux-800"
                      placeholder="What is this?"
                      value={newItemData.name}
                      onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300">Quantity</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-apricot-100 rounded-2xl px-6 py-4 outline-none text-bordeaux-800"
                        value={newItemData.quantity}
                        onChange={(e) => setNewItemData({ ...newItemData, quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300">Unit</label>
                      <input
                        className="w-full bg-white border border-apricot-100 rounded-2xl px-6 py-4 outline-none text-bordeaux-800"
                        value={newItemData.unit}
                        onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300">Expires In (Days)</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-apricot-100 rounded-2xl px-6 py-4 outline-none text-bordeaux-800"
                      value={newItemData.daysToExpiry}
                      onChange={(e) => setNewItemData({ ...newItemData, daysToExpiry: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button onClick={saveDynamicItem} className="flex-1 bg-apricot-500 py-5 rounded-2xl font-black uppercase tracking-widest text-[12px] text-white hover:bg-bordeaux-800 transition flex items-center justify-center gap-3">
                    <Save size={16} /> Save Item
                  </button>
                  <button onClick={() => setShowAddModal(false)} className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-bordeaux-300 hover:text-bordeaux-800 transition">
                    <X size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-10 pt-10 pb-40">
        {/* NAVIGATION */}
        <div className="mb-12 flex justify-between items-center">
          <div className="inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
            <GooeyNav items={[{ label: "← Dashboard", href: "/dashboard" }]} />
          </div>
        </div>

        <div className="max-w-[700px] mb-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-1 bg-gradient-to-r from-apricot-500 to-transparent"></div>
              <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-bordeaux-300">Freshness Tracker</span>
            </div>
            <h1 className="text-[72px] font-serif leading-none tracking-tight mb-10 text-bordeaux-800">Expiry <span className="italic font-normal text-apricot-500">Heatmap</span></h1>
            <p className="text-[22px] text-bordeaux-600/50 leading-relaxed font-serif italic max-w-lg">
              "Don't let your food become a memory. Track the heat, save the treat."
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 mb-20 items-stretch">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-[24px] border border-apricot-100 shadow-sm group-focus-within:border-apricot-500 transition-all duration-500"></div>
            <div className="relative flex items-center px-8 py-7">
              <Search className="text-bordeaux-200 mr-4" size={24} />
              <input
                type="text"
                placeholder="Search inventory..."
                className="bg-transparent text-bordeaux-800 outline-none w-full text-[18px] font-medium placeholder:text-bordeaux-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <button
              onClick={handleGalleryClick}
              disabled={uploading}
              className="px-10 rounded-[24px] bg-white/60 backdrop-blur-md border border-apricot-100 hover:bg-white transition flex items-center gap-4 text-[14px] font-black uppercase tracking-widest group shadow-sm disabled:opacity-50 min-w-[240px] text-bordeaux-800"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-apricot-200 border-t-apricot-500 rounded-full animate-spin"></div>
              ) : (
                <Upload size={18} className="text-apricot-500 group-hover:scale-110 transition" />
              )}
              {uploading ? "Analyzing Signals..." : "Stock Upload"}
            </button>
            <button
              onClick={handleSuggestRecipe}
              className="px-10 rounded-[24px] bg-apricot-500 hover:bg-bordeaux-800 transition flex items-center gap-4 text-[14px] font-black uppercase tracking-widest text-white shadow-xl transition-all duration-500"
            >
              <Sparkles size={18} />
              Suggest Recipe
            </button>
          </div>
        </div>

        <div className="flex gap-8 mb-16 px-2 overflow-x-auto pb-4 scrollbar-hide">
          {Object.entries(PALETTE).map(([key, color]) => (
            <div key={key} className="flex items-center gap-3 whitespace-nowrap">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-bordeaux-300">{key} Zone</span>
            </div>
          ))}
        </div>

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

                    <div className="p-10 flex-1 flex flex-col justify-between relative z-10">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-60 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border border-dashed border-apricot-100 flex items-center justify-center opacity-20 mb-10">
              <Filter size={40} className="text-apricot-300" />
            </div>
            <p className="text-[24px] font-serif italic text-bordeaux-300 text-center">No matching biological signals detected.</p>
          </motion.div>
        )}
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
    </div>
  );
}
