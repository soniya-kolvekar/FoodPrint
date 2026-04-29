"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CopyPlus, ArrowLeft, Loader2, Navigation, Map as MapIcon, Share2, Layers, Utensils, Phone, Tag } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import GooeyNav from "@/components/ui/GooeyNav";
import { MagicCard } from "@/components/ui/MagicCard";
import { FoodReflectiveCard } from "@/components/ui/FoodReflectiveCard";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import ShareFoodModal from "@/components/community/ShareFoodModal";
import FallingText from "@/components/ui/FallingText";

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
          <div className="pointer-events-auto mb-4 inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
            <GooeyNav items={[{ label: "← Dashboard", href: "/dashboard" }]} />
          </div>
          <MagicCard 
            className="rounded-[32px] shadow-2xl pointer-events-auto max-w-sm"
            gradientFrom="#da627d"
            gradientTo="#450920"
          >
            <div className="p-8 flex flex-col">
              <h1 className="text-4xl font-black text-[#450920] mb-2 leading-none flex items-center gap-3 font-sans">
                Local <MapIcon size={28} className="text-[#a53860]" />
              </h1>
              <p className="text-[13px] font-medium text-[#450920]/70 mb-6">Discover {filteredItems.length} active sharing spots in your neighborhood to prevent food waste.</p>
              
              {/* Filters */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a53860] ml-1">Search Radius</span>
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
          </MagicCard>
        </div>

        {/* Global Stats / Share Button */}
        <div className="pointer-events-auto flex flex-col items-end gap-3">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-[#450920] text-white hover:bg-[#a53860] px-8 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all duration-300 shadow-lg group hover:scale-105 border-none"
           >
             <Share2 size={18} className="group-hover:rotate-12 transition-transform" />
             Share Excess Food
           </button>
           
           <MagicCard 
              className="rounded-[24px] shadow-xl"
              gradientFrom="#da627d"
              gradientTo="#450920"
            >
              <div className="px-8 py-6 flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-black text-bordeaux-800 leading-none">{filteredItems.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e98016]">Nearby Items</span>
                </div>
                <div className="w-12 h-12 bg-blush-50 rounded-2xl flex flex-col items-center justify-center text-bordeaux-300">
                  <Layers size={20} />
                </div>
              </div>
            </MagicCard>
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
      <div className="w-[450px] shrink-0 bg-[#fff5f7] border-l border-[#450920]/10 flex flex-col z-[40] shadow-[-10px_0_40px_rgba(69,9,32,0.05)] h-full overflow-hidden font-sans">
        <div className="p-8 border-b border-[#450920]/10 bg-[#fffbfa] shadow-sm shrink-0">
          <h2 className="text-3xl font-black text-[#450920] mb-2 flex items-center gap-2 tracking-tight font-sans">
             Community <span className="italic font-light text-[#a53860]">Share</span>
          </h2>
          <p className="text-[13px] font-bold text-[#450920]/60 uppercase tracking-wider">Connect & Share</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-bordeaux-300 font-bold uppercase tracking-widest text-xs">
              No items nearby
            </div>
          ) : (
            filteredItems.map((cItem, i) => (
              <FoodReflectiveCard key={cItem.id || i} item={cItem} />
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
