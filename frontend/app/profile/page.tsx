"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import GooeyNav from "@/components/ui/GooeyNav";
import { Mail, Heart, Trash, Clock, ChefHat, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import TiltedCard from "@/components/ui/TiltedCard";
import ElasticSlider from "@/components/ui/ElasticSlider";
import SoftAurora from "@/components/ui/SoftAurora";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({ name: "", age: "", bio: "", gender: "", culinaryLevel: 1 });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || user?.displayName || "",
          age: data.age || "",
          bio: data.bio || "",
          gender: data.gender || "",
          culinaryLevel: data.culinaryLevel || 1
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:5000/api/users/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
    <div className="min-h-screen bg-[#fff7f8] text-[#450920] relative overflow-x-hidden font-sans flex flex-col selection:bg-[#da627d]/20">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.3]">
        <SoftAurora 
          color1="#ffa5ab" 
          color2="#f9dbbd"
          brightness={1.2}
          speed={0.4}
        />
      </div>

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 pb-32 relative z-10">
      <div className="mb-12">
        <div className="inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
          <GooeyNav items={[{ label: "← Dashboard", href: "/dashboard" }]} />
        </div>
      </div>

      <div className="flex flex-col gap-28">
        {/* Top: User Card */}
        <div className="w-full max-w-xl mx-auto">
           <div className="flex items-center justify-center mb-8">
              <h2 className="text-[36px] font-black text-[#450920] tracking-tight font-sans">My Profile</h2>
           </div>

           <TiltedCard 
             containerHeight="660px"
             containerWidth="100%"
             imageHeight="630px"
             imageWidth="100%"
             scaleOnHover={1.03}
             showTooltip={false}
             showMobileWarning={false}
             displayOverlayContent={true}
             overlayContent={
               <div className="w-full h-full p-10 rounded-[40px] border-2 border-[#ffa5ab]/60 bg-[#ffd1d5] shadow-2xl hover:shadow-berry-900/30 transition-all relative overflow-hidden flex flex-col z-10">
                 <div className="flex flex-col items-center mb-8 pb-6 border-b border-black/5 relative mt-2">
                    <div className="w-28 h-28 rounded-full bg-[#fffbfa] flex items-center justify-center text-[#da627d] shadow-inner transform hover:rotate-6 transition-transform duration-500 mb-4 border border-[#ffa5ab]/40">
                       <ChefHat size={48} />
                    </div>
                    
                    {!isEditing ? (
                      <>
                        <h2 className="text-3xl font-black text-[#450920] text-center capitalize">{profile.name || "Home Chef"}</h2>
                        <div className="flex items-center text-[#a53860]/80 font-semibold mt-1 text-sm">
                          <Mail size={14} className="mr-2 text-[#da627d]" /> {user.email}
                        </div>
                      </>
                    ) : (
                      <div className="w-full text-center">
                        <label className="text-xs font-bold text-[#a53860]/60 uppercase tracking-widest block mb-1 text-left">Name</label>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full p-3 border border-[#ffa5ab]/40 rounded-2xl text-[#450920] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 mb-1 bg-white"
                          placeholder="Enter your name"
                        />
                      </div>
                    )}

                    <button 
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      disabled={saving}
                      className="absolute top-0 right-0 px-4 py-1.5 rounded-full bg-[#da627d]/10 text-[#da627d] text-xs font-black tracking-wider uppercase hover:bg-[#da627d] hover:text-white transition-all cursor-pointer border-0"
                    >
                      {saving ? <Loader2 className="animate-spin mx-auto" size={14} /> : isEditing ? "Save" : "Edit"}
                    </button>
                 </div>

                 <div className="flex flex-col gap-5 text-sm font-sans text-[#450920]">
                    {!isEditing ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#a53860]/60 uppercase tracking-wider text-xs">Age</span>
                          <span className="font-extrabold text-[#450920]">{profile.age || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#a53860]/60 uppercase tracking-wider text-xs">Gender</span>
                          <span className="font-extrabold text-[#450920] capitalize">{profile.gender || "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-[#a53860]/60 uppercase tracking-wider text-xs">Bio</span>
                          <span className="font-medium text-[#450920]/80 leading-relaxed bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-[#ffa5ab]/40 italic">{profile.bio || "just a lowkey chef"}</span>
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-2 border-t border-black/5 pt-4">
                          <span className="font-bold text-[#a53860]/60 uppercase tracking-wider text-xs flex justify-between items-center">
                            <span>Culinary Level</span>
                            <span className="text-[#da627d] font-black">{profile.culinaryLevel}%</span>
                          </span>
                          <div className="w-full h-3 bg-[#450920]/10 rounded-full overflow-hidden border border-black/5">
                            <div className="h-full bg-gradient-to-r from-[#da627d] to-[#ffa5ab] rounded-full" style={{ width: `${profile.culinaryLevel}%` }}></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-bold text-[#a53860]/60 uppercase tracking-wider block mb-1">Age</label>
                          <input 
                            type="number" 
                            value={profile.age}
                            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                            className="w-full p-3 border border-[#ffa5ab]/40 rounded-2xl text-[#450920] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 bg-white"
                            placeholder="Enter age"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#a53860]/60 uppercase tracking-wider block mb-1">Gender</label>
                          <select 
                            value={profile.gender}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="w-full p-3 border border-[#ffa5ab]/40 rounded-2xl text-[#450920] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 bg-white"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#a53860]/60 uppercase tracking-wider block mb-1">Bio</label>
                          <textarea 
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            className="w-full p-3 border border-[#ffa5ab]/40 rounded-2xl text-[#450920] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 h-24 resize-none bg-white"
                            placeholder="Tell us about yourself"
                          />
                        </div>

                        <div className="mt-2 border-t border-black/5 pt-4 flex flex-col items-center">
                          <label className="text-xs font-bold text-[#a53860]/60 uppercase tracking-wider block mb-4 w-full text-left">Culinary Level</label>
                          <ElasticSlider 
                            defaultValue={profile.culinaryLevel}
                            startingValue={0}
                            maxValue={100}
                            className="w-full flex-grow mt-2"
                            onChange={(val) => setProfile(prev => ({ ...prev, culinaryLevel: Math.round(val) }))}
                            leftIcon={<ChefHat size={16} className="text-[#a53860]" />}
                            rightIcon={<ChefHat size={24} className="text-[#da627d]" />}
                          />
                        </div>
                      </>
                    )}
                 </div>
               </div>
             }
           />
        </div>

        {/* Bottom: Saved Recipes Section */}
        <div className="w-full">
            <div className="flex items-center gap-4 mb-4 justify-center">
               <div className="p-3 bg-[#ffe5e7] rounded-2xl border border-[#ffa5ab]/40">
                  <Heart className="text-[#da627d]" size={24} fill="currentColor" />
               </div>
               <h2 className="text-[32px] font-black text-[#450920] tracking-tight font-sans">Saved Recipes</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                 <Loader2 className="animate-spin text-[#da627d]" size={40} />
              </div>
            ) : savedRecipes.length === 0 ? (
              <div className="text-center py-24 bg-[#fef2e7]/40 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-[#f9dbbd] max-w-2xl mx-auto">
                 <ChefHat size={48} className="mx-auto text-[#a53860]/40 mb-4" />
                 <p className="text-[#450920]/70 font-bold text-lg mb-6">You haven't saved any recipes yet.</p>
                 <Link href="/recipes">
                    <Button className="bg-[#da627d] hover:bg-[#a53860] text-white h-12 px-8 rounded-full font-bold shadow-lg shadow-[#da627d]/20 cursor-pointer">Explore Recipes</Button>
                 </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-12">
                 <AnimatePresence>
                   {savedRecipes.map((r, i) => {
                     const cardStyles = [
                       { bg: "#fef2e7", border: "border-[#f9dbbd]", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#450920] to-[#a53860]" },
                       { bg: "#ffe5e7", border: "border-[#ffa5ab]/60", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#a53860] to-[#da627d]" },
                       { bg: "#fcecee", border: "border-[#da627d]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#da627d] to-[#ffa5ab]" },
                       { bg: "#f9ebf0", border: "border-[#a53860]/40", text: "text-[#450920]", textMuted: "text-[#a53860]/80", iconBg: "from-[#a53860] to-[#450920]" },
                     ];
                     const style = cardStyles[i % cardStyles.length];

                     return (
                       <motion.div 
                         key={r.id}
                         initial={{ opacity: 0, y: 40 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                         className="relative group flex justify-center"
                       >
                         {/* Decorative Hanging Rope (Lanyard) */}
                         <svg className="absolute -top-14 left-1/2 -translate-x-1/2 w-20 h-16 overflow-visible z-0 pointer-events-none" viewBox="0 0 100 100">
                           <motion.path 
                             d="M 50 0 Q 45 40, 50 90" 
                             fill="none" 
                             stroke="#da627d" 
                             strokeWidth="4" 
                             strokeLinecap="round"
                             initial={{ d: "M 50 0 Q 45 40, 50 90" }}
                             whileHover={{ d: "M 50 0 Q 65 50, 50 90" }}
                             transition={{ type: "spring", stiffness: 80 }}
                           />
                           <circle cx="50" cy="0" r="5" fill="#450920" />
                           <circle cx="50" cy="90" r="3.5" fill="#ffa5ab" />
                         </svg>

                         <motion.div 
                           whileHover={{ y: 12, rotate: i % 2 === 0 ? 2 : -2 }}
                           className={`w-full max-w-sm p-6 rounded-[32px] border-2 ${style.border} shadow-xl transition-all relative z-10 overflow-hidden cursor-pointer`}
                           style={{ backgroundColor: style.bg }}
                         >
                           {/* Top clip decoration */}
                           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-gray-300 rounded-b-xl shadow-md flex items-center justify-center z-20">
                             <div className="w-3 h-3 bg-gray-500 rounded-full shadow-inner"></div>
                           </div>

                           <div className="w-full h-48 rounded-[24px] overflow-hidden mb-4 mt-2 relative shadow-inner group-hover:shadow-md transition-all">
                              <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute top-3 right-3 z-30">
                                <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     removeRecipe(r.id);
                                   }}
                                   className="p-2.5 text-[#cf3053] hover:bg-[#cf3053] hover:text-white transition-all bg-white/90 backdrop-blur-sm rounded-full shadow-sm cursor-pointer flex items-center justify-center border-0"
                                 >
                                  <Trash size={14} />
                                </button>
                              </div>
                           </div>

                           <div className="flex flex-col gap-2">
                              <h3 className={`font-black ${style.text} text-xl line-clamp-2 leading-tight tracking-tight`}>{r.title}</h3>
                              <div className="flex items-center text-xs font-extrabold text-gray-400 gap-3 bg-white/60 backdrop-blur-md rounded-full px-4 py-2 w-fit border border-black/5 mt-1">
                                 <span className="flex items-center text-[#a53860]"><Clock size={12} className="mr-1.5" /> {r.time}</span>
                              </div>
                           </div>
                         </motion.div>
                       </motion.div>
                     );
                   })}
                 </AnimatePresence>
              </div>
            )}
        </div>
      </div>
      </main>
      {/* FOOTER */}
      <footer className="w-full bg-[#1d070c] py-14 px-6 md:px-12 text-[#fffbfa] mt-20 relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#f9dbbd]/70 font-semibold font-sans">
           <div className="w-full md:w-2/3">
               <span>© 2026 FoodPrint. Save food, save money, save the planet. 100% Free Web App. No credit card required.</span>
           </div>
           <div className="flex gap-6 justify-center md:justify-end w-full md:w-1/3">
              <span className="hover:text-[#da627d] transition-colors">Privacy</span>
              <span className="hover:text-[#da627d] transition-colors">Terms</span>
              <span className="hover:text-[#da627d] transition-colors">Support</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
