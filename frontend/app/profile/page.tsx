"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, User, Mail, ShieldCheck, Heart, Trash, Clock, ChefHat, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const removeRecipe = async (id: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:5000/api/recipes/saved/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedRecipes(savedRecipes.filter(r => r.id !== id));
      }
    } catch (err) {
      alert("Failed to remove recipe");
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading profile...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-32">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200">
           <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: User Card */}
        <div className="w-full lg:w-1/3">
           <Card className="p-10 rounded-[40px] border-0 bg-white shadow-xl group hover:shadow-2xl transition-all h-fit">
              <div className="flex flex-col items-center mb-10 pb-10 border-b border-black/5">
                 <div className="w-32 h-32 rounded-full bg-[#fdf2e8] flex items-center justify-center text-[#e98016] shadow-inner transform group-hover:rotate-6 transition-transform duration-500 mb-6">
                    <User size={56} />
                 </div>
                 <h2 className="text-3xl font-black text-bordeaux-800 text-center">{user.displayName || "Home Chef"}</h2>
                 <div className="flex items-center text-gray-500 font-semibold mt-2">
                   <Mail size={16} className="mr-2" /> {user.email}
                 </div>
                 <div className="flex items-center text-green-600 font-bold mt-4 text-sm bg-green-50 w-fit px-4 py-2 rounded-full">
                   <ShieldCheck size={16} className="mr-2" /> Verified Chef
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Settings</h3>
                 <Button variant="outline" className="w-full justify-start text-bordeaux-700 font-bold border-gray-100 hover:bg-gray-50 rounded-2xl h-12">Dietary Preferences</Button>
                 <Button variant="outline" className="w-full justify-start text-bordeaux-700 font-bold border-gray-100 hover:bg-gray-50 rounded-2xl h-12">Notification Center</Button>
              </div>
           </Card>
        </div>

        {/* Right: Saved Recipes Section */}
        <div className="flex-1">
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-100 rounded-2xl">
                 <Heart className="text-red-500" size={24} fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black text-bordeaux-800 tracking-tight">Saved Recipes</h2>
           </div>

           {loading ? (
             <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[#ff6670]" size={40} />
             </div>
           ) : savedRecipes.length === 0 ? (
             <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-gray-200">
                <ChefHat size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold text-lg mb-6">You haven't saved any recipes yet.</p>
                <Link href="/recipes">
                   <Button className="bg-[#ff6670] h-12 px-8 rounded-full font-bold shadow-lg shadow-berry-400/20">Explore Recipes</Button>
                </Link>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {savedRecipes.map((r, i) => (
                    <motion.div 
                      key={r.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="flex gap-4 p-4 rounded-3xl border-0 shadow-md group hover:shadow-xl transition-all bg-white overflow-hidden relative">
                         <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                            <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         </div>
                         <div className="flex flex-col justify-between py-1 flex-1 pr-10">
                            <div>
                               <h3 className="font-black text-bordeaux-800 text-lg line-clamp-2 leading-tight mb-2 group-hover:text-[#ff6670] transition-colors">{r.title}</h3>
                               <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                  <span className="flex items-center"><Clock size={12} className="mr-1" /> {r.time}</span>
                                  <span className="flex items-center"><ChefHat size={12} className="mr-1" /> {r.servings} serving</span>
                               </div>
                            </div>
                            <Link href={`/recipes/${r.recipeId}`}>
                               <Button variant="outline" className="h-8 px-4 rounded-full text-xs font-black border-red-50 hover:bg-red-50 hover:text-[#ff6670]">View Recipe</Button>
                            </Link>
                         </div>
                         <button 
                            onClick={() => removeRecipe(r.id)}
                            className="absolute top-4 right-4 p-2 text-gray-200 hover:text-red-500 transition-colors bg-gray-50 rounded-full"
                          >
                           <Trash size={16} />
                         </button>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
