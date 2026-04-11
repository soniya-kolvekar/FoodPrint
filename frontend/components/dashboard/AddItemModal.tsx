"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Package, Hash, Loader2 } from "lucide-react";
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden pointer-events-auto border border-gray-100"
            >
              {/* Header */}
              <div className="bg-apricot-50 px-8 py-6 flex justify-between items-center border-b border-apricot-100">
                <div>
                  <h2 className="text-2xl font-bold text-bordeaux-800">Add New Item</h2>
                  <p className="text-sm text-bordeaux-500">Manual entry with smart images</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-full transition-colors text-bordeaux-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-bordeaux-700 ml-1">Item Name</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Fresh Milk, Avocados"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border-gray-200 border-2 rounded-2xl h-12 pl-12 pr-4 focus:border-apricot-400 focus:bg-white outline-none transition-all font-medium text-bordeaux-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-bordeaux-700 ml-1">Quantity</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        required
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full bg-gray-50 border-gray-200 border-2 rounded-2xl h-12 pl-12 pr-4 focus:border-apricot-400 focus:bg-white outline-none transition-all font-medium text-bordeaux-900"
                      />
                    </div>
                  </div>

                  {/* Unit Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-bordeaux-700 ml-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-gray-50 border-gray-200 border-2 rounded-2xl h-12 px-4 focus:border-apricot-400 focus:bg-white outline-none transition-all font-medium text-bordeaux-900"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u.charAt(0).toUpperCase() + u.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Unit Input (Conditional) */}
                {formData.unit === "custom" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-sm font-bold text-bordeaux-700 ml-1">Enter Unit Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. carton, pouch"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      className="w-full bg-gray-50 border-gray-200 border-2 rounded-2xl h-12 px-4 focus:border-apricot-400 focus:bg-white outline-none transition-all font-medium text-bordeaux-900"
                    />
                  </motion.div>
                )}

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-bordeaux-700 ml-1">Expiry Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="w-full bg-gray-50 border-gray-200 border-2 rounded-2xl h-12 pl-12 pr-4 focus:border-apricot-400 focus:bg-white outline-none transition-all font-medium text-bordeaux-900"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    disabled={loading}
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-apricot-400 hover:bg-apricot-500 text-white font-bold text-lg shadow-lg shadow-apricot-200/50 transition-all active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={20} className="mr-2" /> Add to Pantry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
