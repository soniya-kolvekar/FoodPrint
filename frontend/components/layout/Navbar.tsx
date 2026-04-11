"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export const Navbar = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        className={cn(
          "text-[14px] transition-all relative pb-1 pt-1 block font-black uppercase tracking-[0.2em]",
          isActive ? "text-[#ff3341]" : "text-gray-400 hover:text-[#ff3341]"
        )}
      >
        {children}
        {isActive && (
          <motion.div layoutId="navbar-indicator" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#ff3341] rounded-full shadow-[0_0_10px_rgba(255,51,65,0.5)]" />
        )}
      </Link>
    );
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur-2xl shadow-xl py-4" : "bg-transparent py-8"
      )}
    >
      <div className="mx-auto max-w-[1400px] flex items-center justify-between px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group min-w-[180px]">
          <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border border-black/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <div className="w-6 h-6 bg-gradient-to-tr from-[#ff3341] to-[#ee9944] rounded-sm animate-pulse"></div>
          </div>
          <span className="text-[26px] font-black tracking-tighter italic text-black">
            FoodPrint
          </span>
        </Link>
        
        {/* Center Links - Spaced out more to avoid congestion */}
        <div className="hidden lg:flex gap-16 items-center">
           <NavLink href="/dashboard">Dashboard</NavLink>
           <NavLink href="/recipes">Recipes</NavLink>
           <NavLink href="/expiry-heatmap">Automatic Analysis</NavLink>
           <NavLink href="/community">Community</NavLink>
        </div>

        {/* Right Nav Auth Control - Fixed Spacing */}
        <div className="flex gap-8 items-center min-w-[200px] justify-end">
           {!user ? (
             <>
               <Link href="/login" className="text-[12px] font-black uppercase tracking-widest text-black/40 hover:text-[#ff3341] transition-colors">Log in</Link>
               <Link href="/signup">
                 <button className="bg-[#ff3341] hover:bg-black text-white rounded-2xl px-8 py-3.5 shadow-2xl font-black uppercase tracking-widest text-[11px] transition-all duration-300">
                   Sign up
                 </button>
               </Link>
             </>
           ) : (
             <div className="flex items-center gap-6">
                <Link href="/profile" className="group">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center border border-black/5 group-hover:border-[#ff3341] transition shadow-sm">
                        <span className="text-[12px] font-bold">P</span>
                     </div>
                     <span className="text-[13px] font-black uppercase tracking-widest text-black/60 group-hover:text-[#ff3341] transition">Profile</span>
                  </div>
                </Link>
                <div className="w-[1px] h-6 bg-black/5"></div>
                <button onClick={handleSignOut} className="text-[11px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">
                  Logout
                </button>
             </div>
           )}
        </div>
      </div>
    </motion.nav>
  );
};
