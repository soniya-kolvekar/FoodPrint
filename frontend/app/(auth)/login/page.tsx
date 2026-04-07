"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
       <div className="absolute top-[20%] left-[30%] w-64 h-64 bg-berry-200 blur-[100px] rounded-full opacity-40 z-[-1]" />
       
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
         <Card className="p-8">
           <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-bordeaux-800">Welcome Back</h2>
             <p className="text-bordeaux-600 mt-2">Log in to manage your smart pantry</p>
           </div>
           
           {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-lg">{error}</div>}
           
           <form onSubmit={handleLogin} className="flex flex-col gap-5">
             <div>
               <label className="block text-sm font-medium text-bordeaux-800 mb-1">Email</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-apricot-400"
                 required
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-bordeaux-800 mb-1">Password</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-apricot-400"
                 required
               />
             </div>
             <Button type="submit" className="w-full mt-4 h-12 text-lg">Log In</Button>
           </form>
           
           <div className="mt-6 text-center text-sm text-bordeaux-700">
             Don't have an account? <a href="/signup" className="text-berry-600 font-semibold hover:underline">Sign up</a>
           </div>
         </Card>
       </motion.div>
    </div>
  );
}
