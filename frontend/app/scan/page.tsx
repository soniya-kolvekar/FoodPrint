"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Camera, Upload, ArrowLeft, Loader2, CheckCircle2, Edit2, Trash, Plus, RotateCw, X, Zap, ZapOff } from "lucide-react";

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

      setScannedItems(data.items || []);
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
    setScannedItems([...scannedItems, { name: "", quantity: 1, unit: "unit", source: "manual" }]);
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Authenticating...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-center flex flex-col items-center min-h-[80vh] justify-center relative">
      <div className="absolute top-8 left-6 z-10">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#ff6670] transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
      </div>
      
      <h1 className="text-4xl font-bold text-bordeaux-800 mb-4">Smart Receipt Scanner</h1>
      <p className="text-bordeaux-600 mb-8 max-w-lg">
        Utilizing free native OCR engines to capture ingredients automatically.
      </p>

      <AnimatePresence mode="wait">
        {/* STEP 1: CAPTURE */}
        {step === "capture" && (
          <motion.div 
            key="capture"
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md aspect-[3/4] rounded-3xl border-4 border-dashed border-apricot-300 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 relative overflow-hidden group shadow-lg"
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
            <canvas ref={canvasRef} className="hidden" />

             {!cameraActive ? (
              <>
                <div className="w-20 h-20 bg-apricot-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera size={40} className="text-apricot-400" />
                </div>
                <h3 className="text-xl font-bold text-bordeaux-800 mb-2">Ready to Scan?</h3>
                <p className="text-sm text-gray-500 mb-8 px-4">Point your camera at a receipt or individual food items</p>
                <div className="flex flex-col gap-3 w-full">
                  <Button variant="primary" onClick={() => startCamera("environment")} className="w-full shadow-lg shadow-apricot-400/30 py-6 text-lg">
                    <Camera className="mr-2" size={20} /> Open Scanner
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full py-6 border-gray-200">
                    <Upload className="mr-2" size={18} /> Upload from Gallery
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
                <div className="absolute top-6 right-6 flex gap-3 z-30">
                  <button 
                    onClick={toggleTorch}
                    className={`p-3 rounded-full backdrop-blur-md transition-colors ${torch ? 'bg-apricot-400 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                  >
                    {torch ? <Zap size={24} /> : <ZapOff size={24} />}
                  </button>
                  <button onClick={stopCamera} className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6 z-30 px-6">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={toggleCamera}
                      className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                    >
                      <RotateCw size={24} />
                    </button>

                    <button 
                      onClick={captureFrame}
                      className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-[#ff6670]/30 active:scale-90 transition-transform"
                    >
                      <div className="w-14 h-14 bg-gradient-to-tr from-apricot-400 to-[#ff6670] rounded-full"></div>
                    </button>

                    <div className="w-14"></div> {/* Spacer for symmetry */}
                  </div>
                  
                  <p className="text-white/80 text-xs font-medium tracking-widest uppercase bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    Scanning in {facingMode === "user" ? "Selfie" : "Standard"} Mode
                  </p>
                </div>
              </div>
            )}
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
          <motion.div key="review" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-bordeaux-800">Verify ({scannedItems.length}) Items</h2>
                <Button variant="outline" onClick={() => setStep("capture")}>Retake</Button>
             </div>

             <div className="flex flex-col gap-3 mb-6 text-left max-h-[400px] overflow-y-auto pr-2">
                {scannedItems.length === 0 ? (
                  <div className="p-8 text-center bg-red-50 rounded-2xl text-red-500 font-bold border border-red-100">
                    No items detected! Please try taking a closer picture.
                  </div>
                ) : (
                  scannedItems.map((item, idx) => (
                    <Card key={idx} className="flex justify-between items-center p-4 bg-white hover:shadow-lg transition-all rounded-2xl border-gray-100 border">
                       <div className="flex flex-col gap-2 w-full pr-4">
                          <input 
                            value={item.name} 
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            className="font-bold text-lg text-bordeaux-800 capitalize bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-apricot-400 focus:outline-none w-full transition-colors pb-1"
                            placeholder="e.g. Organic Almond Milk"
                          />
                          <div className="flex gap-2 items-center">
                            <input 
                              type="number"
                              value={item.quantity} 
                              onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="w-16 text-sm font-medium text-apricot-700 bg-apricot-50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 ring-apricot-400 border border-transparent hover:border-apricot-200"
                              min="0"
                              step="any"
                            />
                            <input 
                              value={item.unit} 
                              onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                              className="w-24 text-sm font-medium text-apricot-700 bg-apricot-50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 ring-apricot-400 border border-transparent hover:border-apricot-200"
                              placeholder="unit"
                            />
                          </div>
                       </div>
                       <button onClick={() => removeItem(idx)} className="p-3 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full hover:bg-red-50 shrink-0">
                          <Trash size={18} />
                       </button>
                    </Card>
                  ))
                )}
             </div>

             <Button onClick={addItemManually} variant="outline" className="w-full mb-6 border-dashed border-gray-300 text-gray-500 hover:border-apricot-400 hover:text-apricot-600 bg-transparent shadow-none h-12">
               <Plus size={18} className="mr-2"/> Add Missing Item
             </Button>

             <Button 
                onClick={saveToPantry}
                disabled={scannedItems.length === 0 || processing}
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-apricot-500/20 bg-gradient-to-r from-apricot-400 to-[#ff6670] border-0"
             >
               {processing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
               Save to Pantry
             </Button>
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
    </div>
  );
}
