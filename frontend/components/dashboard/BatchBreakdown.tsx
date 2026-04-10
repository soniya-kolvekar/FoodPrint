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
    if (days === null) return "text-gray-500 bg-gray-100";
    if (days <= 0) return "text-red-700 bg-red-100";
    if (days <= 3) return "text-orange-700 bg-orange-100";
    return "text-green-700 bg-green-100";
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[120] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden pointer-events-auto border border-gray-100"
            >
              <div className="bg-bordeaux-800 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold capitalize">{itemName}</h3>
                  <p className="text-bordeaux-200 text-xs">Detailed Batch Breakdown</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {batches.map((batch, idx) => {
                    const daysLeft = calculateDaysLeft(batch.expiry);
                    return (
                      <div key={batch.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-bordeaux-600">
                             <Package size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-bordeaux-900">{batch.quantity} {unit}</p>
                            <div className="flex items-center text-[10px] text-gray-500">
                              <Calendar size={10} className="mr-1" /> Added {new Date(batch.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center ${getStatusColor(daysLeft)}`}>
                          {daysLeft === null ? "No Expiry" : daysLeft <= 0 ? "Expired" : `${daysLeft} days left`}
                          {daysLeft !== null && daysLeft <= 3 && <AlertTriangle size={10} className="ml-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!batches.length && (
                  <div className="text-center py-8">
                     <p className="text-gray-400">No batch data available</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] text-center text-gray-400">
                  Consumption always starts from the oldest batch to minimize waste.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
