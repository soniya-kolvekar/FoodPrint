"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, User, Mail, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 mt-12 min-h-[80vh]">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200">
           <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
      </div>

      <div className="mb-10">
         <h1 className="text-4xl font-black text-bordeaux-800">Your Profile</h1>
         <p className="text-bordeaux-600 mt-2 font-medium">Manage your account and preferences.</p>
      </div>

      <Card className="p-10 rounded-[40px] border border-black/5 bg-white shadow-xl group hover:shadow-2xl transition-all">
         <div className="flex items-center gap-6 mb-10 pb-10 border-b border-black/5">
            <div className="w-24 h-24 rounded-full bg-[#fdf2e8] flex items-center justify-center text-[#e98016] shadow-sm transform group-hover:scale-105 transition-transform duration-500">
               <User size={40} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-bordeaux-800">{user.displayName || "Home Chef"}</h2>
               <div className="flex items-center text-gray-500 font-semibold mt-1">
                 <Mail size={16} className="mr-2" /> {user.email}
               </div>
               <div className="flex items-center text-green-600 font-bold mt-3 text-sm bg-green-50 w-fit px-3 py-1.5 rounded-full">
                 <ShieldCheck size={16} className="mr-1" /> Account Verified
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-bordeaux-800 mb-2">Account Actions</h3>
            <Button variant="outline" className="w-full md:w-auto self-start justify-start text-[#a52742] font-bold border-black/10 hover:bg-[#fff5f7]">Manage Notifications</Button>
            <Button variant="outline" className="w-full md:w-auto self-start justify-start text-[#a52742] font-bold border-black/10 hover:bg-[#fff5f7]">Dietary Preferences</Button>
         </div>
      </Card>
    </div>
  );
}
