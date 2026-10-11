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
  Send,
  Camera,
  Image as ImageIcon,
  Keyboard,
  Upload
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
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

  const [activeTab, setActiveTab] = useState<'manual' | 'camera' | 'upload'>('manual');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const html5QrCodeRef = React.useRef<Html5Qrcode | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [scannedInput, setScannedInput] = useState("");
  const [scanState, setScanState] = useState<"idle" | "pass" | "reject">("idle");
  const [blockerReason, setBlockerReason] = useState<string>("");
  const [loadedPackages, setLoadedPackages] = useState<LoadedPackage[]>([]);
  const [currentPassRoll, setCurrentPassRoll] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [gatePassRecord, setGatePassRecord] = useState<any>(null);

  // Handle Camera scanning
  React.useEffect(() => {
    if (activeTab === 'camera') {
      startCameraScanning();
    } else {
      stopCameraScanning();
    }
    return () => {
      stopCameraScanning();
    };
  }, [activeTab]);

  const startCameraScanning = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('dispatch-camera-reader');
      html5QrCodeRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No camera found on this device.');
        return;
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCameraScanning();
          setActiveTab('manual');
          setScannedInput(decodedText);
          handleScan(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Camera access blocked.');
      setCameraActive(false);
    }
  };

  const stopCameraScanning = () => {
    if (html5QrCodeRef.current && cameraActive) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current?.clear();
        setCameraActive(false);
      }).catch(() => {});
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const html5QrCode = new Html5Qrcode('dispatch-camera-reader');
        const decodedText = await html5QrCode.scanFile(file, true);
        setActiveTab('manual');
        setScannedInput(decodedText);
        handleScan(decodedText);
      } catch (err) {
        alert("Could not read barcode from image. Please try another.");
      }
    }
  };

  // Scan roll handler: Validates strictly against PostgreSQL database
  const handleScan = async (codeToScan?: string) => {
    const raw = (codeToScan || scannedInput).trim().toUpperCase();
    if (!raw) return;

    try {
      const res = await fetch("http://localhost:5000/api/dispatch/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roll_code: raw })
      });
      const resJson = await res.json();

      if (res.ok && resJson.success && resJson.data?.can_dispatch) {
        const rollData = resJson.data;
        setScanState("pass");
        setCurrentPassRoll(rollData.roll_id);
        playSuccessTick();

        const rollWeight = parseFloat(rollData.available_quantity || rollData.total_weight || 500);
        const newPkg: LoadedPackage = {
          id: `pkg-${rollData.roll_id}-${Date.now()}`,
          rollCode: rollData.roll_id,
          fabricType: rollData.fabric_type || "Cotton Weave",
          weight: rollWeight,
          value: Math.round(rollWeight * 120)
        };

        setLoadedPackages((prev) => {
          if (prev.some((p) => p.rollCode === rollData.roll_id)) return prev;
          return [newPkg, ...prev];
        });
        setScannedInput("");

        setTimeout(() => {
          setScanState("idle");
        }, 2500);

      } else {
        const reason =
          resJson.data?.blocker_reason ||
          resJson.blocker_reason ||
          resJson.error?.message ||
          `Safety Gate Block: Roll ${raw} has not been approved in Quality Inspection.`;
        setBlockerReason(reason);
        setScanState("reject");
      }
    } catch (e: any) {
      setBlockerReason(`Database Connection Error: ${e.message}`);
      setScanState("reject");
    }
  };

  const handleClearAlarm = () => {
    setScanState("idle");
    setScannedInput("");
    setBlockerReason("");
  };

  // Commit dispatch to PostgreSQL database
  const handleDispatch = async () => {
    if (loadedPackages.length === 0) return;
    setIsDispatching(true);

    try {
      const res = await fetch("http://localhost:5000/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packages: loadedPackages.map((p) => ({
            roll_id: p.rollCode,
            quantity: p.weight,
            unit_price: 120,
          })),
          vehicle_number: "KA-04-E-8821",
          destination: "Main Logistics Hub",
        }),
      });

      const outcome = await res.json();
      if (res.ok && outcome.success) {
        setGatePassRecord(outcome.data?.dispatch || {
          dispatch_reference: `VAS-DSP-${Date.now().toString().slice(-6)}`,
          vehicle_number: "KA-04-E-8821",
          destination: "Main Logistics Hub",
        });
        setLoadedPackages([]);
        setDispatchSuccess(true);
      } else {
        alert(outcome.error?.message || "Could not authorize dispatch in database.");
      }
    } catch (err: any) {
      alert("Error committing dispatch to PostgreSQL: " + err.message);
    } finally {
      setIsDispatching(false);
    }
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
                <h1 className="text-4xl font-serif tracking-tight">Quality Gate Block Active</h1>
                <p className="text-lg font-light text-red-100 max-w-xl">
                  {blockerReason || "This roll did not pass quality inspection and cannot be loaded onto the vehicle."}
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
            <h2 className="text-3xl font-serif text-slate-900 tracking-tight">
              Loading Dock
            </h2>
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
              className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">Official Gate Pass Authorized: {gatePassRecord?.dispatch_reference}</p>
                  <p className="text-xs text-emerald-700">Vehicle: {gatePassRecord?.vehicle_number} · Destination: {gatePassRecord?.destination} · Recorded in PostgreSQL.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dispatch/dispatch-history"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  View in History
                </Link>
                <button
                  onClick={() => setDispatchSuccess(false)}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Scanner Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="text-lg font-serif text-slate-800 mb-6">Scan Roll Barcode</h3>
              
              {/* Scan Tabs */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                    activeTab === 'manual' ? 'bg-white text-indigo-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Keyboard className="w-4 h-4" /> Manual
                </button>
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                    activeTab === 'camera' ? 'bg-white text-indigo-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="w-4 h-4" /> Camera
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                    activeTab === 'upload' ? 'bg-white text-indigo-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> Image
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[160px]">
                {activeTab === 'manual' && (
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
                      Process Package
                    </button>
                  </div>
                )}

                {activeTab === 'camera' && (
                  <div className="space-y-3">
                    {cameraError ? (
                      <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">
                        {cameraError}
                      </div>
                    ) : (
                      <div 
                        id="dispatch-camera-reader" 
                        className="w-full overflow-hidden rounded-xl border border-slate-200 bg-black min-h-[220px]"
                      ></div>
                    )}
                  </div>
                )}

                {activeTab === 'upload' && (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <Upload className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="text-sm text-slate-600 mb-4 text-center">Upload an image of the barcode label</p>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-indigo-600 hover:bg-slate-50 shadow-sm transition"
                    >
                      Select Image
                    </button>
                    <div id="dispatch-camera-reader" className="hidden"></div>
                  </div>
                )}
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
