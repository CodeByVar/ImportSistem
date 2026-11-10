import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Zap, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TestBanner({ className, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClicked, setIsClicked] = useState(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all",
          "bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10",
          "border-orange-500/30 dark:border-orange-500/20",
          "text-slate-800 dark:text-slate-100",
          className
        )}
      >
        {/* Glow ambient background effect */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-500/15 blur-2xl dark:bg-orange-500/20"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          {/* Info section */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/30 dark:bg-orange-500">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 fill-current" /> shadcn/ui & v0 Ready
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Alias @ activo
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Framer Motion, Lucide Icons y la utilidad <code className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-xs text-orange-600 dark:text-orange-300">cn()</code> están listos para usar.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsClicked(!isClicked)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer",
                isClicked
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/25"
                  : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-slate-900/10"
              )}
            >
              <span>{isClicked ? "¡Animación Funcionando!" : "Probar Animación"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>

            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:text-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar banner de prueba"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

