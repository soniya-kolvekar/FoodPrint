"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Camera, Upload, ArrowLeft } from "lucide-react";

export default function Scan() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-center flex flex-col items-center min-h-[80vh] justify-center relative">
        <div className="absolute top-8 left-6 z-10">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
             <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-bordeaux-800 mb-4">Scan Grocery Receipt</h1>
        <p className="text-bordeaux-600 mb-10 max-w-lg">
          Point your camera at a receipt or upload a picture. We will automatically extract your purchased items and add them to your pantry.
        </p>

        <motion.div 
           initial={{ scale: 0.95, opacity: 0 }} 
           animate={{ scale: 1, opacity: 1 }}
           className="w-full max-w-md aspect-[3/4] rounded-3xl border-4 border-dashed border-apricot-300 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-apricot-200/20 to-transparent group-hover:translate-y-full transition-transform duration-1000 ease-in-out h-[200%] top-[-100%]" />
          
          <Camera size={64} className="text-apricot-400 mb-6" />
          <Button variant="primary" className="mb-4 w-full">Open Camera</Button>
          <Button variant="outline" className="w-full"><Upload className="mr-2" size={18} /> Upload Image</Button>
        </motion.div>
    </div>
  );
}
