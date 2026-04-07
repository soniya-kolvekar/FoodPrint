"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Search, ChefHat, Clock, ArrowLeft } from "lucide-react";

export default function Recipes() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const [query, setQuery] = useState("milk, eggs, flour");

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;
  // dummy matched recipes
  const [recipes, setRecipes] = useState([
    { id: 1, title: "Fluffy Pancakes", usedIngredients: 3, missedIngredients: 1, time: "25m", image: "https://images.unsplash.com/photo-1528207776546-ac648836eb10?w=500&q=80" },
    { id: 2, title: "Classic French Omelette", usedIngredients: 2, missedIngredients: 0, time: "10m", image: "https://images.unsplash.com/photo-1510693593635-49814407b1a7?w=500&q=80" }
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200">
           <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
      </div>
      <div className="mb-12">
         <h1 className="text-4xl font-bold text-bordeaux-800">Recipe Rescue</h1>
         <p className="text-bordeaux-600 mt-2">Discover what you can cook right now with your pantry stock.</p>
      </div>
      
      <div className="flex w-full mb-10 h-14">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-6 rounded-l-2xl border-y border-l border-white/40 bg-white/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-apricot-400"
        />
        <Button className="rounded-l-none rounded-r-2xl h-14 px-8">
           <Search className="mr-2" /> Find Recipes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((r, i) => (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={r.id}>
             <Card className="p-0 overflow-hidden hover:shadow-2xl transition-all hover:shadow-berry-300/30">
                <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${r.image})` }} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-bordeaux-800 mb-2">{r.title}</h3>
                  <div className="flex gap-4 text-sm font-medium text-bordeaux-500 mb-6">
                    <span className="flex items-center"><ChefHat size={16} className="mr-1"/> {r.usedIngredients} from pantry</span>
                    <span className="flex items-center"><Clock size={16} className="mr-1"/> {r.time}</span>
                  </div>
                  <Button className="w-full h-12">Cook & Deduct</Button>
                </div>
             </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
