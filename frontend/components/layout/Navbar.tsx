"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import CardNav from "@/components/ui/CardNav";

export const Navbar = () => {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const logo = (
    <Link href="/" className="flex items-center gap-3 group min-w-[150px]">
      <div className="bg-white w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-black/5 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
        <img src="/logo.png" alt="FoodPrint Logo" className="w-[140%] h-[140%] max-w-none object-cover flex-shrink-0" />
      </div>
      <span className="text-[20px] font-black tracking-tight text-[#fffbfa]">
        FoodPrint
      </span>
    </Link>
  );

  const actionButton = (
    <div className="flex gap-3 items-center justify-end">
      {!user ? (
        <>
          <Link href="/login" className="text-[14px] font-bold text-[#fffbfa] hover:text-[#f9dbbd] transition-colors px-2">Log in</Link>
          <Link href="/signup">
            <Button className="bg-white hover:bg-[#f9dbbd] text-[#450920] rounded-full px-5 py-1.5 shadow-[0_4px_14px_rgba(255,255,255,0.2)] font-bold text-[14px] h-auto">
              Sign up
            </Button>
          </Link>
        </>
      ) : (
        <>
          <Button onClick={handleSignOut} variant="outline" className="rounded-full px-5 py-1.5 border-white/30 text-[#fffbfa] font-semibold text-[14px] hover:bg-white/10 transition-colors h-auto bg-white/5">
            Sign out
          </Button>
        </>
      )}
    </div>
  );

  const items = [
    {
      label: "Tools",
      bgColor: "rgba(255, 255, 255, 0.6)",
      textColor: "#450920",
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Pantry Analysis", href: "/expiry-heatmap" }
      ]
    },
    {
      label: "Cooking", 
      bgColor: "rgba(255, 255, 255, 0.6)",
      textColor: "#450920",
      links: [
        { label: "Recipes", href: "/recipes" }
      ]
    },
    {
      label: "Social",
      bgColor: "rgba(255, 255, 255, 0.6)", 
      textColor: "#450920",
      links: [
        { label: "Community", href: "/community" },
        { label: "Profile", href: "/profile" }
      ]
    }
  ];

  return (
    <CardNav
      logo={logo}
      items={items}
      actionButton={actionButton}
      baseColor="rgba(69, 9, 32, 0.4)"
      menuColor="#fffbfa"
    />
  );
};
