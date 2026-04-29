"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SoftAurora from "@/components/ui/SoftAurora";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { MagicCard } from "@/components/ui/MagicCard";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f8] flex items-center justify-center px-4 relative overflow-hidden font-sans selection:bg-[#da627d]/20">
       <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.35]">
         <SoftAurora color1="#ffa5ab" color2="#f9dbbd" speed={0.4} brightness={1.3} />
       </div>
       
       <motion.div 
         initial={{ scale: 0.95, opacity: 0 }} 
         animate={{ scale: 1, opacity: 1 }} 
         transition={{ duration: 0.4 }} 
         className="w-full max-w-md relative z-10 -mt-24"
       >
         <SpotlightCard
           showBorderBeam={true}
           beamColorFrom="#ffa5ab"
           beamColorTo="#f9dbbd"
           className="w-full rounded-[40px] shadow-2xl overflow-hidden"
         >
           <MagicCard 
             mode="gradient"
             gradientFrom="#da627d"
             gradientTo="#ffa5ab"
             backgroundColor="#6b1538"
             className="w-full p-10 rounded-[40px] border-2 border-[#ffa5ab]/30 flex flex-col"
           >
             <div className="text-center mb-8 relative z-40">
               <h2 className="text-[32px] font-black text-[#fffbfa] tracking-tight">Create Account</h2>
               <p className="text-[#ffa5ab] mt-2 font-medium">Join FoodPrint to start saving food</p>
             </div>
             
             {error && <div className="p-3 mb-4 text-sm font-bold text-red-200 bg-red-950/60 border border-red-800/60 rounded-2xl relative z-40">{error}</div>}
             
             <form onSubmit={handleSignup} className="flex flex-col gap-5 relative z-40">
               <div>
                 <label className="block text-sm font-extrabold text-[#ffa5ab] mb-1.5 ml-1">Full Name</label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={e => setName(e.target.value)}
                   className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 placeholder-white/30"
                   placeholder="Your Name"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-extrabold text-[#ffa5ab] mb-1.5 ml-1">Email</label>
                 <input 
                   type="email" 
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 placeholder-white/30"
                   placeholder="your@email.com"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-extrabold text-[#ffa5ab] mb-1.5 ml-1">Password</label>
                 <input 
                   type="password" 
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#da627d]/50 placeholder-white/30"
                   placeholder="••••••••"
                   required
                   minLength={6}
                 />
               </div>
               <Button type="submit" className="w-full mt-4 h-12 bg-[#da627d] hover:bg-[#a53860] text-white font-black rounded-full shadow-lg shadow-[#da627d]/20 cursor-pointer transition-all border-0 text-base">Sign Up</Button>
             </form>
             
             <div className="mt-6 text-center text-sm text-[#fffbfa]/70 font-medium relative z-40">
               Already have an account?{" "}
               <a href="/login" className="text-[#ffa5ab] font-extrabold hover:underline">Log in</a>
             </div>
           </MagicCard>
         </SpotlightCard>
       </motion.div>
    </div>
  );
}
