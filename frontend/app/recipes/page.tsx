"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Search, ChefHat, Clock, ArrowLeft, Wand2, Heart, Flame, Soup, Coffee, Cookie, Loader2, Sparkles, Filter } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const tastes = ["Any", "Sweet", "Spicy", "Savory", "Healthy"];
const meals = ["Any", "Breakfast", "Lunch", "Dinner", "Snack"];


export default function Recipes() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState("Any");
  const [taste, setTaste] = useState("Any");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // 1. Real-time Pantry Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "pantry", user.uid, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPantryItems(items);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Automated Recipe Rescue Trigger
  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    if (pantryItems.length > 0) {
      const fetchWithGuard = async () => {
        if (!active) return;
        setLoading(true);
        try {
          const token = await user?.getIdToken();
          // Clean list
          const ingredients = pantryItems.map(item => (item as any).name).filter(Boolean).join(",");
          
          const queryParams = new URLSearchParams({
            ingredients,
            mealType: mealType !== "Any" ? mealType.toLowerCase() : "",
            taste: taste !== "Any" ? taste.toLowerCase() : ""
          });

          const res = await fetch(`http://localhost:5000/api/recipes?${queryParams}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal
          });

          if (!res.ok) {
            alert("Recipe search encountered an issue (likely API quota). We'll show you cached results if available!");
            if (active) setLoading(false);
            return;
          }
          const data = await res.json();
          if (active) setRecipes(data);
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error("Rescue failed:", error);
          }
        } finally {
          if (active) setLoading(false);
        }
      };
      
      fetchWithGuard();
    } else {
      setRecipes([]);
      setLoading(false);
    }
    
    return () => { 
      active = false; 
      abortController.abort();
    };
  }, [pantryItems, mealType, taste, user]);

  const handleSave = async (recipe: any) => {
    if (!user) return;
    setSavingId(recipe.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/recipes/save", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          title: recipe.title,
          image: recipe.image,
          time: recipe.time,
          servings: recipe.servings
        })
      });

      if (res.ok) {
        alert("Recipe saved to your heart! ❤️");
      }
    } catch (err) {
      alert("Failed to save recipe");
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;


  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-20">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200 shadow-sm backdrop-blur-md">
           <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Link>
        
        <Link href="/substitutes">
           <motion.div 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="relative group cursor-pointer inline-flex items-center"
           >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-[#0d0d12] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium">
                <Wand2 size={18} className="text-pink-400"/> Need Ingredient Substitutes?
              </div>
           </motion.div>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="text-orange-600" size={20} />
             </div>
             <span className="text-orange-600 font-bold tracking-widest text-xs uppercase">Your Personal AI Chef</span>
           </div>
           <h1 className="text-4xl font-black text-bordeaux-800 tracking-tight">Recipe Rescue</h1>
           <p className="text-bordeaux-600 mt-2 text-lg">Strictly using ONLY the <b>{pantryItems.length} items</b> currently in your stock.</p>
        </div>

      </div>
      
      {/* 🧭 FILTER UI */}
      <div className="space-y-6 mb-12">
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
            <Filter size={14} className="mr-2" /> Meal Type
          </h3>
          <div className="flex flex-wrap gap-2">
            {meals.map(m => (
              <button 
                key={m} 
                onClick={() => setMealType(m)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${mealType === m ? 'bg-apricot-400 text-white shadow-lg shadow-apricot-400/30' : 'bg-white text-gray-400 border border-gray-100 hover:border-apricot-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
             <Sparkles size={14} className="mr-2" /> Taste Filter
          </h3>
          <div className="flex flex-wrap gap-2">
            {tastes.map(t => (
              <button 
                key={t} 
                onClick={() => setTaste(t)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${taste === t ? 'bg-[#ff6670] text-white shadow-lg shadow-berry-400/30' : 'bg-white text-gray-400 border border-gray-100 hover:border-berry-100'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <Loader2 className="text-apricot-400 animate-spin" size={48} />
           <p className="font-bold text-gray-400 animate-pulse">Calculating possible matches...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[40px] border border-dashed border-gray-300">
           <ChefHat size={64} className="mx-auto text-gray-300 mb-6" />
           <h2 className="text-2xl font-bold text-gray-400 mb-2">No 100% matches found</h2>
           <p className="text-gray-400 mb-8 max-w-sm mx-auto">Try adding more pantry items or relaxing your "Taste" filters. Strict matching requires all items to be present!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {recipes.map((r, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }} 
                key={r.id}
              >
                <Card className="p-0 overflow-hidden hover:shadow-2xl transition-all border-0 shadow-lg bg-white rounded-3xl group h-full flex flex-col">
                    <div className="h-56 w-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                      <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <button 
                        onClick={() => handleSave(r)}
                        className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md z-20 transition-all ${savingId === r.id ? 'bg-gray-200 animate-pulse' : 'bg-white/80 hover:bg-[#ff6670] hover:text-white text-[#ff6670]'}`}
                      >
                         <Heart size={20} fill={savingId === r.id ? "currentColor" : "none"} />
                      </button>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md uppercase font-black tracking-tighter">Powered by {r.source}</span>
                           </div>
                           <h3 className="text-2xl font-black text-bordeaux-800 leading-tight">{r.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-sm mb-6 line-clamp-2 italic">"{r.summary}"</p>

                      <div className="flex gap-4 mb-4">
                        <div className={`${r.matchPercentage === 100 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'} px-4 py-2 rounded-2xl flex items-center gap-2`}>
                           <ChefHat size={16} />
                           <span className="font-bold text-xs uppercase tracking-wider">
                              {r.matchPercentage}% Match
                           </span>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 rounded-2xl flex items-center gap-2">
                           <Clock size={16} className="text-gray-400" />
                           <span className="text-gray-600 font-bold text-xs">{r.time}</span>
                        </div>
                      </div>

                      {/* Missing Ingredients Highlight */}
                      {r.missedIngredients.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Still Need:</h4>
                           <div className="flex flex-wrap gap-2">
                              {r.missedIngredients.slice(0, 3).map((ing: string) => (
                                <span key={ing} className="text-[11px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full capitalize">
                                  {ing}
                                </span>
                              ))}
                              {r.missedIngredients.length > 3 && (
                                <span className="text-[11px] font-bold text-red-400 px-1">+{r.missedIngredients.length - 3} more</span>
                              )}
                           </div>
                        </div>
                      )}

                      <div className="mt-auto">
                         <Button className="w-full h-14 rounded-2xl font-bold bg-[#ff6670] border-0 hover:shadow-xl hover:shadow-berry-400/30 transition-all hover:scale-[1.02]">
                            Start Cooking
                         </Button>
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
