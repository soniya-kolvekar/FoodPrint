"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CopyPlus, ArrowLeft, Loader2, Navigation, Map as MapIcon, Share2, Layers, Utensils, Phone, Tag } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import ShareFoodModal from "@/components/community/ShareFoodModal";

const MapOverlay = dynamic(() => import("@/components/community/MapComponent"), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50">
      <Loader2 className="animate-spin text-apricot-400 mb-4" size={40} />
      <p className="text-bordeaux-300 font-bold uppercase tracking-widest text-sm">Loading Neural Map...</p>
    </div>
  ) 
});

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function Community() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Request Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {
          // Silent catch for Geolocation to prevent console spam
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    const q = query(collection(db, "sharedFood"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter items by radius when user location or radius changes
  useEffect(() => {
    if (userLocation) {
      const filtered = items.filter(item => {
        const dist = calculateDistance(userLocation[0], userLocation[1], item.lat, item.lng);
        return dist <= radiusKm;
      });
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [items, userLocation, radiusKm]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Authenticating...</div>;
  }

  return (
    <div className="relative w-full flex flex-row bg-[#fffbfa] overflow-hidden" style={{ height: "calc(100vh - 110px)" }}>
      
      {/* LEFT CONTENT: MAP & FLOATING OVERLAYS */}
      <div className="flex-1 relative h-full z-0">
        {/* Floating Header */}
        <div className="absolute top-8 left-8 right-8 z-[50] flex justify-between items-start pointer-events-none">
        <div>
          <Link href="/" className="pointer-events-auto inline-flex items-center text-[12px] font-black uppercase tracking-widest text-bordeaux-400 hover:text-apricot-500 transition-colors bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl shadow-sm border border-apricot-100 mb-4 group">
             <ArrowLeft size={16} className="mr-3 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-apricot-100 shadow-xl pointer-events-auto max-w-sm">
             <h1 className="text-4xl font-serif font-bold text-bordeaux-800 mb-2 leading-none flex items-center gap-3">
               Local <MapIcon size={28} className="text-apricot-500" />
             </h1>
             <p className="text-[13px] font-medium text-bordeaux-400 mb-6">Discover {filteredItems.length} active sharing spots in your neighborhood to prevent food waste.</p>
             
             {/* Filters */}
             <div className="flex flex-col gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-apricot-600 ml-1">Search Radius</span>
               <div className="flex bg-apricot-50/50 p-1 rounded-xl border border-apricot-100">
                 {[2, 5, 10, 50].map((r) => (
                   <button
                     key={r}
                     onClick={() => setRadiusKm(r)}
                     className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${radiusKm === r ? "bg-white text-apricot-600 shadow-sm" : "text-bordeaux-300 hover:text-bordeaux-500"}`}
                   >
                     {r}km
                   </button>
                 ))}
               </div>
             </div>
          </div>
        </div>

        {/* Global Stats / Share Button */}
        <div className="pointer-events-auto flex flex-col items-end gap-3">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-white border-2 border-bordeaux-800 text-bordeaux-800 hover:bg-bordeaux-800 hover:text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-colors shadow-lg group"
           >
             <Share2 size={18} className="group-hover:rotate-12 transition-transform" />
             Share Excess Food
           </button>
           
           <div className="bg-gradient-to-br from-apricot-500 to-[#cf3053] p-[2px] rounded-[24px] shadow-xl">
             <div className="bg-white/95 backdrop-blur-md rounded-[22px] px-8 py-6 flex items-center gap-6">
               <div className="flex flex-col items-end">
                 <span className="text-3xl font-black text-bordeaux-800 leading-none">{filteredItems.length}</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#e98016]">Nearby Items</span>
               </div>
               <div className="w-12 h-12 bg-blush-50 rounded-2xl flex flex-col items-center justify-center text-bordeaux-300">
                 <Layers size={20} />
               </div>
             </div>
           </div>
         </div>
       </div>

        {/* Full Screen Map */}
        <div className="absolute inset-0 z-0">
          <MapOverlay 
            items={filteredItems} 
            userLocation={userLocation} 
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR: COMMUNITY CARDS */}
      <div className="w-[450px] shrink-0 bg-[#fffbfa] border-l border-apricot-100 flex flex-col z-[40] shadow-[-10px_0_30px_rgba(233,128,22,0.02)] h-full overflow-hidden">
        <div className="p-8 border-b border-apricot-100 bg-white shadow-sm shrink-0">
          <h2 className="text-3xl font-serif font-bold text-bordeaux-800 mb-2 flex items-center gap-3">
             Community <span className="italic font-normal opacity-40">Share</span>
          </h2>
          <p className="text-[13px] font-medium text-bordeaux-400">View contact details and claim shared items from your neighbors.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-bordeaux-300 font-bold uppercase tracking-widest text-xs">
              No items nearby
            </div>
          ) : (
            filteredItems.map((cItem, i) => (
              <div key={cItem.id || i} className="bg-white rounded-[32px] p-6 border border-apricot-100 shadow-[0_10px_40px_rgba(233,128,22,0.04)] flex flex-col gap-4 group hover:border-apricot-300 transition-all duration-500">
                <div className="h-40 w-full rounded-2xl overflow-hidden bg-apricot-50 flex items-center justify-center border border-apricot-100/50">
                  {cItem.imageUrl ? (
                    <img src={cItem.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={cItem.title} />
                  ) : (
                    <Utensils className="text-apricot-300" size={36} />
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-bordeaux-800 text-xl truncate pr-2">{cItem.title}</h3>
                    <div className="bg-blush-50 text-[#cf3053] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1 border border-blush-100">
                      <Tag size={10} /> {cItem.price || "Free"}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-5 line-clamp-2">{cItem.description}</p>
                  
                  <div className="flex flex-col gap-2 p-4 bg-apricot-50/50 rounded-2xl border border-apricot-100/50">
                    <div className="flex items-center justify-between text-xs font-bold text-bordeaux-800">
                      <span className="text-[#e98016] uppercase tracking-widest text-[10px]">Donor</span>
                      <span>{cItem.userName || "Neighbor"}</span>
                    </div>
                    {cItem.contactInfo && (
                      <div className="flex items-center justify-between text-xs font-bold text-bordeaux-800 border-t border-apricot-100/50 pt-2 border-dashed">
                        <span className="text-[#e98016] uppercase tracking-widest text-[10px] flex items-center gap-1"><Phone size={10} /> Contact</span>
                        <span className="truncate max-w-[150px]">{cItem.contactInfo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ShareFoodModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userLocation={userLocation}
      />
    </div>
  );
}
