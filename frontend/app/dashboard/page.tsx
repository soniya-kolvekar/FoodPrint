"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Minus, Trash, Utensils, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
        <Button className="rounded-xl shadow-apricot-400/40">
          <Plus size={18} className="mr-2" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((item, i) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}>
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Utensils size={24} />
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  Expires in 3 days
                </span>
              </div>
              <h3 className="text-xl font-bold text-bordeaux-800">Fresh Milk</h3>
              <p className="text-bordeaux-500 font-medium text-sm mb-4">1 Litre</p>
              
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1 px-0 py-2 h-10 border-apricot-300 text-apricot-700 hover:bg-apricot-50"><Minus size={16} className="mr-1" /> Use</Button>
                <Button variant="outline" className="flex-1 px-0 py-2 h-10 border-apricot-300 text-apricot-700 hover:bg-apricot-50">Half</Button>
                <Button variant="outline" className="flex-1 px-0 py-2 h-10 border-red-200 text-red-600 hover:bg-red-50"><Trash size={16} /></Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
