"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ExpiryHeatmap() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  const days = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-04-${(i + 1).toString().padStart(2, '0')}`,
    expiringItems: Math.floor(Math.random() * 5)
  }));

  const getColor = (count: number) => {
    if (count === 0) return "bg-white/50 border-white/40 text-bordeaux-800";
    if (count === 1) return "bg-apricot-200 border-apricot-300 text-apricot-900";
    if (count === 2) return "bg-cotton-300 border-cotton-400 text-cotton-900";
    return "bg-berry-500 border-berry-600 text-white";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200">
           <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
      </div>
      <div className="mb-12">
         <h1 className="text-4xl font-bold text-bordeaux-800">Expiry Heatmap</h1>
         <p className="text-bordeaux-600 mt-2">Visualize when your food goes bad to plan your meals.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-7 gap-3 mb-8">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
           <div key={day} className="text-center font-semibold text-bordeaux-500 mb-2">{day}</div>
        ))}
        {days.map((d, i) => (
           <div 
             key={i} 
             className={`h-24 rounded-2xl border p-2 flex flex-col justify-between transition-transform hover:scale-105 cursor-pointer backdrop-blur-sm shadow-sm ${getColor(d.expiringItems)}`}
           >
             <span className="text-sm font-bold opacity-80">{i + 1}</span>
             {d.expiringItems > 0 && (
                <span className="text-xs font-semibold px-2 py-1 bg-black/20 rounded-lg w-fit">
                   {d.expiringItems} Items
                </span>
             )}
           </div>
        ))}
      </motion.div>
    </div>
  );
}
