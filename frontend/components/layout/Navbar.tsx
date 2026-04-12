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
          "text-[15px] transition-colors relative pb-1 pt-1 block font-medium",
          isActive ? "text-[#e98016]" : "text-gray-500 hover:text-[#290a11]"
        )}
      >
        {children}
        {isActive && (
          <motion.div layoutId="navbar-indicator" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#e98016] rounded-full" />
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
        scrolled ? "bg-[#fffbfa]/95 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
      )}
    >
      <div className="mx-auto max-w-[1240px] flex items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group min-w-[200px]">
          <div className="bg-white w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-black/5 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
            <img src="/logo.png" alt="FoodPrint Logo" className="w-[140%] h-[140%] max-w-none object-cover flex-shrink-0" />
          </div>
          <span className="text-[22px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#e98016] to-[#cf3053]">
            FoodPrint
          </span>
        </Link>
        
        {/* Center Links */}
        <div className="hidden md:flex gap-12 items-center">
           <NavLink href="/dashboard">Dashboard</NavLink>
           <NavLink href="/recipes">Recipes</NavLink>
           <NavLink href="/expiry-heatmap">Analysis</NavLink>
           <NavLink href="/community">Community</NavLink>
        </div>

        {/* Right Nav Auth Control */}
        <div className="flex gap-4 items-center min-w-[200px] justify-end">
           {!user ? (
             <>
               <Link href="/login" className="text-[14px] font-bold text-[#a52742] hover:text-[#ff6670] transition-colors px-2">Log in</Link>
               <Link href="/signup">
                 <Button className="bg-[#e98016] hover:bg-[#cc6f13] text-white rounded-full px-7 py-2.5 shadow-[0_4px_14px_rgba(233,128,22,0.3)] font-bold text-[14px]">
                   Sign up
                 </Button>
               </Link>
             </>
           ) : (
             <>
               <Link href="/profile" className="text-[15px] font-bold text-[#a52742] hover:text-[#ff6670] transition-colors px-4">Profile</Link>
               <Button onClick={handleSignOut} variant="outline" className="rounded-full px-6 py-2 border-[#fbe6d0] text-[#a52742] font-semibold text-[14px] hover:bg-[#fbe6d0]/40 transition-colors">
                 Sign out
               </Button>
             </>
           )}
        </div>
      </div>
    </motion.nav>
  );
};
