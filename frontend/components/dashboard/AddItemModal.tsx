"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Package, Hash, Loader2, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "@/context/AuthContext";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_UNITS = ["pieces", "kg", "g", "ml", "liter", "pack", "custom"];

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    unit: "pieces",
    customUnit: "",
    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const finalUnit = formData.unit === "custom" ? formData.customUnit : formData.unit;

      const response = await fetch("http://localhost:5000/api/pantry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          quantity: formData.quantity,
          unit: finalUnit,
          expiry: formData.expiry,
        }),
      });

      if (response.ok) {
        onClose();
        const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setFormData({ name: "", quantity: "1", unit: "pieces", customUnit: "", expiry: defaultExpiry });
      } else {
        console.error("Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[120] pointer-events-none font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#450920]/90 backdrop-blur-3xl w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto border border-white/10 text-[#fffbfa]"
            >
              {/* Header */}
              <div className="bg-white/5 px-10 py-8 flex justify-between items-center border-b border-white/10">
                <div>
                  <h2 className="text-[32px] font-black text-[#fffbfa] leading-none mb-2 font-sans">Add <span className="italic font-light text-[#da627d]">Item</span></h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f9dbbd]/70">Manual Inventory Append</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#fffbfa]/70 hover:text-[#fffbfa] transition shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                {/* Item Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#f9dbbd]/70 ml-1">Ingredient Name</label>
                  <div className="relative">
                    <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-[#da627d]" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="Fresh Milk, Avocados..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-14 pr-6 focus:border-[#da627d] outline-none transition-all font-medium text-[#fffbfa] placeholder:text-[#fffbfa]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#f9dbbd]/70 ml-1">Quantity</label>
                    <div className="relative">
                      <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-[#da627d]" size={18} />
                      <input
                        required
                        type="number"
                        min="1"
                        step="any"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-14 pr-6 focus:border-[#da627d] outline-none transition-all font-medium text-[#fffbfa]"
                      />
                    </div>
                  </div>

                  {/* Unit Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#f9dbbd]/70 ml-1">Unit</label>
                    <div className="relative">
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 appearance-none focus:border-[#da627d] outline-none transition-all font-medium text-[#fffbfa] cursor-pointer"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u} className="bg-[#450920] text-[#fffbfa]">
                            {u.charAt(0).toUpperCase() + u.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#fffbfa]/40 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                {/* Custom Unit Input (Conditional) */}
                {formData.unit === "custom" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#f9dbbd]/70 ml-1">Custom Unit Name</label>
                    <input
                      required
                      type="text"
                      placeholder="carton, pouch..."
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 focus:border-[#da627d] outline-none transition-all font-medium text-[#fffbfa] placeholder:text-[#fffbfa]/30"
                    />
                  </motion.div>
                )}

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#f9dbbd]/70 ml-1">Expiry Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-[#da627d]" size={18} />
                    <input
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-14 pr-6 focus:border-[#da627d] outline-none transition-all font-medium text-[#fffbfa]"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full h-16 rounded-2xl bg-[#da627d] hover:bg-[#cf3053] text-[#fffbfa] font-black uppercase tracking-[0.2em] text-[12px] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={18} /> Append to Pantry
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
