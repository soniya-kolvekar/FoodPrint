"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Package, AlertTriangle } from "lucide-react";

interface Batch {
  id: string;
  quantity: number;
  expiry: string | null;
  addedAt: string;
}

interface BatchBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  unit: string;
  batches: Batch[];
}

export function BatchBreakdown({ isOpen, onClose, itemName, unit, batches }: BatchBreakdownProps) {
  const calculateDaysLeft = (expiry: string | null) => {
    if (!expiry) return null;
    const diff = new Date(expiry).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days: number | null) => {
    if (days === null) return "text-bordeaux-300 bg-gray-50 border-gray-100";
    if (days <= 0) return "text-[#cf3053] bg-blush-50 border-[#cf3053]/20";
    if (days <= 3) return "text-[#e98016] bg-apricot-50 border-[#e98016]/20";
    return "text-green-700 bg-green-50 border-green-200";
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
              className="bg-white w-full max-w-sm rounded-[48px] shadow-3xl overflow-hidden pointer-events-auto border border-apricot-100"
            >
              <div className="p-10 text-bordeaux-800">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-[32px] font-serif capitalize mb-1 leading-none">{itemName}</h3>
                    <p className="text-bordeaux-300 text-[12px] font-bold uppercase tracking-widest">Batch Breakdown</p>
                  </div>
                  <button onClick={onClose} className="w-11 h-11 rounded-full bg-apricot-50 flex items-center justify-center text-bordeaux-300 hover:text-bordeaux-800 transition border border-apricot-100">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {batches.map((batch, idx) => {
                    const daysLeft = calculateDaysLeft(batch.expiry);
                    return (
                      <div key={batch.id || idx} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-apricot-50 hover:border-apricot-200 transition group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-apricot-50 rounded-2xl flex items-center justify-center text-apricot-500 border border-apricot-100 group-hover:bg-apricot-500 group-hover:text-white transition-colors">
                             <Package size={22} />
                          </div>
                          <div>
                            <p className="text-[18px] font-bold text-bordeaux-800">{batch.quantity} {unit}</p>
                            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-bordeaux-200">
                              Added {new Date(batch.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition shadow-sm ${getStatusColor(daysLeft)}`}>
                          {daysLeft === null ? "Infinite" : daysLeft <= 0 ? "Expired" : `${daysLeft}D`}
                        </div>
                      </div>
                    );
                  })}

                  {!batches.length && (
                    <div className="text-center py-12">
                       <p className="text-bordeaux-200 italic font-serif">No batch data available</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-10 pt-8 border-t border-apricot-50 flex flex-col items-center">
                  <p className="text-[10px] text-center text-bordeaux-200 font-bold uppercase tracking-widest mb-6">
                    Oldest batches prioritized first
                  </p>
                  <button onClick={onClose} className="w-full py-5 bg-apricot-500 text-white rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-bordeaux-800 transition shadow-lg">
                    Close Breakdown
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
