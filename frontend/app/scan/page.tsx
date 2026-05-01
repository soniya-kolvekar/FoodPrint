"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Camera, Upload, Loader2, CheckCircle2, Trash, Plus, RotateCw, X, Zap, ZapOff, Sparkles } from "lucide-react";
import FallingText from "@/components/ui/FallingText";
import GooeyNav from "@/components/ui/GooeyNav";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { MagicCard } from "@/components/ui/MagicCard";
import TiltedCard from "@/components/ui/TiltedCard";

export default function Scan() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [step, setStep] = useState<"capture" | "processing" | "review" | "success">("capture");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [torch, setTorch] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");

    // Hardware cleanup: ensure camera stops if user navigates away
    return () => {
      stopCamera();
    };
  }, [user, loading, router]);

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

   const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      // Hardware cleanup: Stop existing tracks first if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setStream(newStream);
      setCameraActive(true);
      setFacingMode(mode);

      // Try to auto-enable torch for better clarity if in environment mode
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (mode === "environment" && capabilities?.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: true }]
          } as any);
          setTorch(true);
        } catch (e) {
          console.warn("Torch failed to start automatically");
        }
      } else {
        setTorch(false);
      }
    } catch (err) {
      alert("Camera access unavailable. Please check permissions or use the upload feature.");
      setCameraActive(false);
    }
  };

  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setTorch(false);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const newTorchState = !torch;
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }]
      } as any);
      setTorch(newTorchState);
    } catch (err) {
      alert("Flash/Torch not supported on this device.");
    }
  };

  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          stopCamera();
          processImagePayload(blob);
        }
      }, "image/jpeg");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImagePayload(file);
    }
  };

  const processImagePayload = async (fileBlob: Blob) => {
    setStep("processing");
    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append("receipt", fileBlob, "scan.jpg");

      const res = await fetch("http://localhost:5000/api/scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse");

      const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const itemsWithExpiry = (data.items || []).map((item: any) => ({
        ...item,
        expiry: item.expiry || defaultExpiry
      }));

      setScannedItems(itemsWithExpiry);
      setStep("review");
    } catch (error: any) {
      alert("Error parsing image: " + error.message);
      setStep("capture");
    }
  };

  const saveToPantry = async () => {
    setProcessing(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:5000/api/pantry/bulk-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: scannedItems })
      });

      if (!res.ok) throw new Error("Failed to save");
      
      setStep("success");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (error) {
      alert("Save failed. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const removeItem = (idx: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...scannedItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setScannedItems(updated);
  };

  const addItemManually = () => {
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setScannedItems([...scannedItems, { name: "", quantity: 1, unit: "unit", expiry: defaultExpiry, source: "manual" }]);
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  return (
    <div className="min-h-screen bg-[#fffbfa] text-[#450920] relative overflow-x-hidden font-sans flex flex-col selection:bg-[#da627d]/20">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.3]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#ffa5ab]/20 rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#f9dbbd]/30 rounded-full blur-[180px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 pt-6 pb-32 relative z-10 flex flex-col items-center">
        <div className="w-full mb-10 flex justify-start">
          <div className="inline-block bg-white/60 backdrop-blur-md rounded-full border border-[#450920]/10 shadow-sm">
            <GooeyNav items={[{ label: "← Dashboard", href: "/dashboard" }]} />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-bordeaux-800 mb-4 tracking-tight drop-shadow-sm">Smart Receipt <span className="text-[#da627d]">Scanner</span></h1>
          <p className="text-bordeaux-600 font-semibold text-lg max-w-lg mx-auto">
            Utilizing AI-powered OCR to catalog your ingredients automatically.
          </p>
        </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: CAPTURE */}
        {step === "capture" && (
          <motion.div 
            key="capture"
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md"
          >
            <TiltedCard 
              containerHeight="600px"
              containerWidth="100%"
              imageHeight="600px"
              imageWidth="100%"
              scaleOnHover={1.05}
              rotateAmplitude={12}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={true}
              overlayContent={
                <SpotlightCard 
                  className="w-full h-full rounded-[40px] border-2 border-[#ffa5ab]/60 bg-gradient-to-br from-[#ffd1d5]/80 via-[#ffe5e7]/90 to-[#f9dbbd]/80 backdrop-blur-xl shadow-2xl p-10 relative overflow-hidden group"
                  showBorderBeam={true}
                  beamColorFrom="#da627d"
                  beamColorTo="#450920"
                  beamSize={400}
                  beamDuration={10}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
            <canvas ref={canvasRef} className="hidden" />

             {!cameraActive ? (
              <>
                <div className="w-24 h-24 bg-[#fffbfa] rounded-3xl shadow-inner flex items-center justify-center mb-8 transform group-hover:rotate-6 transition-transform duration-500 border border-[#f9dbbd]/40">
                  <Camera size={48} className="text-[#da627d]" />
                </div>
                <h3 className="text-2xl font-black text-[#450920] mb-3">Ready to Scan?</h3>
                <p className="text-[#a53860]/70 font-semibold mb-10 px-4 text-center">Point your camera at a receipt or individual food items</p>
                <div className="flex flex-col gap-4 w-full px-4">
                  <Button onClick={() => startCamera("environment")} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-[#da627d]/20 bg-gradient-to-r from-[#da627d] to-[#ffa5ab] border-0 text-white hover:scale-[1.02] transition-all">
                    <Camera className="mr-2" size={22} /> Open Scanner
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-14 border-2 border-[#f9dbbd] text-[#450920] font-bold rounded-2xl hover:bg-[#f9dbbd]/20 transition-all bg-white/40 backdrop-blur-sm">
                    <Upload className="mr-2" size={20} /> Upload from Gallery
                  </Button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                
                {/* Viewfinder corners */}
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-white/20 rounded-lg"></div>
                </div>

                {/* Scanner Overlay Animation */}
                <motion.div 
                   animate={{ top: ["20%", "80%", "20%"] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#ff6670] to-transparent shadow-[0_0_15px_#ff6670] z-20"
                />

                {/* Controls */}
                <div className="absolute top-8 right-8 flex gap-4 z-30">
                  <button 
                    onClick={toggleTorch}
                    className={`p-4 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/20 ${torch ? 'bg-[#ffcc33] text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
                  >
                    {torch ? <Zap size={28} /> : <ZapOff size={28} />}
                  </button>
                  <button onClick={stopCamera} className="p-4 bg-black/40 text-white rounded-full backdrop-blur-md hover:bg-black/60 transition-all shadow-lg border border-white/20">
                    <X size={28} />
                  </button>
                </div>

                <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 z-30 px-6">
                  <div className="grid grid-cols-3 items-center w-full max-w-sm">
                    <div className="flex justify-center">
                      <button 
                        onClick={toggleCamera}
                        className="p-5 bg-white/10 text-white rounded-full backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 transition-all active:scale-95 shadow-xl"
                      >
                        <RotateCw size={28} />
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <button 
                        onClick={captureFrame}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(218,98,125,0.4)] border-8 border-[#da627d]/20 active:scale-90 transition-all group/btn relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#da627d] to-[#ffa5ab] animate-pulse group-hover/btn:scale-110 transition-transform"></div>
                        <div className="w-16 h-16 bg-white rounded-full relative z-10 flex items-center justify-center text-[#da627d]">
                          <Camera size={32} />
                        </div>
                      </button>
                    </div>

                    <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-0">
                      <div className="w-[68px] h-[68px]"></div> {/* Exact spacer for perfect centering */}
                    </div>
                  </div>
                  
                  <p className="text-white/90 text-[10px] font-black tracking-[0.2em] uppercase bg-[#da627d]/80 px-6 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
                    {facingMode === "user" ? "Selfie" : "Standard"} Mode Active
                  </p>
                </div>
              </div>
            )}
                  </div>
                </SpotlightCard>
              }
            />
          </motion.div>
        )}

        {/* STEP 2: PROCESSING */}
        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-20">
             <Loader2 size={64} className="text-apricot-500 animate-spin mb-6" />
             <h2 className="text-2xl font-bold text-bordeaux-800">Extracting Items...</h2>
             <p className="text-gray-500">Running advanced NLP cleaning</p>
          </motion.div>
        )}

        {/* STEP 3: REVIEW */}
        {step === "review" && (
          <motion.div key="review" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl">
             <MagicCard 
               className="w-full p-8 md:p-10 rounded-[40px] border-2 border-[#ffa5ab]/60 bg-gradient-to-br from-[#ffd1d5]/80 via-[#ffe5e7]/90 to-[#f9dbbd]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col"
               gradientFrom="#da627d"
               gradientTo="#450920"
             >
               <BorderBeam size={250} duration={12} colorFrom="#da627d" colorTo="#450920" borderRadius={40} />
               
               <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-black/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#ffe5e7] rounded-2xl border border-[#ffa5ab]/40">
                      <Sparkles className="text-[#da627d]" size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-[#450920] tracking-tight">Verify ({scannedItems.length}) Items</h2>
                  </div>
                  <Button variant="outline" onClick={() => setStep("capture")} className="rounded-full border-[#f9dbbd] text-[#450920] font-bold px-6">Retake</Button>
               </div>

               <div className="flex flex-col gap-4 mb-8 text-left max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {scannedItems.length === 0 ? (
                    <div className="p-12 text-center bg-red-50/50 rounded-3xl text-[#cf3053] font-bold border border-red-100 flex flex-col items-center">
                      <X size={48} className="mb-4 opacity-50" />
                      <p className="text-xl">No items detected!</p>
                      <p className="text-sm font-semibold opacity-70 mt-1">Please try taking a closer picture with better lighting.</p>
                    </div>
                  ) : (
                    scannedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-6 bg-white/40 hover:bg-white/60 transition-all rounded-3xl border-[#f9dbbd]/40 border-2 shadow-sm hover:shadow-md group">
                         <div className="flex flex-col gap-3 w-full pr-4">
                            <input 
                              value={item.name} 
                              onChange={(e) => updateItem(idx, 'name', e.target.value)}
                              className="font-black text-xl text-[#450920] capitalize bg-transparent border-b-2 border-transparent hover:border-[#f9dbbd] focus:border-[#da627d] focus:outline-none w-full transition-all pb-1"
                              placeholder="e.g. Organic Almond Milk"
                            />
                            <div className="flex gap-3 items-center flex-wrap">
                              <div className="flex items-center bg-[#fffbfa] border border-[#f9dbbd]/60 rounded-xl px-1 overflow-hidden">
                                <span className="text-[10px] font-black text-[#a53860]/50 uppercase tracking-widest pl-2">Qty</span>
                                <input 
                                  type="number"
                                  value={item.quantity} 
                                  onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                  className="w-16 text-sm font-black text-[#450920] bg-transparent p-2 focus:outline-none"
                                  min="0"
                                  step="any"
                                />
                              </div>
                              <div className="flex items-center bg-[#fffbfa] border border-[#f9dbbd]/60 rounded-xl px-1 overflow-hidden">
                                <span className="text-[10px] font-black text-[#a53860]/50 uppercase tracking-widest pl-2">Unit</span>
                                <input 
                                  value={item.unit} 
                                  onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                                  className="w-24 text-sm font-black text-[#450920] bg-transparent p-2 focus:outline-none"
                                  placeholder="unit"
                                />
                              </div>
                              <div className="flex items-center bg-[#fffbfa] border border-[#f9dbbd]/60 rounded-xl px-1 overflow-hidden flex-1 min-w-[150px]">
                                <span className="text-[10px] font-black text-[#a53860]/50 uppercase tracking-widest pl-2">Expiry</span>
                                <input 
                                  type="date"
                                  value={item.expiry || ""} 
                                  onChange={(e) => updateItem(idx, 'expiry', e.target.value)}
                                  className="text-sm font-black text-[#450920] bg-transparent p-2 focus:outline-none w-full"
                                />
                              </div>
                            </div>
                         </div>
                         <button onClick={() => removeItem(idx)} className="p-4 text-[#a53860]/40 hover:text-[#cf3053] transition-all bg-white/60 rounded-2xl hover:bg-red-50 shrink-0 shadow-sm">
                            <Trash size={20} />
                         </button>
                      </div>
                    ))
                  )}
               </div>

               <div className="flex flex-col gap-4">
                 <Button onClick={addItemManually} variant="outline" className="w-full h-14 border-2 border-dashed border-[#f9dbbd] text-[#a53860] hover:border-[#da627d] hover:bg-[#fff5f7] bg-transparent shadow-none rounded-2xl font-bold flex items-center justify-center">
                   <Plus size={20} className="mr-2"/> Add Missing Item
                 </Button>

                 <Button 
                    onClick={saveToPantry}
                    disabled={scannedItems.length === 0 || processing}
                    className="w-full h-16 text-xl font-black rounded-[24px] shadow-2xl shadow-[#da627d]/30 bg-gradient-to-r from-[#da627d] via-[#a53860] to-[#450920] border-0 text-white hover:scale-[1.02] transition-all"
                 >
                   {processing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                   Save to Pantry
                 </Button>
               </div>
             </MagicCard>
          </motion.div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "success" && (
          <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-20">
             <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
             </div>
             <h2 className="text-3xl font-black text-bordeaux-800">Pantry Updated!</h2>
             <p className="text-gray-500 font-medium">Redirecting to logic hub...</p>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
      
      {/* FOOTER */}
      <footer className="w-full bg-[#1d070c] py-14 px-6 md:px-12 text-[#fffbfa] mt-auto relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-[#f9dbbd]/70 font-semibold font-sans">
           <div className="w-full md:w-2/3">
              <span>© 2026 FoodPrint. Save food, save money, save the planet. 100% Free Web App. No credit card required.</span>
           </div>
           <div className="flex gap-6 justify-center md:justify-end w-full md:w-1/3">
              <span className="hover:text-[#da627d] transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-[#da627d] transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-[#da627d] transition-colors cursor-pointer">Support</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
