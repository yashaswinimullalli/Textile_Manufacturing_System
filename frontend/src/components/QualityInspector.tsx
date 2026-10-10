"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  MapPin, 
  X, 
  Check, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Search, 
  Truck,
  Layers,
  ArrowLeft
} from "lucide-react";
import { useFabricTrace, FabricRoll } from "@/context/FabricTraceContext";

export type DefectType = "Hole" | "Wrong Color" | "Bad Weave";

export interface DefectPin {
  id: string;
  x: number; // percentage
  y: number; // percentage
  defect: DefectType;
}

export type StampDecision = "PASS" | "REWORK" | "REJECT" | null;

export default function QualityInspector() {
  const { fabricRolls, stampRoll, isSyncing, isOnline } = useFabricTrace();

  // Selected roll state
  const [selectedRoll, setSelectedRoll] = useState<FabricRoll | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fabric defect pins
  const [pins, setPins] = useState<DefectPin[]>([]);
  const [pendingClick, setPendingClick] = useState<{ x: number; y: number } | null>(null);

  // Active watermark stamp animation
  const [activeWatermark, setActiveWatermark] = useState<{ text: string; color: string; border: string; bg: string } | null>(null);

  // Initialize selected roll
  useEffect(() => {
    if (fabricRolls.length > 0 && !selectedRoll) {
      setSelectedRoll(fabricRolls[0]);
    } else if (selectedRoll) {
      // Keep selectedRoll in sync with global state
      const updated = fabricRolls.find(r => r.rollId === selectedRoll.rollId || r.roll_code === selectedRoll.roll_code);
      if (updated) setSelectedRoll(updated);
    }
  }, [fabricRolls, selectedRoll]);

  // When selected roll changes, clear pins
  const handleSelectRoll = (roll: FabricRoll) => {
    setSelectedRoll(roll);
    setPins([]);
    setPendingClick(null);
  };

  // Filter rolls by search query
  const filteredRolls = fabricRolls.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.rollId.toLowerCase().includes(q) || 
           r.fabricType.toLowerCase().includes(q) ||
           (r.roll_code && r.roll_code.toLowerCase().includes(q));
  });

  // Tap fabric map to drop pin and prompt "What's wrong here?"
  const handleFabricMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingClick({ x, y });
  };

  const handleSelectDefect = (defect: DefectType) => {
    if (!pendingClick) return;
    const newPin: DefectPin = {
      id: `pin-${Date.now()}`,
      x: pendingClick.x,
      y: pendingClick.y,
      defect
    };
    setPins(prev => [...prev, newPin]);
    setPendingClick(null);
  };

  const handleRemovePin = (pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPins(prev => prev.filter(p => p.id !== pinId));
  };

  // Apply Rubber Stamp
  const handleStamp = async (decision: "PASS" | "REWORK" | "REJECT") => {
    if (!selectedRoll) return;

    // Trigger giant watermark animation
    if (decision === "PASS") {
      setActiveWatermark({
        text: "PASSED",
        color: "text-emerald-700",
        border: "border-emerald-700",
        bg: "bg-emerald-50/90"
      });
    } else if (decision === "REWORK") {
      setActiveWatermark({
        text: "REWORK",
        color: "text-amber-800",
        border: "border-amber-700",
        bg: "bg-amber-50/90"
      });
    } else {
      setActiveWatermark({
        text: "REJECTED",
        color: "text-rose-700",
        border: "border-rose-700",
        bg: "bg-rose-50/90"
      });
    }

    // Call global state stamp function
    await stampRoll(
      selectedRoll.roll_code || selectedRoll.rollId,
      decision,
      pins,
      pins.length > 0 ? `Flagged ${pins.length} defect(s)` : "Inspected on factory tablet."
    );

    // Reset watermark after 1.8 seconds
    setTimeout(() => {
      setActiveWatermark(null);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 sm:p-8 space-y-8 select-none">
      
      {/* ─── Top Bar: Navigation & Sync Status ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Home</span>
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                Floor Worker UI
              </span>
              <span className="text-xs font-bold text-slate-500">
                50 Dynamic Rolls
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Quality Inspector
            </h1>
          </div>
        </div>

        {/* Sync & Role Switch Buttons */}
        <div className="flex items-center gap-4">
          
          {/* Offline / Online Status */}
          <div className={`px-4 py-3 rounded-2xl border-2 text-sm font-black flex items-center gap-2 ${
            isOnline 
              ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
              : "bg-amber-50 border-amber-400 text-amber-900"
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-emerald-600" />
                <span>Wi-Fi Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-amber-600" />
                <span>Wi-Fi Offline (Saving Locally)</span>
              </>
            )}
          </div>

          {/* Syncing Indicator */}
          {isSyncing && (
            <div className="px-4 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black flex items-center gap-2 shadow-md animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}

          {/* Switch to Truck Scanner */}
          <Link
            href="/dispatch"
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Truck className="w-5 h-5" />
            <span>Go to Truck Scanner</span>
          </Link>

        </div>
      </div>

      {/* ─── Main Two-Panel Layout (Left: 50 Rolls | Right: Shipping Tag) ────── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ─── LEFT PANEL: The Roll List (Wide, Scrollable, Huge Text) ───────── */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col space-y-6">
          
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Fabric Rolls ({filteredRolls.length})
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Tap any roll to check and stamp.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-6 h-6 absolute left-4 top-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search roll ID or fabric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* 50 Dynamic Rolls List with Huge Text & Massive Tap Targets */}
          <div className="max-h-[680px] overflow-y-auto space-y-4 pr-2">
            {filteredRolls.map((roll) => {
              const isSelected = selectedRoll?.rollId === roll.rollId;
              const isPassed = roll.status === "PASSED";
              const isRejected = roll.status === "REJECTED";
              const isRework = roll.status === "REWORK";

              return (
                <button
                  key={roll.rollId}
                  onClick={() => handleSelectRoll(roll)}
                  className={`w-full text-left p-6 rounded-3xl border-4 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200"
                  }`}
                >
                  <div className="space-y-1">
                    {/* HUGE ROLL ID */}
                    <div className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}>
                      {roll.rollId}
                    </div>

                    {/* HUGE FABRIC TYPE */}
                    <div className={`text-lg sm:text-xl font-bold ${
                      isSelected ? "text-slate-300" : "text-slate-600"
                    }`}>
                      {roll.fabricType}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPassed && (
                      <span className="px-4 py-2 rounded-2xl bg-emerald-500 text-white text-sm font-black uppercase tracking-wider">
                        PASS
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-sm font-black uppercase tracking-wider">
                        REJECT
                      </span>
                    )}
                    {isRework && (
                      <span className="px-4 py-2 rounded-2xl bg-amber-400 text-amber-950 text-sm font-black uppercase tracking-wider">
                        REWORK
                      </span>
                    )}
                    {!isPassed && !isRejected && !isRework && (
                      <span className="px-4 py-2 rounded-2xl bg-slate-200 text-slate-700 text-sm font-black uppercase tracking-wider">
                        WAIT
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* ─── RIGHT PANEL: The Physical Shipping Tag ───────────────────────── */}
        <div className="lg:col-span-7 flex flex-col space-y-8">
          
          {/* THE SHIPPING TAG (Beige paper, dashed border, eyelet hole) */}
          <div className="relative bg-[#FAF7EE] border-4 border-dashed border-stone-400 rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden">
            
            {/* Tag Eyelet Hole at the Top */}
            <div className="w-full flex justify-center -mt-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-stone-200 border-4 border-stone-400 shadow-inner flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-stone-400"></div>
              </div>
            </div>

            {/* Tag Header */}
            <div className="border-b-2 border-stone-300 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-stone-500 block">
                  PHYSICAL SHIPPING TAG
                </span>
                <div className="text-4xl sm:text-5xl font-black text-stone-900 font-mono tracking-tight mt-1">
                  {selectedRoll ? selectedRoll.rollId : "Select a Roll"}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-stone-700 mt-1">
                  {selectedRoll ? selectedRoll.fabricType : "No Fabric Selected"}
                </div>
              </div>

              {/* Status Stamp Badge */}
              <div className="shrink-0">
                <span className={`px-5 py-2.5 rounded-2xl text-base font-black uppercase border-2 ${
                  selectedRoll?.status === "PASSED" ? "bg-emerald-100 text-emerald-800 border-emerald-400" :
                  selectedRoll?.status === "REJECTED" ? "bg-rose-100 text-rose-800 border-rose-400" :
                  selectedRoll?.status === "REWORK" ? "bg-amber-100 text-amber-900 border-amber-400" :
                  "bg-stone-200 text-stone-700 border-stone-300"
                }`}>
                  {selectedRoll?.status || "NOT CHECKED"}
                </span>
              </div>
            </div>

            {/* ─── THE FABRIC MAP (Touch anywhere to drop red MapPin) ─────────── */}
            <div className="mt-8 space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
                    The Fabric Map
                  </h3>
                  <p className="text-xs font-bold text-stone-600">
                    Tap anywhere on the cloth below to mark a bad spot.
                  </p>
                </div>

                {pins.length > 0 && (
                  <button
                    onClick={() => setPins([])}
                    className="text-xs font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Pins ({pins.length})
                  </button>
                )}
              </div>

              {/* Interactive Cloth Surface */}
              <div
                onClick={handleFabricMapClick}
                className="relative h-64 sm:h-80 w-full rounded-2xl border-4 border-stone-300 bg-[#F4EFE6] shadow-inner overflow-hidden cursor-crosshair select-none"
                style={{
                  backgroundImage: `radial-gradient(#C8BFA9 2px, transparent 2px), radial-gradient(#C8BFA9 2px, #F4EFE6 2px)`,
                  backgroundSize: "28px 28px",
                  backgroundPosition: "0 0, 14px 14px"
                }}
              >
                {/* Empty Prompt */}
                {pins.length === 0 && !pendingClick && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                    <span className="text-sm font-bold text-stone-500 bg-white/80 px-6 py-3 rounded-full border border-stone-300 shadow-sm text-center">
                      Tap fabric to drop defect pin
                    </span>
                  </div>
                )}

                {/* Dropped MapPins */}
                {pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="absolute -translate-x-1/2 -translate-y-full cursor-pointer z-10 group"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onClick={(e) => handleRemovePin(pin.id, e)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-1.5 rounded-full bg-rose-600 text-white shadow-xl border-2 border-white group-hover:scale-125 transition">
                        <MapPin className="w-6 h-6 fill-rose-600" />
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-stone-900 text-white text-xs font-black whitespace-nowrap shadow-md mt-1">
                        {pin.defect}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Pin Drop Question Modal: "What's wrong here?" */}
                {pendingClick && (
                  <div 
                    className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-stone-900 shadow-2xl max-w-md w-full space-y-6 text-center">
                      
                      <div className="space-y-1">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                          <MapPin className="w-7 h-7" />
                        </div>
                        <h4 className="text-2xl font-black text-stone-900">
                          What&apos;s wrong here?
                        </h4>
                        <p className="text-xs font-bold text-stone-500">
                          Pick one defect for this spot.
                        </p>
                      </div>

                      {/* 3 Simple Large Buttons: [Hole] [Wrong Color] [Bad Weave] */}
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => handleSelectDefect("Hole")}
                          className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-lg font-black tracking-wide shadow-md transition cursor-pointer"
                        >
                          Hole
                        </button>
                        <button
                          onClick={() => handleSelectDefect("Wrong Color")}
                          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-lg font-black tracking-wide shadow-md transition cursor-pointer"
                        >
                          Wrong Color
                        </button>
                        <button
                          onClick={() => handleSelectDefect("Bad Weave")}
                          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-lg font-black tracking-wide shadow-md transition cursor-pointer"
                        >
                          Bad Weave
                        </button>
                      </div>

                      <button
                        onClick={() => setPendingClick(null)}
                        className="text-xs font-bold text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        Cancel
                      </button>

                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ─── GIANT ANGLED WATERMARK OVERLAY ────────────────────────────── */}
            <AnimatePresence>
              {activeWatermark && (
                <motion.div
                  initial={{ scale: 2.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <div
                    className={`px-12 py-6 rounded-3xl border-8 font-black text-5xl sm:text-7xl tracking-widest uppercase font-mono shadow-2xl rotate-[-12deg] ${activeWatermark.border} ${activeWatermark.color} ${activeWatermark.bg}`}
                  >
                    {activeWatermark.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ─── THE RUBBER STAMPS (3 Massive Chunky Bottom Buttons) ──────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            
            {/* PASS (Thick Green border) */}
            <button
              onClick={() => handleStamp("PASS")}
              className="p-8 rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white border-8 border-emerald-700 shadow-xl shadow-emerald-600/30 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-12 h-12 stroke-[3]" />
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider">
                PASS
              </span>
              <span className="text-xs font-bold text-emerald-100">
                GOOD / READY
              </span>
            </button>

            {/* REWORK (Thick Yellow border) */}
            <button
              onClick={() => handleStamp("REWORK")}
              className="p-8 rounded-3xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-900 border-8 border-amber-500 shadow-xl shadow-amber-400/30 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-12 h-12 stroke-[3]" />
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider">
                REWORK
              </span>
              <span className="text-xs font-bold text-stone-900">
                WAIT / FIX
              </span>
            </button>

            {/* REJECT (Thick Red border) */}
            <button
              onClick={() => handleStamp("REJECT")}
              className="p-8 rounded-3xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white border-8 border-rose-700 shadow-xl shadow-rose-600/30 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-12 h-12 stroke-[3]" />
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider">
                REJECT
              </span>
              <span className="text-xs font-bold text-rose-100">
                STOP / BAD
              </span>
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
