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
    if (days === null) return "text-[#fffbfa]/70 bg-white/5 border-white/10";
    if (days <= 0) return "text-[#cf3053] bg-[#cf3053]/10 border-[#cf3053]/20";
    if (days <= 3) return "text-[#e98016] bg-[#e98016]/10 border-[#e98016]/20";
    return "text-green-400 bg-green-500/10 border-green-500/20";
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[120] pointer-events-none font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#450920]/90 backdrop-blur-3xl w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto border border-white/10 text-[#fffbfa]"
            >
              <div className="p-10 text-[#fffbfa]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-[32px] font-black capitalize mb-1 leading-none font-sans">{itemName}</h3>
                    <p className="text-[#f9dbbd]/70 text-[12px] font-bold uppercase tracking-widest">Batch Breakdown</p>
                  </div>
                  <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[#fffbfa]/70 hover:text-[#fffbfa] transition border border-white/10">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {batches.map((batch, idx) => {
                    const daysLeft = calculateDaysLeft(batch.expiry);
                    return (
                      <div key={batch.id || idx} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#da627d] border border-white/10 group-hover:bg-[#da627d] group-hover:text-white transition-colors">
                             <Package size={22} />
                          </div>
                          <div>
                            <p className="text-[18px] font-bold text-[#fffbfa]">{batch.quantity} {unit}</p>
                            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-[#fffbfa]/40">
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
                       <p className="text-[#fffbfa]/40 italic font-sans">No batch data available</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center">
                  <p className="text-[10px] text-center text-[#fffbfa]/40 font-bold uppercase tracking-widest mb-6">
                    Oldest batches prioritized first
                  </p>
                  <button onClick={onClose} className="w-full py-5 bg-[#da627d] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-[#cf3053] transition shadow-lg">
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
