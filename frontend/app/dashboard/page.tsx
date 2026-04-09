"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Minus, Trash, ArrowLeft, Loader2, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

   useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "pantry", user.uid, "items"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(rawItems);
      setDataLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);
  const updateQuantity = async (id: string, currentQty: number, adjustment: number) => {
    if (!user) return;
    const newQty = Math.max(0, currentQty + adjustment);
    const itemRef = doc(db, "pantry", user.uid, "items", id);

    if (newQty === 0) {
      await deleteDoc(itemRef);
    } else {
      await updateDoc(itemRef, { quantity: newQty });
    }
    // Note: No ui state setting here. onSnapshot handles it perfectly in real-time!
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "pantry", user.uid, "items", id));
  };

  const calculateExpiryColor = (expiry: string) => {
     if (!expiry) return "bg-gray-100 text-gray-600";
     // Placeholder basic logic - expand with date-fns if wanted
     return "bg-red-100 text-red-600"; 
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
           <Button variant="outline" className="rounded-xl border-dashed">
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
                    
                    {item.expiry && (
                       <span className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold rounded-full shadow-lg ${calculateExpiryColor(item.expiry)}`}>
                         Exp: {item.expiry}
                       </span>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-bordeaux-800 capitalize mb-1 truncate">{item.name}</h3>
                    <p className="text-bordeaux-500 font-medium text-sm mb-4">{item.quantity} {item.unit}</p>
                    
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" onClick={() => updateQuantity(item.id, item.quantity, -1)} className="flex-1 px-0 py-2 h-10 border-apricot-300 text-apricot-700 hover:bg-apricot-50"><Minus size={16} className="mr-1" /> Use</Button>
                      <Button variant="outline" onClick={() => updateQuantity(item.id, item.quantity, -(item.quantity * 0.5))} className="flex-1 px-0 py-2 h-10 border-apricot-300 text-apricot-700 hover:bg-apricot-50">Half</Button>
                      <Button onClick={() => deleteItem(item.id)} variant="outline" className="flex-1 px-0 py-2 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"><Trash size={16} /></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
