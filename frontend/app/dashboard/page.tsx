"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Minus, Trash, ArrowLeft, Loader2, ScanLine, Edit2, Info, Check, X } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import { BatchBreakdown } from "@/components/dashboard/BatchBreakdown";



export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
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
    if (!user) return;
    
    const q = query(collection(db, "pantry", user.uid, "items"), orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      // CLIENT-SIDE SMART MERGE
      const merged: any[] = [];
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

  const calculateExpiryColor = (expiry: string | null) => {
     if (!expiry) return "bg-gray-100 text-gray-600";
     const diff = new Date(expiry).getTime() - new Date().getTime();
     const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
     
     if (days <= 0) return "bg-red-100 text-red-600";
     if (days <= 3) return "bg-orange-100 text-orange-600";
     return "bg-green-100 text-green-600"; 
  };


  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200">
           <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-bordeaux-800">Your Pantry</h1>
          <p className="text-bordeaux-600 mt-2">Manage your items and prevent waste</p>
        </div>
        <div className="flex gap-3">
           <Button onClick={() => router.push("/scan")} className="rounded-xl shadow-apricot-400/40 bg-apricot-400 hover:bg-apricot-500 text-white border-0">
             <ScanLine size={18} className="mr-2" /> Smart Scan
           </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              variant="outline" 
              className="rounded-xl border-dashed border-2 hover:border-apricot-400 hover:text-apricot-600 transition-all"
            >
              <Plus size={18} className="mr-2" /> Add Item
            </Button>
        </div>
      </div>

      {!dataLoaded ? (
        <div className="flex justify-center py-20">
           <Loader2 className="animate-spin text-apricot-400" size={48} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[40px] border border-dashed border-gray-300">
           <ScanLine size={64} className="mx-auto text-gray-300 mb-6" />
           <h2 className="text-2xl font-bold text-gray-400 mb-2">Your pantry is empty</h2>
           <p className="text-gray-400 mb-8 max-w-sm mx-auto">Scan your first grocery receipt to instantly magically populate your inventory.</p>
           <Button onClick={() => router.push("/scan")} className="bg-[#ff6670] border-0 text-white hover:scale-105 shadow-xl transition-all h-14 px-8 rounded-full text-lg font-bold">
              Scan Receipt Now
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }} 
                key={item.id}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden p-0 border-0 shadow-lg bg-white relative group">
                  <div className="h-40 w-full bg-cover bg-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                     <img 
                      src={item.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 delay-100" 
                    />
                    
                    {getSoonestExpiry(item) && (
                       <span className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold rounded-full shadow-lg ${calculateExpiryColor(getSoonestExpiry(item))}`}>
                         Exp: {getSoonestExpiry(item)}
                       </span>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-bold text-bordeaux-800 capitalize truncate flex-1">{item.name}</h3>
                      {item.batches && item.batches.length > 1 && (
                        <button 
                          onClick={() => setViewingBatchesItem(item)}
                          className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center hover:bg-blue-100 transition-colors"
                        >
                          <Info size={10} className="mr-1" /> {item.batches.length} Batches
                        </button>
                      )}
                    </div>
                    <p className="text-bordeaux-500 font-medium text-sm mb-4">{item.quantity} {item.unit}</p>
                    
                    <div className="flex flex-col gap-2 relative h-[100px] justify-end">
                       <AnimatePresence mode="wait">
                        {adjustingId === item.id ? (
                          <motion.div 
                            key="deduct-mode"
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-50 p-2 rounded-2xl border border-gray-200 flex flex-col gap-2 absolute inset-0 z-10"
                          >
                             <div className="flex gap-2 h-full">
                                <input 
                                  autoFocus
                                  type="number" 
                                  step="0.01"
                                  placeholder="Amount..."
                                  value={deductValue}
                                  onChange={(e) => setDeductValue(e.target.value)}
                                  className="flex-1 bg-white border-2 border-gray-100 text-sm px-3 rounded-xl outline-none focus:border-apricot-400 transition-colors font-bold text-bordeaux-800"
                                />
                                <div className="flex flex-col gap-1">
                                  <Button onClick={() => handleAdjust(item.id)} className="h-full px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl"><Check size={18} /></Button>
                                  <Button onClick={() => setAdjustingId(null)} className="h-full px-4 bg-gray-200 text-gray-500 hover:bg-gray-300 rounded-xl"><X size={18} /></Button>
                                </div>
                             </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="standard-mode"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2 w-full h-12"
                          >
                            <Button variant="outline" onClick={() => handleAction(item.id, "use")} className="flex-1 px-0 py-2 h-12 border-apricot-300 text-apricot-700 hover:bg-apricot-50 shadow-sm font-bold active:scale-95 transition-all"><Minus size={16} className="mr-1" /> Use</Button>
                            <Button variant="outline" onClick={() => handleAction(item.id, "half")} className="flex-1 px-0 py-2 h-12 border-apricot-300 text-apricot-700 hover:bg-apricot-50 shadow-sm font-bold active:scale-95 transition-all">Half</Button>
                            <Button variant="outline" onClick={() => setAdjustingId(item.id)} className="flex-none w-12 h-12 p-0 border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center rounded-xl active:scale-95 transition-all"><Edit2 size={18} /></Button>
                            <Button onClick={() => deleteItem(item.id)} variant="outline" className="flex-none w-12 h-12 p-0 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center rounded-xl active:scale-95 transition-all"><Trash size={18} /></Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>

                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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


