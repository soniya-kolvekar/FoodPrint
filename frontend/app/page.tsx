"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LayoutDashboard, Utensils, Zap, Calendar, Bell, Scan, LineChart, ChefHat, Save, Sparkles, HeartHandshake } from "lucide-react";
import Aurora from "@/components/ui/Aurora";
import CircularText from "@/components/ui/CircularText";
import VariableProximity from "@/components/ui/VariableProximity";
import TiltedCard from "@/components/ui/TiltedCard";
import Stepper, { Step } from "@/components/ui/Stepper";
import CountUp from "@/components/ui/CountUp";
import SpotlightCard from "@/components/ui/SpotlightCard";
import FallingText from "@/components/ui/FallingText";
import { IconCloud } from "@/components/ui/IconCloud";
import { Roboto_Flex } from "next/font/google";

const robotoFlex = Roboto_Flex({ subsets: ["latin"], variable: "--font-roboto-flex" });

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [triggerFalling, setTriggerFalling] = useState<'click' | 'hover' | 'auto' | 'scroll'>('click');

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          setTriggerFalling('auto');
        }, 5000);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center overflow-x-hidden bg-[#fffbfa]">
      
      {/* Hero Section */}
      <section className="w-full relative px-6 pt-32 pb-48 text-center bg-[#f9dbbd] overflow-hidden z-0">
        
        <div className="absolute inset-0 z-0 opacity-80">
          <Aurora colorStops={["#ffa5ab", "#da627d", "#a53860"]} blend={0.6} amplitude={1.2} speed={0.8} />
        </div>

        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-5xl mx-auto mt-24"
        >
          <div className="flex flex-col items-center gap-8">
            <h1 className={`text-6xl md:text-[6.5rem] font-black text-[#450920] leading-[1.05] md:leading-[1.05] tracking-tighter drop-shadow-sm ${robotoFlex.className}`}>
              <VariableProximity
                label="Track. Cook. Save."
                className="variable-proximity-demo cursor-default"
                fromFontVariationSettings="'wght' 700, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={200}
                falloff="linear"
              />
              <br />
              <VariableProximity
                label="Repeat."
                className="variable-proximity-demo cursor-default"
                fromFontVariationSettings="'wght' 700, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={200}
                falloff="linear"
              />
            </h1>
            
            <CircularText
              text="* ZERO FOOD WASTE * MASTERCHEF MAGIC "
              onHover="speedUp"
              spinDuration={20}
              className="text-[#450920] opacity-80"
            />
          </div>
          

        </motion.div>
      </section>



      {/* Superpowers Section (Bento Grid) */}
      <section className="w-full max-w-6xl px-6 py-16 mb-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-[3rem] font-black text-[#1d070c] mb-6 tracking-tight">Superpowers for Your Kitchen</h2>
          <p className="text-gray-500 font-semibold text-lg max-w-2xl mx-auto">Everything you need to master your food footprint and cook like a Michelin-starred chef.</p>
        </div>

        {/* PERFECTLY SEQUENCED CSS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          <Link href="/scan" className="block w-full h-full cursor-pointer">
            <TiltedCard
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full rounded-[24px] bg-[#f9dbbd]/40 border-2 border-[#f9dbbd] hover:border-[#f9dbbd]/80 hover:bg-[#f9dbbd]/60 transition-colors duration-300 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#450920] to-[#a53860] text-white flex items-center justify-center mb-6 shadow-lg">
                     <Scan size={28} />
                  </div>
                  <h3 className="text-[22px] font-black text-[#450920] mb-3">Snapshot Pantry</h3>
                  <p className="text-[#a53860]/80 font-semibold text-[15px] leading-relaxed">Scan receipts or your fridge. AI instantly catalogs every item and expiry date.</p>
                </div>
              }
            />
          </Link>

          <Link href="/dashboard" className="block w-full h-full cursor-pointer">
            <TiltedCard
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full rounded-[24px] bg-[#ffa5ab]/30 border-2 border-[#ffa5ab]/60 hover:border-[#ffa5ab] hover:bg-[#ffa5ab]/40 transition-colors duration-300 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a53860] to-[#da627d] text-white flex items-center justify-center mb-6 shadow-lg">
                     <LayoutDashboard size={28} />
                  </div>
                  <h3 className="text-[22px] font-black text-[#450920] mb-3">Dashboard</h3>
                  <p className="text-[#a53860]/80 font-semibold text-[15px] leading-relaxed">A bird's eye view of your kitchen's health, inventory, and savings.</p>
                </div>
              }
            />
          </Link>

          <Link href="/recipes" className="block w-full h-full cursor-pointer">
            <TiltedCard
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full rounded-[24px] bg-[#da627d]/10 border-2 border-[#da627d]/30 hover:border-[#da627d]/50 hover:bg-[#da627d]/15 transition-colors duration-300 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#da627d] to-[#ffa5ab] text-white flex items-center justify-center mb-6 shadow-lg">
                     <Utensils size={28} />
                  </div>
                  <h3 className="text-[22px] font-black text-[#450920] mb-3">Recipe Rescue</h3>
                  <p className="text-[#a53860]/80 font-semibold text-[15px] leading-relaxed">Recipes generated specifically for the items expiring today.</p>
                </div>
              }
            />
          </Link>

          <Link href="/heatmap" className="block w-full h-full cursor-pointer">
            <TiltedCard
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full rounded-[24px] bg-[#a53860]/10 border-2 border-[#a53860]/30 hover:border-[#a53860]/50 hover:bg-[#a53860]/15 transition-colors duration-300 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a53860] to-[#450920] text-white flex items-center justify-center mb-6 shadow-lg">
                     <Calendar size={28} />
                  </div>
                  <h3 className="text-[22px] font-black text-[#450920] mb-3">Expiry Heatmap</h3>
                  <p className="text-[#a53860]/80 font-semibold text-[15px] leading-relaxed">Visualize which sections of your pantry need attention.</p>
                </div>
              }
            />
          </Link>

          <Link href="/substitutes" className="block w-full h-full cursor-pointer">
            <TiltedCard
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full rounded-[24px] bg-[#450920]/5 border-2 border-[#450920]/20 hover:border-[#450920]/40 hover:bg-[#450920]/10 transition-colors duration-300 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#450920] to-[#da627d] text-white flex items-center justify-center mb-6 shadow-lg">
                     <Sparkles size={28} />
                  </div>
                  <h3 className="text-[22px] font-black text-[#450920] mb-3">AI Substitutor</h3>
                  <p className="text-[#a53860]/80 font-semibold text-[15px] leading-relaxed">No eggs? Our AI finds the perfect alternative in your cupboard.</p>
                </div>
              }
            />
          </Link>

          <Link href="/community" className="block w-full h-full cursor-pointer">
            <TiltedCard
              containerHeight="300px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-full rounded-[24px] bg-[#da627d]/10 border-2 border-[#da627d]/30 hover:border-[#da627d]/50 hover:bg-[#da627d]/15 transition-colors duration-300 p-8 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#da627d] to-[#450920] text-white flex items-center justify-center mb-6 shadow-lg">
                     <HeartHandshake size={28} />
                  </div>
                  <h3 className="text-[22px] font-black text-[#450920] mb-3">Neighbor Share</h3>
                  <p className="text-[#a53860]/80 font-semibold text-[15px] leading-relaxed">Too much kale? Offer it to neighbors in your verified circle.</p>
                </div>
              }
            />
          </Link>

        </div>
      </section>

      {/* Alchemy Journey */}
      <section className="w-full bg-[#fdf2e8]/40 py-32 border-t border-[#fbe6d0]/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-32 bg-gradient-to-b from-white to-transparent" />
         
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-[3rem] font-black text-[#450920] mb-12 tracking-tight">The Alchemy Journey</h2>
            
            <Stepper
              initialStep={1}
              renderStepIndicator={({ step, currentStep, onStepClick }) => {
                const icons = [
                  <Scan key="scan" size={36} strokeWidth={1.5} />,
                  <LineChart key="track" size={36} strokeWidth={1.5} />,
                  <ChefHat key="cook" size={36} strokeWidth={1.5} />,
                  <Save key="save" size={36} strokeWidth={1.5} />,
                ];
                const isActive = currentStep === step;
                const isComplete = currentStep > step;
                
                return (
                  <div 
                    className={`w-[80px] h-[80px] md:w-[96px] md:h-[96px] rounded-full bg-white flex items-center justify-center transition-all duration-300 cursor-pointer
                      ${isActive ? 'border-2 border-[#450920] shadow-[0_10px_30px_rgba(69,9,32,0.3)] text-[#450920] scale-110 z-10' : 
                        isComplete ? 'border-2 border-[#a53860]/40 bg-[#fff5f7] text-[#a53860]' : 
                        'border border-[#fbe6d0] text-[#e98016] opacity-60 hover:opacity-100 hover:scale-105 shadow-sm'}`}
                    onClick={() => onStepClick(step)}
                  >
                    {icons[step - 1]}
                  </div>
                );
              }}
            >
              <Step>
                <div className="flex flex-col items-center text-center py-6">
                  <h3 className="text-3xl font-black text-[#450920] mb-4">Scan</h3>
                  <p className="text-[#a53860]/90 text-lg font-semibold max-w-md mx-auto">Snap a photo of your shopping haul or directly scan your receipts. FoodPrint automatically identifies everything.</p>
                </div>
              </Step>
              <Step>
                <div className="flex flex-col items-center text-center py-6">
                  <h3 className="text-3xl font-black text-[#450920] mb-4">Track</h3>
                  <p className="text-[#a53860]/90 text-lg font-semibold max-w-md mx-auto">FoodPrint organizes your digital pantry, elegantly tracking expiry dates and freshness in real-time.</p>
                </div>
              </Step>
              <Step>
                <div className="flex flex-col items-center text-center py-6">
                  <h3 className="text-3xl font-black text-[#450920] mb-4">Cook</h3>
                  <p className="text-[#a53860]/90 text-lg font-semibold max-w-md mx-auto">Get stunning, chef-level recipes generated specifically for the ingredients that are about to expire.</p>
                </div>
              </Step>
              <Step>
                <div className="flex flex-col items-center text-center py-6">
                  <h3 className="text-3xl font-black text-[#450920] mb-4">Save</h3>
                  <p className="text-[#a53860]/90 text-lg font-semibold max-w-md mx-auto">Reduce your food waste to zero, saving over $1,500+ annually on groceries while eating better than ever.</p>
                </div>
              </Step>
            </Stepper>
         </div>
      </section>

      {/* Global Impact */}
      <section className="w-full bg-[#450920] text-white py-32 rounded-[60px] -mt-10 mb-10 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-[3.25rem] font-black mb-6 tracking-tight text-[#fffbfa]">Our Global Impact</h2>
            <p className="text-[#f9dbbd]/80 font-semibold text-lg">Small changes in your kitchen lead to massive ripples worldwide.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white/5 backdrop-blur-xl border border-[#f9dbbd]/20 p-12 text-center rounded-[40px] hover:border-[#f9dbbd]/40 transition-colors shadow-2xl">
               <h3 className="text-[4rem] font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#f9dbbd] to-[#da627d]">
                 <CountUp from={0} to={1.2} decimals={1} duration={5} suffix="M+" />
               </h3>
               <p className="text-[#fffbfa] font-bold mb-3 text-xl">Meals Saved</p>
               <p className="text-[#f9dbbd]/70 text-[14px] font-medium px-4">Rescued from landfills by our community this year.</p>
             </div>
             <div className="bg-white/5 backdrop-blur-xl border border-[#f9dbbd]/20 p-12 text-center rounded-[40px] hover:border-[#f9dbbd]/40 transition-colors shadow-2xl">
               <h3 className="text-[4rem] font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#f9dbbd] to-[#da627d]">
                 <CountUp from={0} to={45} duration={5} prefix="$" suffix="M" />
               </h3>
               <p className="text-[#fffbfa] font-bold mb-3 text-xl">Grocery Savings</p>
               <p className="text-[#f9dbbd]/70 text-[14px] font-medium px-4">Combined money saved by FoodPrint active users.</p>
             </div>
             <div className="bg-white/5 backdrop-blur-xl border border-[#f9dbbd]/20 p-12 text-center rounded-[40px] hover:border-[#f9dbbd]/40 transition-colors shadow-2xl">
               <h3 className="text-[4rem] font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#f9dbbd] to-[#da627d]">
                 <CountUp from={0} to={8.4} decimals={1} duration={5} suffix="k" />
               </h3>
               <p className="text-[#fffbfa] font-bold mb-3 text-xl">Tons of CO2</p>
               <p className="text-[#f9dbbd]/70 text-[14px] font-medium px-4">Equivalent reduction in greenhouse gas emissions.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-[#fdf2e8]/20 px-6 py-24 pb-12">
        <SpotlightCard 
          spotlightColor="rgba(249, 219, 189, 0.2)"
          showBorderBeam={true}
          beamColorFrom="#f9dbbd"
          beamColorTo="#ffa5ab"
          beamSize={350}
          beamDuration={10}
          beamBorderWidth={2}
          beamBorderRadius={60}
          className="w-full max-w-5xl mx-auto bg-[#290a11] border border-[#a53860]/20 rounded-[60px] py-28 px-8 text-center text-white shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col items-center">
             <h2 className="text-4xl md:text-[4rem] font-black mb-8 leading-[1.1] tracking-tight text-[#fffbfa]">Ready to start your <br/> culinary alchemy?</h2>
             <p className="text-[#faeaee] text-[18px] mb-12 font-medium">Join 500,000+ home chefs transforming their kitchens and the planet.</p>
                <Link href="/signup">
                  <Button className="bg-white text-[#450920] border-0 text-xl px-12 py-8 h-auto rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.1)] font-bold hover:scale-105 hover:bg-[#f9dbbd] transition-all">
                     Start Saving Food Now
                  </Button>
                </Link>
             <p className="mt-8 text-[15px] text-[#ecacba]/80 font-semibold">100% Free Web App • No Credit Card Required</p>
          </div>
        </SpotlightCard>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className={`w-full py-14 px-6 md:px-12 text-[#fffbfa] rounded-t-[60px] mt-20 relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] transition-colors duration-1000 overflow-hidden ${triggerFalling === 'auto' ? 'bg-[#1d070c]' : 'bg-[#450920]'}`}>
         
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 border-b border-[#da627d]/20 pb-12 relative z-10">
            {/* Large Background Wordmark Centered directly on the line */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 text-[8rem] md:text-[12rem] font-black text-[#fffbfa]/5 leading-none pointer-events-none select-none z-0">
               FOODPRINT
            </div>

            <div className="w-full md:w-2/3">
               <FallingText trigger={triggerFalling} gravity={0.6}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
                     <div className="flex flex-col text-left items-start">
                        <span className="fall-item inline-block text-[#da627d] font-bold text-base uppercase tracking-widest mb-4">Main</span>
                        <Link href="/" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Home</Link>
                        <Link href="/dashboard" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Dashboard</Link>
                        <Link href="/expiry-heatmap" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Pantry Analysis</Link>
                     </div>
                     <div className="flex flex-col text-left items-start">
                        <span className="fall-item inline-block text-[#da627d] font-bold text-base uppercase tracking-widest mb-4">Cooking</span>
                        <Link href="/recipes" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Recipes</Link>
                        <Link href="/community" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Community</Link>
                        <Link href="/profile" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Profile</Link>
                     </div>
                     <div className="flex flex-col text-left items-start">
                        <span className="fall-item inline-block text-[#da627d] font-bold text-base uppercase tracking-widest mb-4">Support</span>
                        <a href="#" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Terms of Use</a>
                        <a href="#" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Privacy Policy</a>
                        <a href="#" className="fall-item inline-block hover:text-[#f9dbbd] transition-colors mb-1.5 text-[15px] font-semibold">Contact Us</a>
                     </div>
                  </div>
               </FallingText>
            </div>

            <div className="flex items-center justify-center md:justify-end w-full md:w-1/3 mt-[-80px] md:translate-x-12 relative z-20">
               <IconCloud images={[
                 "https://cdn.simpleicons.org/nextdotjs/ffffff",
                 "https://cdn.simpleicons.org/react/ffffff",
                 "https://cdn.simpleicons.org/tailwindcss/ffffff",
                 "https://cdn.simpleicons.org/firebase/ffffff",
                 "https://cdn.simpleicons.org/nodedotjs/ffffff",
                 "https://cdn.simpleicons.org/github/ffffff",
                 "https://cdn.simpleicons.org/javascript/ffffff",
                 "https://cdn.simpleicons.org/typescript/ffffff"
               ]} />
            </div>
         </div>

         {/* Bottom / Legal / Falling Text */}
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#f9dbbd]/70 font-semibold">
            <div className="w-full md:w-2/3">
               <FallingText 
                 text="© 2024 FoodPrint. Save food, save money, save the planet. 100% Free Web App. No credit card required."
                 trigger={triggerFalling}
                 fontSize="14px"
                 backgroundColor="transparent"
               />
            </div>
            <div className="flex gap-6 justify-center md:justify-end w-full md:w-1/3">
               <a href="#" className="hover:text-[#da627d] transition-colors">Privacy</a>
               <a href="#" className="hover:text-[#da627d] transition-colors">Terms</a>
               <a href="#" className="hover:text-[#da627d] transition-colors">Support</a>
            </div>
         </div>
      </footer>
    </div>
  );
}
