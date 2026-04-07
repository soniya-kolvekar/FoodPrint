"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Share2, MapPin, ArrowLeft } from "lucide-react";

export default function Community() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200">
           <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
      </div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-bordeaux-800">Community Share</h1>
          <p className="text-bordeaux-600 mt-2">Have extra food? Share it with neighbors to prevent waste.</p>
        </div>
        <Button variant="primary"><Share2 size={18} className="mr-2" /> Share Food</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[1, 2, 3].map((item, i) => (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}>
             <Card className="hover:-translate-y-1 transition-transform">
                <div className="h-40 w-full rounded-xl bg-gray-200 mb-4 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80)" }} />
                <h3 className="text-xl font-bold text-bordeaux-800">Organic Apples</h3>
                <p className="text-bordeaux-500 font-medium mb-3">3 lbs remaining • Pick up only</p>
                <div className="flex items-center text-sm text-apricot-700 mb-6 bg-apricot-50 p-2 rounded-lg">
                  <MapPin size={16} className="mr-2"/> 1.2 miles away
                </div>
                <Button variant="outline" className="w-full">Request Item</Button>
             </Card>
           </motion.div>
         ))}
      </div>
    </div>
  );
}
