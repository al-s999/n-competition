"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

interface DrawAnimationOverlayProps {
  animatingDraws: {
    id: string;
    name: string;
    school: string;
    index: number; // for staggering
  }[];
}

export function DrawAnimationOverlay({ animatingDraws }: DrawAnimationOverlayProps) {
  if (animatingDraws.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-4xl h-full flex flex-wrap items-center justify-center gap-6 p-12">
        <AnimatePresence>
          {animatingDraws.map((draw) => (
            <motion.div
              key={`draw-center-${draw.id}`}
              layoutId={`draw-card-${draw.id}`}
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: draw.index * 0.1
                }
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-zinc-900 border border-[#00e599]/50 shadow-[0_0_30px_-5px_rgba(0,229,153,0.3)] rounded-xl p-6 flex flex-col items-center justify-center min-w-[280px] max-w-[320px]"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-[#00e599] flex items-center justify-center mb-4 overflow-hidden">
                <User className="w-10 h-10 text-zinc-500" />
              </div>
              <h3 className="text-white font-bold text-lg text-center mb-1">{draw.name}</h3>
              <p className="text-zinc-400 text-sm text-center">{draw.school}</p>
              
              <div className="mt-4 px-3 py-1 rounded-full bg-[#00e599]/10 text-[#00e599] text-[10px] font-bold uppercase tracking-wider">
                Qualifier
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
