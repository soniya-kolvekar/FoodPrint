"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Camera, Upload, ArrowLeft, Loader2, CheckCircle2, Edit2, Trash, Plus } from "lucide-react";

export default function Scan() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [step, setStep] = useState<"capture" | "processing" | "review" | "success">("capture");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      // Silently catch the error rather than throwing console.error to keep logs clean
      alert("Camera access unavailable. Please use the upload feature.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
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
                <Camera size={64} className="text-apricot-400 mb-6" />
                <Button variant="primary" onClick={startCamera} className="mb-4 w-full shadow-apricot-400">Open Camera</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full"><Upload className="mr-2" size={18} /> Upload Image</Button>
              </>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                
                {/* Scanner Overlay Animation */}
                <motion.div 
                   animate={{ top: ["0%", "100%", "0%"] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff6670] to-transparent shadow-[0_0_15px_#ff6670]"
                />

                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-8">
                   <Button variant="outline" className="bg-white/20 text-white border-white/40 backdrop-blur" onClick={stopCamera}>Cancel</Button>
                   <Button className="bg-[#ff6670] text-white hover:bg-white hover:text-[#ff6670] border-0" onClick={captureFrame}>Snap Scan</Button>
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
