"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import GooeyNav from "@/components/ui/GooeyNav";
import FallingText from "@/components/ui/FallingText";
import { Search, ChefHat, Clock, ArrowLeft, Wand2, Heart, Flame, Soup, Coffee, Cookie, Loader2, Sparkles, Filter } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { MagicCard } from "@/components/ui/MagicCard";
import { BorderBeam } from "@/components/ui/BorderBeam";

const tastes = ["Any", "Sweet", "Spicy", "Savory", "Healthy"];
const meals = ["Any", "Breakfast", "Lunch", "Dinner", "Snack"];

const cardStyles = [
  { bg: "#fef2e7", border: "border-[#f9dbbd]", text: "text-[#450920]", textMuted: "text-[#a53860]/80", btnBg: "bg-[#450920]/5 border-[#450920]/10 text-[#450920] hover:bg-[#450920]/10" },
  { bg: "#ffe5e7", border: "border-[#ffa5ab]/60", text: "text-[#450920]", textMuted: "text-[#a53860]/80", btnBg: "bg-[#a53860]/5 border-[#a53860]/10 text-[#450920] hover:bg-[#a53860]/10" },
  { bg: "#fcecee", border: "border-[#da627d]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80", btnBg: "bg-[#da627d]/5 border-[#da627d]/10 text-[#450920] hover:bg-[#da627d]/10" },
  { bg: "#f9ebf0", border: "border-[#a53860]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80", btnBg: "bg-[#a53860]/5 border-[#a53860]/10 text-[#450920] hover:bg-[#a53860]/10" },
  { bg: "#f8eaec", border: "border-[#450920]/30", text: "text-[#450920]", textMuted: "text-[#a53860]/80", btnBg: "bg-[#450920]/5 border-[#450920]/10 text-[#450920] hover:bg-[#450920]/10" },
];


export default function Recipes() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState("Any");
  const [taste, setTaste] = useState("Any");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
 
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchSavedRecipes = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:5000/api/recipes/saved", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedRecipes(data);
      }
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  };

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
      const isAlreadySaved = savedRecipes.some(r => r.recipeId.toString() === recipe.id.toString());

      if (isAlreadySaved) {
        const res = await fetch(`http://localhost:5000/api/recipes/saved/${recipe.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setSavedRecipes(savedRecipes.filter(r => r.recipeId.toString() !== recipe.id.toString()));
        }
      } else {
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
          setSavedRecipes([...savedRecipes, { recipeId: recipe.id }]);
        }
      }
    } catch (err) {
      alert("Failed to update favorite");
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;


  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  return (
    <div className="min-h-screen bg-[#fffbfa] text-[#450920] relative overflow-x-hidden font-sans flex flex-col selection:bg-[#da627d]/20">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.3]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#ffa5ab]/20 rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#f9dbbd]/30 rounded-full blur-[180px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <main className="flex-grow w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-[40px] pb-32 relative z-10">
        <div className="mb-6 flex justify-between items-center">
        <div className="inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
          <GooeyNav items={[{ label: "← Dashboard", href: "/dashboard" }]} />
        </div>
        
        <div className="inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
          <GooeyNav items={[{ label: "✨ Find Substitutes", href: "/substitutes" }]} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
           <h1 className="text-4xl font-black text-bordeaux-800 tracking-tight">Recipe Rescue</h1>
           <p className="text-bordeaux-600 mt-2 text-lg">Strictly using ONLY the <b>{pantryItems.length} items</b> currently in your stock.</p>
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
            {recipes.map((r, i) => {
              const style = cardStyles[i % cardStyles.length];
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }} 
                  key={r.id}
                  className="h-[650px] rounded-[32px] overflow-hidden relative"
                >
                  <MagicCard 
                    className={`w-full h-full rounded-[32px] shadow-xl border-2 ${style.border} relative overflow-hidden flex flex-col p-0`}
                    gradientFrom="#da627d"
                    gradientTo="#450920"
                    backgroundColor={style.bg}
                  >
                    <BorderBeam size={250} duration={12} colorFrom="#da627d" colorTo="#450920" borderRadius={32} />
                    <div className="h-56 w-full overflow-hidden relative shrink-0">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                      <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <button 
                        onClick={() => handleSave(r)}
                        className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md z-20 transition-all ${savingId === r.id ? 'bg-gray-200 animate-pulse' : savedRecipes.some(liked => liked.recipeId.toString() === r.id.toString()) ? 'bg-[#ff6670] text-white' : 'bg-white/80 hover:bg-[#ff6670] hover:text-white text-[#ff6670]'}`}
                      >
                         <Heart size={20} fill={savedRecipes.some(liked => liked.recipeId.toString() === r.id.toString()) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    
                    <div className={`p-8 flex-1 flex flex-col relative z-30 ${style.text}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                           <h3 className="text-2xl font-black leading-tight text-[#450920] capitalize tracking-tight">{r.title}</h3>
                        </div>
                      </div>
                      
                      <p className={`${style.textMuted} text-sm mb-6 line-clamp-3 font-medium`}>"{r.summary}"</p>

                      <div className="flex gap-4 mb-4">
                        <div className={`${r.matchPercentage === 100 ? 'bg-green-50/80 text-green-700 border border-green-200' : 'bg-orange-50/80 text-orange-700 border border-orange-200'} px-4 py-2 rounded-2xl flex items-center gap-2`}>
                           <ChefHat size={16} />
                           <span className="font-bold text-xs uppercase tracking-wider">
                              {r.matchPercentage}% Match
                           </span>
                        </div>
                        <div className="bg-white/50 border border-gray-200 px-4 py-2 rounded-2xl flex items-center gap-2">
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
                         <Button className={`w-full h-12 rounded-2xl font-bold border-0 text-white bg-gradient-to-r from-[#da627d] to-[#ffa5ab] hover:shadow-xl transition-all hover:scale-[1.02]`}>
                            Start Cooking
                         </Button>
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      </main>
      {/* FOOTER */}
      <footer className="w-full bg-[#1d070c] py-14 px-6 md:px-12 text-[#fffbfa] mt-auto relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#f9dbbd]/70 font-semibold font-sans">
           <div className="w-full md:w-2/3">
              <span>© 2026 FoodPrint. Save food, save money, save the planet. 100% Free Web App. No credit card required.</span>
           </div>
           <div className="flex gap-6 justify-center md:justify-end w-full md:w-1/3">
              <span className="hover:text-[#da627d] transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-[#da627d] transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-[#da627d] transition-colors cursor-pointer">Support</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
