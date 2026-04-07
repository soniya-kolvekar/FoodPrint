"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative mt-12 pb-12">
       <div className="absolute top-[20%] right-[30%] w-64 h-64 bg-apricot-200 blur-[100px] rounded-full opacity-40 z-[-1]" />
       
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
         <Card className="p-8 border border-black/5 rounded-[32px] shadow-xl hover:shadow-2xl transition-all bg-white bg-opacity-90 backdrop-blur-md">
           <div className="text-center mb-8">
             <h2 className="text-3xl font-black text-bordeaux-800">Create Account</h2>
             <p className="text-bordeaux-600 mt-2 font-medium">Join FoodPrint to start saving food</p>
           </div>
           
           {error && <div className="p-3 mb-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>}
           
           <form onSubmit={handleSignup} className="flex flex-col gap-5">
             <div>
               <label className="block text-sm font-bold text-bordeaux-800 mb-1.5 ml-1">Full Name</label>
               <input 
                 type="text" 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-apricot-400 font-medium transition-all"
                 required
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-bordeaux-800 mb-1.5 ml-1">Email</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-apricot-400 font-medium transition-all"
                 required
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-bordeaux-800 mb-1.5 ml-1">Password</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-apricot-400 font-medium transition-all"
                 required
                 minLength={6}
               />
             </div>
             <Button type="submit" className="w-full mt-4 h-14 text-lg font-bold shadow-[0_8px_25px_rgba(233,128,22,0.3)] bg-gradient-to-r from-[#e98016] to-[#ff6670] border-0 rounded-[20px] transition-transform hover:scale-105 text-white">Sign Up</Button>
           </form>
           
           <div className="mt-6 text-center text-[15px] text-bordeaux-700 font-medium">
             Already have an account? <a href="/login" className="text-[#e98016] font-bold hover:underline transition-colors">Log in</a>
           </div>
         </Card>
       </motion.div>
    </div>
  );
}
