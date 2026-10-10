"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Truck, 
  Package, 
  Lock, 
  RotateCcw, 
  Search, 
  ArrowLeft, 
  Layers, 
  CheckCircle2, 
  XCircle 
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
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

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
}

export default function DispatchScanner() {
  const { fabricRolls } = useFabricTrace();

  const [scannedInput, setScannedInput] = useState("");
  const [scanState, setScanState] = useState<"idle" | "pass" | "reject">("idle");
  const [loadedPackages, setLoadedPackages] = useState<LoadedPackage[]>([
    { id: "pkg-1", rollCode: "#1001", fabricType: "100% Cotton" }
  ]);
  const [currentPassRoll, setCurrentPassRoll] = useState<string | null>(null);

  // Scan roll handler
  const handleScan = async (codeToScan?: string) => {
    const raw = (codeToScan || scannedInput).trim().toUpperCase();
    if (!raw) return;

    const cleanNum = raw.replace(/^#/, "").replace(/^ROLL-/, "");
    const formattedId = `#${cleanNum}`;
    const formattedCode = `ROLL-${cleanNum}`;

    // 1. Check in real-time Global State
    const foundRoll = fabricRolls.find(
      r => r.rollId === formattedId || r.roll_code === formattedCode
    );

    // Also call backend API to enforce Zod backend security
    let apiStatus = "UNKNOWN";
    try {
      const res = await fetch("http://localhost:5000/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roll_code: formattedCode })
      });
      const data = await res.json();
      if (!res.ok) {
        apiStatus = "BLOCKED";
      } else {
        apiStatus = "PASS";
      }
    } catch (e) {
      // If server unreachable, use global state
    }

    // Determine if roll can be loaded:
    // Must be PASSED (not REJECTED, not REWORK, not uninspected)
    const isPass = 
      (foundRoll && foundRoll.status === "PASSED") ||
      apiStatus === "PASS";

    const isReject = 
      (foundRoll && (foundRoll.status === "REJECTED" || foundRoll.status === "REWORK")) ||
      apiStatus === "BLOCKED";

    if (isPass && !isReject) {
      // ─── GREEN LIGHT: SUCCESS STATE ──────────────────────────────────────
      setScanState("pass");
      setCurrentPassRoll(formattedId);
      playSuccessTick();

      const newPkg: LoadedPackage = {
        id: `pkg-${Date.now()}`,
        rollCode: formattedId,
        fabricType: foundRoll?.fabricType || "Cloth Roll"
      };

      setLoadedPackages(prev => [newPkg, ...prev]);
      setScannedInput("");

      // Return to normal screen border after 3 seconds
      setTimeout(() => {
        setScanState("idle");
      }, 3000);

    } else {
      // ─── RED ALARM: ERROR STATE ──────────────────────────────────────────
      setScanState("reject");
    }
  };

  // Clear freeze screen
  const handleClearAlarm = () => {
    setScanState("idle");
    setScannedInput("");
  };

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 select-none ${
      scanState === "pass" ? "border-[16px] border-emerald-500 bg-white" : "border-[16px] border-transparent bg-slate-50"
    }`}>
      
      {/* ─── FULLSCREEN RED ALARM FREEZE (Feature 3 Requirement) ─────────────── */}
      <AnimatePresence>
        {scanState === "reject" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center p-8 text-center text-white"
          >
            <div className="max-w-3xl flex flex-col items-center space-y-8 animate-in zoom-in-95">
              
              {/* Giant Lock Icon */}
              <div className="w-36 h-36 rounded-3xl bg-white/10 backdrop-blur-md border-8 border-white flex items-center justify-center shadow-2xl">
                <Lock className="w-24 h-24 text-white" />
              </div>

              {/* Massive White Text: "STOP: BAD ROLL. CANNOT LOAD." */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight uppercase font-mono">
                  STOP: BAD ROLL.<br />CANNOT LOAD.
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-red-100">
                  This roll did not pass quality check. Take it off the truck.
                </p>
              </div>

              {/* Giant CLEAR Button to Unfreeze Screen */}
              <button
                onClick={handleClearAlarm}
                className="px-16 py-8 rounded-3xl bg-white hover:bg-slate-100 active:scale-95 text-red-600 text-3xl sm:text-4xl font-black tracking-wider uppercase shadow-2xl transition cursor-pointer border-4 border-white"
              >
                CLEAR
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Normal Loading Dock Screen ─────────────────────────────────────── */}
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
          
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-sm">Home</span>
            </Link>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Loading Dock UI
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Red-Light Scanner
              </h2>
            </div>
          </div>

          <Link
            href="/quality-inspector"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-black flex items-center gap-2 cursor-pointer transition"
          >
            <Layers className="w-5 h-5" />
            <span>Check Fabric (Stamp & Tag)</span>
          </Link>

        </div>

        {/* Success Green Light Banner */}
        {scanState === "pass" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-emerald-500 text-white flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10" />
              <div>
                <h3 className="text-2xl font-black tracking-tight">
                  GOOD TO LOAD - PUT ON TRUCK
                </h3>
                <p className="text-sm font-bold text-emerald-100">
                  Roll {currentPassRoll} passed quality check.
                </p>
              </div>
            </div>
            <Package className="w-10 h-10 animate-bounce" />
          </motion.div>
        )}

        {/* ─── MASSIVE TEXT INPUT: "Scan Roll ID" ──────────────────────────────── */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-4 border-slate-300 shadow-xl space-y-6">
          
          <label className="block text-2xl sm:text-3xl font-black text-slate-900 text-center uppercase tracking-tight">
            Scan Roll ID
          </label>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="e.g. 1001 or #1001"
              value={scannedInput}
              onChange={(e) => setScannedInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1 text-center sm:text-left text-3xl sm:text-4xl font-mono font-black p-6 sm:p-8 rounded-3xl border-4 border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900"
              autoFocus
            />

            <button
              onClick={() => handleScan()}
              className="px-10 py-6 sm:py-8 rounded-3xl bg-slate-900 hover:bg-slate-800 text-white text-2xl font-black tracking-wide shadow-xl transition cursor-pointer"
            >
              SCAN
            </button>
          </div>

          {/* Quick-Test Buttons for Factory / Demo */}
          <div className="pt-4 border-t-2 border-slate-100 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              Quick Test:
            </span>
            <button
              onClick={() => handleScan("#1001")}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-800 text-xs font-black cursor-pointer"
            >
              Test Pass Roll (#1001)
            </button>
            <button
              onClick={() => handleScan("#1042")}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-black cursor-pointer"
            >
              Test Reject Roll (#1042)
            </button>
            <button
              onClick={() => handleScan("#1028")}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-black cursor-pointer"
            >
              Test Reject Roll (#1028)
            </button>
          </div>

        </div>

        {/* ─── LARGE TRUCK ICON GRAPHIC & CARGO BED ───────────────────────────── */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border-4 border-slate-800 shadow-2xl space-y-8">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-black tracking-tight">
                DELIVERY TRUCK
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-slate-400">
              {loadedPackages.length} Rolls Loaded
            </span>
          </div>

          {/* Truck Cargo Bed with Dropped Packages */}
          <div className="min-h-[180px] bg-slate-950 rounded-2xl p-6 border-4 border-dashed border-slate-800 flex flex-wrap gap-4 items-center">
            {loadedPackages.length === 0 ? (
              <div className="w-full text-center text-slate-600 font-bold text-base py-6">
                Truck is empty. Scan passed rolls to load.
              </div>
            ) : (
              loadedPackages.map((pkg, idx) => (
                <motion.div
                  key={pkg.id}
                  initial={{ scale: 0, y: -40 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-28 h-28 rounded-2xl bg-slate-800 border-4 border-emerald-500 p-3 flex flex-col justify-between shadow-lg"
                >
                  <Package className="w-8 h-8 text-emerald-400" />
                  <div>
                    <span className="font-mono text-sm font-black text-white block">
                      {pkg.rollCode}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {pkg.fabricType}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Big Truck Wheels */}
          <div className="flex justify-between px-12 pt-2">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-700 shadow-inner"></div>
              <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-700 shadow-inner"></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-700 shadow-inner"></div>
          </div>

        </div>

      </div>

    </div>
  );
}
