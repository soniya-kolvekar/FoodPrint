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
    expiry: "",
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
        setFormData({ name: "", quantity: "1", unit: "pieces", customUnit: "", expiry: "" });
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
            className="fixed inset-0 bg-bordeaux-950/20 backdrop-blur-md z-[110]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[120] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[48px] shadow-3xl overflow-hidden pointer-events-auto border border-apricot-100"
            >
              {/* Header */}
              <div className="bg-apricot-50 px-10 py-8 flex justify-between items-center border-b border-apricot-100">
                <div>
                  <h2 className="text-[32px] font-serif text-bordeaux-800 leading-none mb-2">Add <span className="italic font-normal opacity-40">Item</span></h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300">Manual Inventory Append</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full bg-white border border-apricot-100 flex items-center justify-center text-bordeaux-300 hover:text-bordeaux-800 transition shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                {/* Item Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Ingredient Name</label>
                  <div className="relative">
                    <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-bordeaux-200" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="Fresh Milk, Avocados..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-apricot-100 rounded-2xl h-14 pl-14 pr-6 focus:border-apricot-500 outline-none transition-all font-medium text-bordeaux-800 placeholder:text-bordeaux-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Quantity</label>
                    <div className="relative">
                      <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-bordeaux-200" size={18} />
                      <input
                        required
                        type="number"
                        min="1"
                        step="any"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full bg-white border border-apricot-100 rounded-2xl h-14 pl-14 pr-6 focus:border-apricot-500 outline-none transition-all font-medium text-bordeaux-800"
                      />
                    </div>
                  </div>

                  {/* Unit Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Unit</label>
                    <div className="relative">
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full bg-white border border-apricot-100 rounded-2xl h-14 px-6 appearance-none focus:border-apricot-500 outline-none transition-all font-medium text-bordeaux-800 cursor-pointer"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u.charAt(0).toUpperCase() + u.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-bordeaux-200 pointer-events-none" size={16} />
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Custom Unit Name</label>
                    <input
                      required
                      type="text"
                      placeholder="carton, pouch..."
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      className="w-full bg-white border border-apricot-100 rounded-2xl h-14 px-6 focus:border-apricot-500 outline-none transition-all font-medium text-bordeaux-800 placeholder:text-bordeaux-100"
                    />
                  </motion.div>
                )}

                {/* Expiry Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-bordeaux-300 ml-1">Expiry Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-bordeaux-200" size={18} />
                    <input
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="w-full bg-white border border-apricot-100 rounded-2xl h-14 pl-14 pr-6 focus:border-apricot-500 outline-none transition-all font-medium text-bordeaux-800"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full h-16 rounded-2xl bg-apricot-500 hover:bg-bordeaux-800 text-white font-black uppercase tracking-[0.2em] text-[12px] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
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
