"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Calendar, AlertCircle, ChefHat, CheckCircle2, ChevronRight, LayoutGrid, Flame, Clock, ThermometerSnowflake, X, Upload, Sparkles, Filter, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry: string;
  imageUrl?: string;
}

const PALETTE = {
  critical: "#ff3341", // Cotton Candy 400
  urgent: "#ee9944",   // Soft Apricot 400
  monitor: "#cf3053",  // Blush Rose 500
  stable: "#be416f"    // Berry Crush 500
};

export default function ExpiryHeatmap() {
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
    const fetchItems = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/pantry/items");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems([
            { id: "1", name: "Fresh Milk", quantity: 1, unit: "Litre", expiry: new Date(Date.now() + 86400000 * 2).toISOString(), imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
            { id: "2", name: "Spinach", quantity: 200, unit: "g", expiry: new Date(Date.now() + 86400000 * 1).toISOString(), imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400" },
            { id: "3", name: "Greek Yogurt", quantity: 500, unit: "g", expiry: new Date(Date.now() + 86400000 * 4).toISOString(), imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400" },
            { id: "4", name: "Avocados", quantity: 3, unit: "pieces", expiry: new Date(Date.now() + 86400000 * 6).toISOString(), imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400" },
            { id: "5", name: "Eggs", quantity: 12, unit: "pieces", expiry: new Date(Date.now() + 86400000 * 12).toISOString(), imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },
            { id: "6", name: "Cherries", quantity: 1, unit: "bag", expiry: new Date(Date.now() + 86400000 * 3).toISOString(), imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=500&q=80" }
          ]);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchItems();
  }, []);

  const getDaysRemaining = (expiry: string) => {
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
    .sort((a, b) => getDaysRemaining(a.expiry) - getDaysRemaining(b.expiry));

  const handleSuggestRecipe = () => {
    const atRisk = filteredItems.find(item => getDaysRemaining(item.expiry) <= 3);
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

  return (
    <div className="min-h-screen bg-[#fffbfa] text-[#1d070c] overflow-x-hidden font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

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

      {/* BACK BUTTON */}
      <div className="fixed top-10 left-10 z-[110]">
        <Link href="/dashboard" className="w-14 h-14 rounded-full bg-white backdrop-blur-3xl border border-apricot-100 flex items-center justify-center hover:bg-apricot-50 transition shadow-sm group">
          <ArrowLeft className="group-hover:-translate-x-1 transition text-bordeaux-800" />
        </Link>
      </div>

      <div className="fixed top-10 right-10 z-[110] flex gap-4">
        <div className="hidden md:flex items-center gap-3 px-6 py-3 rounded-full bg-white backdrop-blur-3xl border border-apricot-100 text-[12px] font-bold uppercase tracking-widest text-bordeaux-300 italic">
          <ThermometerSnowflake size={14} className="text-[#ee9944]" />
          Atmospheric Heat: <span className="text-bordeaux-800 ml-2">Normalized</span>
        </div>
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden text-[#e98016]">
        <svg className="w-full h-full opacity-[0.05]" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <motion.circle cx="800" cy="200" r="400" fill="currentColor" animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 15, repeat: Infinity }} />
          <motion.circle cx="100" cy="800" r="300" fill="#ee9944" animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 20, repeat: Infinity }} />
        </svg>
      </div>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-10 pt-[160px] pb-40">
        <div className="max-w-[700px] mb-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-1 bg-gradient-to-r from-apricot-500 to-transparent"></div>
              <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-bordeaux-300">Systemic Analysis</span>
            </div>
            <h1 className="text-[72px] font-serif leading-none tracking-tight mb-10 text-bordeaux-800">Expiry <span className="italic font-normal text-apricot-500">Heatmap</span></h1>
            <p className="text-[22px] text-bordeaux-600/50 leading-relaxed font-serif italic max-w-lg">
              Prioritizing your culinary inventory through thermodynamic urgency data.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 mb-20 items-stretch">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-white rounded-[24px] border border-apricot-100 shadow-sm group-focus-within:border-apricot-500 transition-all duration-500"></div>
            <div className="relative flex items-center px-8 py-7">
              <Search className="text-bordeaux-200 mr-4" size={24} />
              <input
                type="text"
                placeholder="Search ingredient database..."
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
              className="px-10 rounded-[24px] bg-white border border-apricot-100 hover:bg-apricot-50 transition flex items-center gap-4 text-[14px] font-black uppercase tracking-widest group shadow-sm disabled:opacity-50 min-w-[240px] text-bordeaux-800"
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
              const days = getDaysRemaining(item.expiry);
              const { color, label, glow } = getHeatData(days);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.6 }}
                  key={item.id}
                  className="relative group rounded-[48px] overflow-hidden bg-white border border-apricot-100 hover:border-apricot-300 transition-all duration-700 hover:-translate-y-4 shadow-sm hover:shadow-2xl flex flex-col h-[480px]"
                >
                  <div className="relative h-64 overflow-hidden bg-apricot-50/20">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition duration-[2s] scale-100 group-hover:scale-110 opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>

                    <div className="absolute top-8 left-8 flex items-center gap-3 px-5 py-2 rounded-full backdrop-blur-md border bg-white/80 border-apricot-100" style={{ boxShadow: `0 0 20px ${glow}` }}>
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color }}>{label}</span>
                    </div>
                  </div>

                  <div className="p-12 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[32px] font-bold tracking-tight text-bordeaux-800 group-hover:text-apricot-500 transition-colors line-clamp-1">{item.name}</h3>
                        <div className="text-right flex-shrink-0 text-bordeaux-800">
                          <div className="text-[18px] font-bold">{item.quantity}</div>
                          <div className="text-[10px] uppercase font-black tracking-widest text-bordeaux-200">{item.unit}</div>
                        </div>
                      </div>
                      <p className="text-bordeaux-300 text-[14px] font-medium leading-relaxed italic font-serif">Stored in Main Containment Unit</p>
                    </div>

                    <div className="pt-8 border-t border-apricot-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-bordeaux-200 mb-1">Time Remaining</span>
                        <span className="text-[18px] font-bold" style={{ color }}>{days <= 0 ? "Expired" : `${days} Earth Days`}</span>
                      </div>
                      <button className="w-14 h-14 rounded-2xl bg-apricot-50 border border-apricot-100 flex items-center justify-center hover:bg-apricot-500 transition group/btn shadow-sm">
                        <ChevronRight size={24} className="group-hover/btn:translate-x-1 transition text-apricot-300 group-hover:text-white" />
                      </button>
                    </div>
                  </div>
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

      <footer className="w-full border-t border-apricot-100 py-24 px-12 relative z-30 overflow-hidden bg-white/50">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          <div className="flex items-center gap-3 font-bold text-[36px] tracking-tighter italic text-bordeaux-800">
            <div className="w-[24px] h-[24px] rounded-md bg-apricot-500"></div>
            FoodPrint
          </div>
          <div className="flex gap-20 text-[11px] font-black uppercase tracking-[0.4em] text-bordeaux-300">
            <span className="hover:text-apricot-500 cursor-pointer transition">Containment Protocols</span>
            <span className="hover:text-apricot-500 cursor-pointer transition">Thermal Standards</span>
            <span className="hover:text-apricot-500 cursor-pointer transition">Privacy Neural</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
