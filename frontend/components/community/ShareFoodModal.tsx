"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Camera, Loader2, Navigation } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Dynamically import map for location picking
const MapOverlay = dynamic(() => import("./MapComponent"), { ssr: false });

interface ShareFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number] | null;
}

export default function ShareFoodModal({ isOpen, onClose, userLocation }: ShareFoodModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    contactInfo: "",
    price: "Free",
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSelectedLocation([lat, lon]);
      } else {
        alert("Location not found. Please try a different query.");
      }
    } catch (error) {
      console.error("Geocoding error", error);
      alert("Failed to search location.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isOpen && userLocation && !selectedLocation) {
      setSelectedLocation(userLocation);
    }
  }, [isOpen, userLocation, selectedLocation]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a full implementation, you would upload to Cloudinary here
      // For now, we simulate with a local preview string (base64) 
      // or we can just leave it as null to use fallback icons.
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLocation) return;
    
    setLoading(true);
    try {
      // Create firestore document
      await addDoc(collection(db, "sharedFood"), {
        title: form.title,
        description: form.description,
        contactInfo: form.contactInfo,
        price: form.price,
        lat: selectedLocation[0],
        lng: selectedLocation[1],
        userId: user.uid,
        userName: user.displayName || "Anonymous Neighbor",
        imageUrl: imagePreview, // Save the base64 or Cloudinary URL
        createdAt: serverTimestamp()
      });
      
      onClose();
      setForm({ title: "", description: "", contactInfo: "", price: "Free" });
      setImagePreview(null);
    } catch (error) {
      console.error("Error sharing food", error);
      alert("Failed to share food. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bordeaux-950/20 backdrop-blur-md z-[110]"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4 z-[120] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[48px] shadow-3xl overflow-hidden pointer-events-auto border border-apricot-100 flex flex-col max-h-[90vh]"
            >
              <div className="bg-apricot-50 px-10 py-8 flex justify-between items-center border-b border-apricot-100 shrink-0">
                <div>
                  <h2 className="text-[32px] font-serif text-bordeaux-800 leading-none mb-2">Share <span className="italic font-normal opacity-40">Food</span></h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300">Prevent Waste, Help Neighbors</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full bg-white border border-apricot-100 flex items-center justify-center text-bordeaux-300 hover:text-bordeaux-800 transition shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {!showMapPicker ? (
                <div className="overflow-y-auto px-10 py-8 scrollbar-hide">
                  <form id="share-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Area */}
                    <div className="w-full">
                      <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-apricot-200 rounded-3xl cursor-pointer hover:bg-apricot-50/50 hover:border-apricot-400 transition-colors bg-gray-50/50 overflow-hidden group">
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-bold text-sm">Change Photo</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-apricot-400 shadow-sm mb-3">
                              <Camera size={24} />
                            </div>
                            <p className="text-[12px] font-bold text-bordeaux-400 mb-1">Upload a photo (Optional)</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 5 Organic Apples"
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                        className="w-full bg-white border border-apricot-100 rounded-2xl h-14 px-6 focus:border-apricot-500 outline-none transition-all font-bold text-bordeaux-800 placeholder:text-bordeaux-100 placeholder:font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Description</label>
                      <textarea
                        required
                        placeholder="Any details? Pickup times? Condition?"
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full bg-white border border-apricot-100 rounded-2xl p-6 h-28 focus:border-apricot-500 outline-none transition-all font-medium text-bordeaux-800 placeholder:text-bordeaux-100 resize-none"
                      />
                    </div>

                    <div className="flex gap-4 w-full">
                      <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Contact Details</label>
                        <input
                          required
                          type="text"
                          placeholder="Phone or Email"
                          value={form.contactInfo}
                          onChange={e => setForm({...form, contactInfo: e.target.value})}
                          className="w-full bg-white border border-apricot-100 rounded-2xl h-14 px-6 focus:border-apricot-500 outline-none transition-all font-bold text-bordeaux-800 placeholder:text-bordeaux-100 placeholder:font-medium"
                        />
                      </div>

                      <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Price / Free</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Free or $5"
                          value={form.price}
                          onChange={e => setForm({...form, price: e.target.value})}
                          className="w-full bg-white border border-apricot-100 rounded-2xl h-14 px-6 focus:border-apricot-500 outline-none transition-all font-bold text-bordeaux-800 placeholder:text-bordeaux-100 placeholder:font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Location</label>
                      <div 
                        onClick={() => setShowMapPicker(true)}
                        className="w-full bg-white border border-apricot-100 rounded-2xl h-14 px-6 flex items-center justify-between cursor-pointer hover:border-apricot-300 transition-colors group"
                      >
                        <div className="flex items-center gap-3 text-bordeaux-600 font-bold">
                          <MapPin size={18} className="text-apricot-500" />
                          {selectedLocation ? "Location Selected" : "Tap to set location"}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-apricot-400 tracking-widest group-hover:text-bordeaux-800 transition-colors">
                          Edit
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-bordeaux-800 flex items-center gap-2">
                      <Navigation size={18} className="text-apricot-500" /> Adjust Pin Location
                    </h3>
                    <button 
                      onClick={() => setShowMapPicker(false)}
                      className="text-xs font-bold uppercase tracking-widest text-bordeaux-400 hover:text-bordeaux-800"
                    >
                      Done
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Type a city, address, or zip..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full bg-apricot-50 border border-apricot-100 rounded-xl h-10 px-4 text-sm font-medium text-bordeaux-800 outline-none focus:border-apricot-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-4 bg-apricot-500 text-white font-bold rounded-xl text-sm hover:bg-bordeaux-800 transition"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                    </button>
                  </div>

                  <div className="flex-1 rounded-3xl overflow-hidden min-h-[350px] border border-apricot-100 relative">
                    <div className="absolute inset-0">
                      <MapOverlay 
                        items={[]} 
                        userLocation={selectedLocation || userLocation} 
                        interactiveSelect={true}
                        selectedLocation={selectedLocation}
                        onLocationUpdate={(lat, lng) => setSelectedLocation([lat, lng])}
                      />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md py-3 px-4 rounded-xl border border-apricot-100 shadow-lg pointer-events-none z-[1000] text-center">
                      <p className="text-xs font-bold text-bordeaux-800">Tap map to move pin, or search above.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowMapPicker(false)}
                    className="w-full mt-4 py-4 bg-apricot-50 text-apricot-600 rounded-2xl font-bold uppercase tracking-widest text-[12px] hover:bg-apricot-100 transition"
                  >
                    Confirm Location
                  </button>
                </div>
              )}

              {!showMapPicker && (
                <div className="px-10 py-6 border-t border-apricot-50 bg-gray-50/30 shrink-0">
                  <button
                    form="share-form"
                    type="submit"
                    disabled={loading || !selectedLocation}
                    className="w-full h-16 rounded-2xl bg-gradient-to-r from-apricot-400 to-[#ff6670] hover:from-[#ff6670] hover:to-bordeaux-800 text-white font-black uppercase tracking-[0.2em] text-[12px] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Share with Community"
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
