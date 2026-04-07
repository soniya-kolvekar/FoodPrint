"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LayoutDashboard, Utensils, Zap, Calendar, Bell, Scan, LineChart, ChefHat, Save, Sparkles, HeartHandshake } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center overflow-x-hidden bg-[#fffbfa]">
      
      {/* Hero Section */}
      <section className="w-full relative px-6 pt-32 pb-48 text-center bg-gradient-to-b from-[#fdf2e8] via-[#faeaee] to-[#fffbfa] relative -mt-32 z-0">
        
        <div className="absolute top-20 left-[-10%] w-96 h-96 bg-[url('https://images.unsplash.com/photo-1547514701-42722101795e?w=500&q=80')] bg-cover opacity-10 rounded-full mix-blend-multiply blur-sm" />
        <div className="absolute top-40 right-[-5%] w-80 h-80 bg-[url('https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=500&q=80')] bg-cover opacity-10 rounded-full mix-blend-multiply blur-[2px]" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-5xl mx-auto mt-24"
        >
          <h1 className="text-6xl md:text-[6.5rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#e98016] to-[#ff6670] leading-[1.05] md:leading-[1.05] mb-8 pb-2 tracking-tighter">
            Track. Cook. Save.<br/>Repeat.
          </h1>
          
          <p className="text-lg md:text-[22px] text-[#531321] max-w-[650px] mx-auto mb-10 font-semibold leading-relaxed">
            The culinary alchemist for your kitchen. Turn aging ingredients into gourmet masterpieces while ending food waste forever.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button className="bg-[#ff6670] hover:bg-[#ff3341] text-white border-0 text-xl px-10 py-7 h-auto rounded-full shadow-[0_8px_25px_rgba(255,102,112,0.4)] font-bold transition-all hover:scale-105 hover:-translate-y-1">
              Rescue My Pantry
            </Button>
            <Button variant="outline" className="text-[#ff6670] border-[3px] border-[#ff6670] bg-transparent hover:bg-[#ff6670]/5 text-xl px-8 py-[1.6rem] h-auto rounded-full font-bold transition-all hover:scale-105">
              See How It Works
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Floating Inventory Card Overlap */}
      <section className="w-full max-w-5xl px-4 -mt-36 relative z-20 mb-32">
        <div className="bg-white/95 backdrop-blur-3xl border border-black/5 p-8 rounded-[48px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#fdf2e8] flex items-center justify-center text-[#e98016] text-xl shadow-sm">
                📦
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#1d070c]">Current Inventory</h3>
                <p className="text-[15px] font-semibold text-gray-400">32 items tracked • 4 expiring soon</p>
              </div>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Avocados", time: "2 Days Left", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&q=80", color: "text-[#cf3053] bg-[#faeaee]" },
                { name: "Strawberries", time: "4 Days Left", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&q=80", color: "text-[#e98016] bg-[#fdf2e8]" },
                { name: "Apples", time: "9 Days Left", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=300&q=80", color: "text-green-600 bg-green-50" },
                { name: "Kale", time: "1 Day Left", image: "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=300&q=80", color: "text-[#cf3053] bg-[#faeaee]" },
              ].map((item, i) => (
                 <div key={i} className="bg-[#faf7f5] rounded-[32px] p-3 border border-black/5 hover:-translate-y-2 hover:shadow-xl transition-all group cursor-pointer">
                    <div className="w-full h-[140px] rounded-[24px] bg-cover bg-center mb-4 overflow-hidden">
                       <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${item.image})` }} />
                    </div>
                    <div className="flex justify-between items-center px-3 pb-1">
                       <span className="font-bold text-[#1d070c] text-[16px]">{item.name}</span>
                       <span className={`text-[11px] font-bold px-2 py-1.5 rounded-lg ${item.color}`}>{item.time}</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Superpowers Section (Bento Grid) */}
      <section className="w-full max-w-6xl px-6 py-16 mb-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-[3rem] font-black text-[#1d070c] mb-6 tracking-tight">Superpowers for Your Kitchen</h2>
          <p className="text-gray-500 font-semibold text-lg max-w-2xl mx-auto">Everything you need to master your food footprint and cook like a Michelin-starred chef.</p>
        </div>

        {/* PERFECTLY SEQUENCED CSS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          
          {/* Row 1, Col 1 (Spans down to occupy Row 2, Col 1) */}
          <Link href="/scan" className="md:col-span-1 md:row-span-2 p-10 rounded-[40px] bg-white border border-black/5 flex flex-col justify-start hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden relative">
            <div className="relative z-10 w-full h-full flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-[#e98016] text-white flex items-center justify-center mb-6 shadow-sm group-hover:shadow-[#e98016]/40 group-hover:shadow-lg transition-all">
                 <Scan size={28} />
              </div>
              <h3 className="text-2xl font-black text-[#1d070c] mb-3">Snapshot Pantry</h3>
              <p className="text-gray-500 font-semibold text-[15px] leading-relaxed mb-6">Scan receipts or take a photo of your fridge. Our AI instantly catalogs every item, expiry date, and nutritional profile.</p>
              
              {/* Added a subtle internal decoration to compensate for the removed image and maintain the tall card aesthetic */}
              <div className="mt-auto self-end w-32 h-32 bg-gradient-to-tr from-[#fdf2e8] to-[#fffbfa] rounded-full blur-2xl opacity-60 group-hover:bg-[#e98016] group-hover:opacity-10 transition-colors duration-500" />
            </div>
          </Link>

          {/* Row 1, Col 2 */}
          <Link href="/dashboard" className="p-10 rounded-[40px] bg-[#f0f7ff] border border-blue-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#3b82f6] text-white flex items-center justify-center mb-6 shadow-sm"><LayoutDashboard size={24} /></div>
            <h3 className="text-[22px] font-black text-[#1d070c] mb-2">Dashboard</h3>
            <p className="text-[#3b82f6]/80 text-[15px] font-semibold">A bird's eye view of your kitchen's health and savings.</p>
          </Link>

          {/* Row 1, Col 3 */}
          <Link href="/recipes" className="p-10 rounded-[40px] bg-[#fff5f7] border border-rose-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#f43f5e] text-white flex items-center justify-center mb-6 shadow-sm"><Utensils size={24} /></div>
            <h3 className="text-[22px] font-black text-[#1d070c] mb-2">Recipe Rescue</h3>
            <p className="text-[#f43f5e]/80 text-[15px] font-semibold">Recipes generated specifically for the items expiring today.</p>
          </Link>

          {/* Row 2, Col 2 */}
          <Link href="/recipes?quick=true" className="p-10 rounded-[40px] bg-[#f0fdf4] border border-green-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#22c55e] text-white flex items-center justify-center mb-6 shadow-sm"><Zap size={24} /></div>
            <h3 className="text-[22px] font-black text-[#1d070c] mb-2">Quick Use</h3>
            <p className="text-[#22c55e]/80 text-[15px] font-semibold">5-minute snacks to use up those last two tomatoes.</p>
          </Link>

          {/* Row 2, Col 3 */}
          <Link href="/heatmap" className="p-10 rounded-[40px] bg-[#fdf4ff] border border-fuchsia-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#d946ef] text-white flex items-center justify-center mb-6 shadow-sm"><Calendar size={24} /></div>
            <h3 className="text-[22px] font-black text-[#1d070c] mb-2">Expiry Heatmap</h3>
            <p className="text-[#d946ef]/80 text-[15px] font-semibold">Visualize which sections of your pantry need attention.</p>
          </Link>
          
          {/* Row 3, Col 1 */}
          <Link href="/dashboard" className="p-10 rounded-[40px] bg-[#fffce8] border border-amber-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#eab308] text-white flex items-center justify-center mb-6 shadow-sm"><Bell size={24} /></div>
              <h3 className="text-[22px] font-black text-[#1d070c] mb-2">Smart Alerts</h3>
              <p className="text-[#eab308]/80 text-[15px] font-semibold">Gentle nudges before things go bad, not when they have.</p>
            </div>
            <div className="w-48 h-48 bg-[#fef08a] rounded-full absolute -right-10 -bottom-10 opacity-40 blur-2xl" />
          </Link>

          {/* Row 3, Col 2 */}
          <Link href="/recipes?substitute=true" className="p-10 rounded-[40px] bg-[#f4fbfc] border border-cyan-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#06b6d4] text-white flex items-center justify-center mb-6 shadow-sm"><Sparkles size={24} /></div>
            <h3 className="text-[22px] font-black text-[#1d070c] mb-2">AI Substitutor</h3>
            <p className="text-[#06b6d4]/80 text-[15px] font-semibold">No eggs? Our AI finds the perfect alternative in your cupboard.</p>
          </Link>

          {/* Row 3, Col 3 */}
          <Link href="/community" className="p-10 rounded-[40px] bg-[#fff5f9] border border-pink-100/50 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#ec4899] text-white flex items-center justify-center mb-6 shadow-sm"><HeartHandshake size={24} /></div>
            <h3 className="text-[22px] font-black text-[#1d070c] mb-2">Neighbor Share</h3>
            <p className="text-[#ec4899]/80 text-[15px] font-semibold">Too much kale? Offer it to neighbors in your verified circle.</p>
          </Link>

        </div>
      </section>

      {/* Alchemy Journey */}
      <section className="w-full bg-[#fdf2e8]/40 py-32 border-t border-[#fbe6d0]/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-32 bg-gradient-to-b from-white to-transparent" />
         
         <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-[3rem] font-black text-[#1d070c] mb-[120px] tracking-tight">The Alchemy Journey</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-0 relative">
               
               <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-[#e98016]/20 to-transparent -z-10" />

               {[
                 { title: "Scan", icon: <Scan size={36} strokeWidth={1.5} />, desc: "Snap a photo of your shopping haul." },
                 { title: "Track", icon: <LineChart size={36} strokeWidth={1.5} />, desc: "FoodPrint organizes your digital pantry." },
                 { title: "Cook", icon: <ChefHat size={36} strokeWidth={1.5} />, desc: "Get recipes for what you already have." },
                 { title: "Save", icon: <Save size={36} strokeWidth={1.5} />, desc: "Save $1,500+ annually on groceries." },
               ].map((step, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center px-4 w-full group">
                     <div className="w-[96px] h-[96px] rounded-full bg-white border border-[#fbe6d0] shadow-[0_15px_30px_rgba(246,204,162,0.4)] flex items-center justify-center text-[#e98016] mb-8 group-hover:scale-110 transition-transform duration-300">
                        {step.icon}
                     </div>
                     <h3 className="text-[24px] font-black text-[#1d070c] mb-3">{step.title}</h3>
                     <p className="text-gray-500 text-[15px] font-semibold max-w-[180px]">{step.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Global Impact */}
      <section className="w-full bg-[#0a0a0a] text-white py-32 rounded-t-[60px] -mt-10 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-[3.25rem] font-black mb-6 tracking-tight">Our Global Impact</h2>
            <p className="text-gray-400 font-semibold text-lg">Small changes in your kitchen lead to massive ripples worldwide.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#151515] border border-[#222] p-12 text-center rounded-[40px] hover:border-[#ff6670]/40 transition-colors shadow-2xl">
               <h3 className="text-[4rem] font-black text-[#ff6670] mb-4 tracking-tight">1.2M+</h3>
               <p className="text-white font-bold mb-3 text-xl">Meals Saved</p>
               <p className="text-[#888] text-[14px] font-medium px-4">Rescued from landfills by our community this year.</p>
             </div>
             <div className="bg-[#151515] border border-[#222] p-12 text-center rounded-[40px] hover:border-[#ff6670]/40 transition-colors shadow-2xl">
               <h3 className="text-[4rem] font-black text-[#ff6670] mb-4 tracking-tight">$45M</h3>
               <p className="text-white font-bold mb-3 text-xl">Grocery Savings</p>
               <p className="text-[#888] text-[14px] font-medium px-4">Combined money saved by FoodPrint active users.</p>
             </div>
             <div className="bg-[#151515] border border-[#222] p-12 text-center rounded-[40px] hover:border-[#ff6670]/40 transition-colors shadow-2xl">
               <h3 className="text-[4rem] font-black text-[#ff6670] mb-4 tracking-tight">8.4k</h3>
               <p className="text-white font-bold mb-3 text-xl">Tons of CO2</p>
               <p className="text-[#888] text-[14px] font-medium px-4">Equivalent reduction in greenhouse gas emissions.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-[#fdf2e8]/20 px-6 py-24 pb-12">
        <div className="w-full max-w-5xl mx-auto bg-gradient-to-br from-[#741529] to-[#290a11] rounded-[60px] py-28 px-8 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#cf3053]/30 via-transparent to-transparent blur-2xl flex items-center justify-center">
            <div className="w-96 h-96 bg-[#ff6670] opacity-10 rounded-full blur-[100px]" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
             <h2 className="text-4xl md:text-[4rem] font-black mb-8 leading-[1.1] tracking-tight">Ready to start your <br/> culinary alchemy?</h2>
             <p className="text-[#faeaee] text-[18px] mb-12 font-medium">Join 500,000+ home chefs transforming their kitchens and the planet.</p>
             <Link href="/signup">
               <Button className="bg-gradient-to-r from-[#f2b373] to-[#ff6670] text-white border-0 text-xl px-12 py-8 h-auto rounded-full shadow-[0_10px_30px_rgba(255,102,112,0.4)] font-bold hover:scale-105 transition-all">
                  Start Saving Food Now
               </Button>
             </Link>
             <p className="mt-8 text-[15px] text-[#ecacba]/80 font-semibold">100% Free Web App • No Credit Card Required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 px-6 mt-10 bg-transparent">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 border-t border-black/5 pt-10">
            <div className="flex flex-col items-center md:items-start text-left w-full md:w-auto">
               <span className="text-2xl font-black text-[#531321] tracking-tight">FoodPrint</span>
               <span className="text-[14px] text-gray-400 font-semibold mt-2">© 2024 FoodPrint Culinary Alchemy</span>
            </div>
            <div className="flex gap-8 text-[15px] font-bold text-[#a52742]">
               <a href="#" className="hover:text-[#ff6670] transition-colors">Privacy</a>
               <a href="#" className="hover:text-[#ff6670] transition-colors">Terms</a>
               <a href="#" className="hover:text-[#ff6670] transition-colors">Support</a>
               <a href="#" className="hover:text-[#ff6670] transition-colors">Careers</a>
            </div>
         </div>
      </footer>
    </div>
  );
}
