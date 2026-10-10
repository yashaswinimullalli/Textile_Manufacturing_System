"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Truck, 
  Package, 
  Lock, 
  ArrowLeft, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Send
} from "lucide-react";
import { useFabricTrace } from "@/context/FabricTraceContext";

// Play audio chime on pass
function playSuccessTick() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Browser audio policy fallback
  }
}

interface LoadedPackage {
  id: string;
  rollCode: string;
  fabricType: string;
  weight: number;
  value: number;
}

export default function DispatchScanner() {
  const { fabricRolls } = useFabricTrace();

  const [scannedInput, setScannedInput] = useState("");
  const [scanState, setScanState] = useState<"idle" | "pass" | "reject">("idle");
  const [loadedPackages, setLoadedPackages] = useState<LoadedPackage[]>([
    { id: "pkg-1", rollCode: "#1001", fabricType: "100% Combed Cotton", weight: 125, value: 45000 },
    { id: "pkg-2", rollCode: "#1005", fabricType: "Modal Satin Blend", weight: 95, value: 68000 }
  ]);
  const [currentPassRoll, setCurrentPassRoll] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Scan roll handler
  const handleScan = async (codeToScan?: string) => {
    const raw = (codeToScan || scannedInput).trim().toUpperCase();
    if (!raw) return;

    const cleanNum = raw.replace(/^#/, "").replace(/^ROLL-/, "");
    const formattedId = `#${cleanNum}`;
    const formattedCode = `ROLL-${cleanNum}`;

    const foundRoll = fabricRolls.find(
      r => r.rollId === formattedId || r.roll_code === formattedCode
    );

    let apiStatus = "UNKNOWN";
    try {
      const res = await fetch("http://localhost:5000/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roll_code: formattedCode })
      });
      if (!res.ok) {
        apiStatus = "BLOCKED";
      } else {
        apiStatus = "PASS";
      }
    } catch (e) {
      // If server unreachable, use global state
    }

    const isPass = 
      (foundRoll && foundRoll.status === "PASSED") ||
      apiStatus === "PASS";

    const isReject = 
      (foundRoll && (foundRoll.status === "REJECTED" || foundRoll.status === "REWORK")) ||
      apiStatus === "BLOCKED";

    if (isPass && !isReject) {
      setScanState("pass");
      setCurrentPassRoll(formattedId);
      playSuccessTick();

      const newPkg: LoadedPackage = {
        id: `pkg-${Date.now()}`,
        rollCode: formattedId,
        fabricType: foundRoll?.fabricType || "Cloth Roll",
        weight: Math.floor(Math.random() * 50) + 80,
        value: Math.floor(Math.random() * 50000) + 30000
      };

      setLoadedPackages(prev => [newPkg, ...prev]);
      setScannedInput("");

      setTimeout(() => {
        setScanState("idle");
      }, 2500);

    } else {
      setScanState("reject");
    }
  };

  const handleClearAlarm = () => {
    setScanState("idle");
    setScannedInput("");
  };

  const handleDispatch = () => {
    if (loadedPackages.length === 0) return;
    setIsDispatching(true);
    
    // Simulate truck driving away
    setTimeout(() => {
      setLoadedPackages([]);
      setIsDispatching(false);
      setDispatchSuccess(true);
      
      setTimeout(() => {
        setDispatchSuccess(false);
      }, 3000);
    }, 1500);
  };

  const totalWeight = loadedPackages.reduce((acc, p) => acc + p.weight, 0);
  const totalValue = loadedPackages.reduce((acc, p) => acc + p.value, 0);

  return (
    <div className={`min-h-screen font-sans transition-all duration-500 select-none ${
      scanState === "pass" ? "bg-emerald-50" : "bg-slate-50"
    }`}>
      
      {/* ─── FULLSCREEN RED ALARM FREEZE ─────────────────────────────────────── */}
      <AnimatePresence>
        {scanState === "reject" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-600/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center text-white"
          >
            <div className="max-w-2xl flex flex-col items-center space-y-6 animate-in zoom-in-95">
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-serif tracking-tight">Quality Block Active</h1>
                <p className="text-lg font-light text-red-100">
                  This roll did not pass quality inspection and cannot be loaded onto the truck.
                </p>
              </div>
              <button
                onClick={handleClearAlarm}
                className="mt-8 px-10 py-4 rounded-xl bg-white text-red-600 hover:bg-slate-100 active:scale-95 text-lg font-medium tracking-wide transition shadow-lg"
              >
                Clear Scanner
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h2 className="text-3xl font-serif text-slate-900 tracking-tight">
              Loading Dock
            </h2>
            <p className="text-sm text-slate-500 mt-1">Scan approved rolls and dispatch deliveries.</p>
          </div>

          <Link
            href="/quality-inspector"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4" />
            <span>Quality Inspection</span>
          </Link>
        </div>

        {/* Dispatch Success Banner */}
        <AnimatePresence>
          {dispatchSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center gap-3 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium">Truck dispatched successfully! The shipment is on its way.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Scanner Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="text-lg font-serif text-slate-800 mb-6">Scan Roll Barcode</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="e.g. 1001 or #1001"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  className="w-full text-xl font-mono p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                  autoFocus
                />
                <button
                  onClick={() => handleScan()}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium shadow-sm transition active:scale-[0.98]"
                >
                  Scan Package
                </button>
              </div>

              {/* Quick-Test Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Simulator</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleScan("#1001")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition"
                  >
                    Simulate Pass
                  </button>
                  <button
                    onClick={() => handleScan("#1042")}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium transition"
                  >
                    Simulate Reject
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Truck & Load Summary */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative">
            
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-serif text-slate-800">Dispatch Manifest</h3>
                <p className="text-sm text-slate-500 mt-1">Today's outgoing shipment</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Value</p>
                <p className="text-2xl font-serif text-indigo-700">
                  ₹{totalValue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Truck Animation Container */}
            <div className="relative min-h-[220px] bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col overflow-hidden">
              <motion.div 
                className="flex items-start gap-6 absolute inset-x-6 top-6"
                initial={{ x: 0, opacity: 1 }}
                animate={isDispatching ? { x: 800, opacity: 0 } : { x: 0, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                {/* Truck Cabin */}
                <div className="shrink-0 flex flex-col items-center mt-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <Truck className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-2">{totalWeight} kg</p>
                </div>

                {/* Cargo Area */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3">
                    {loadedPackages.length === 0 && !isDispatching ? (
                      <div className="w-full text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        Ready to load packages
                      </div>
                    ) : (
                      loadedPackages.map((pkg) => (
                        <motion.div
                          key={pkg.id}
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-24 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-1"
                        >
                          <Package className="w-5 h-5 text-indigo-500 mb-1" />
                          <span className="font-mono text-xs font-medium text-slate-800">
                            {pkg.rollCode}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {pkg.fabricType}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 flex justify-between items-center pt-2">
              <div className="flex gap-4 items-center">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Packages</p>
                  <p className="text-lg font-medium text-slate-800">{loadedPackages.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Est. Weight</p>
                  <p className="text-lg font-medium text-slate-800">{totalWeight} kg</p>
                </div>
              </div>
              <button
                onClick={handleDispatch}
                disabled={loadedPackages.length === 0 || isDispatching}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Truck</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
