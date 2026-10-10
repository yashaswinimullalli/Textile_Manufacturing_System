'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  Camera,
  Barcode as BarcodeIcon,
  AlertCircle,
  CheckCircle2,
  Zap,
  Search,
  ArrowRight,
  X,
  RefreshCw,
  ShieldAlert,
  Info
} from 'lucide-react';

interface BarcodeScannerProps {
  onScan?: (rollCode: string) => void;
  redirectOnScan?: boolean;
}

const DEMO_BARCODES = [
  { code: 'ROLL-001', desc: 'Cotton Twill (Pass)', badge: 'PASS', color: 'emerald' },
  { code: 'ROLL-008', desc: 'Poly-Cotton (Rework, oil stain)', badge: 'REWORK', color: 'amber' },
  { code: 'ROLL-009', desc: 'Denim Slub (Needs check)', badge: 'NEW', color: 'blue' },
  { code: 'ROLL-010', desc: 'Linen Mix (Rejected, tear)', badge: 'REJECT', color: 'rose' },
  { code: 'ROLL-003', desc: 'Cotton Jersey (Pass)', badge: 'PASS', color: 'emerald' },
  { code: 'ROLL-007', desc: 'Silk Blend (Needs check)', badge: 'NEW', color: 'blue' },
];

export default function BarcodeScanner({ onScan, redirectOnScan = true }: BarcodeScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera video capture is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied by user. Please grant camera permission or use manual entry.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Use manual roll entry or test tags below.');
      } else {
        setCameraError(err.message || 'Could not start camera feed.');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleRollResolved = useCallback(async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    // Prevent duplicate submissions caused by repeated rapid scan events (1500ms debounce)
    const now = Date.now();
    if (now - lastScanTime < 1500) {
      return;
    }
    setLastScanTime(now);

    setScannedCode(code);
    setSearchError(null);
    setIsSearching(true);

    try {
      await api.getRoll(code);
      if (onScan) {
        onScan(code);
      }
      if (redirectOnScan) {
        setTimeout(() => {
          router.push(`/quality-inspector/rolls/${encodeURIComponent(code)}`);
        }, 500);
      }
    } catch (err: any) {
      setScannedCode(null);
      setIsSearching(false);
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
        setSearchError(`Roll "${code}" was not found in the factory database. Verify the label ID and retry.`);
      } else {
        setSearchError(err.message || 'Failed to retrieve roll details. Please check connection.');
      }
    }
  }, [router, onScan, redirectOnScan, lastScanTime]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleRollResolved(manualCode);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1D Linear Barcode Scanner Viewfinder */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Scanner Bar Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white">1D Linear Barcode Scanner</span>
              <span className="block text-[10px] text-slate-400">Code 128 / Code 39 Roll Identification Tags</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                <span>Turn Off Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Camera Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-90' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Success Overlay */}
          {scannedCode ? (
            <div className="relative z-20 flex flex-col items-center space-y-3 bg-slate-900/90 p-6 rounded-2xl border border-emerald-500/50 shadow-2xl animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              <div className="text-2xl font-black text-white font-mono tracking-widest">{scannedCode}</div>
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Valid barcode read! Opening roll inspection passport...
              </div>
            </div>
          ) : cameraError ? (
            <div className="relative z-20 max-w-md mx-auto text-center space-y-3 p-6 bg-slate-900/95 rounded-2xl border border-amber-500/40">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Camera Permission Notice</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => setCameraError(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center space-y-4">
              {/* 1D Linear Barcode Guide Window */}
              <div className="relative w-72 h-32 border-2 border-dashed border-blue-400/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-blue-400" />

                {/* Laser scan line */}
                <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-bounce" />

                <BarcodeIcon className="w-20 h-20 text-slate-600" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase">
                  |||||| | |||| ||| |||||||
                </span>
              </div>

              <span className="text-xs text-blue-300 font-bold bg-slate-900/90 px-4 py-1.5 rounded-full border border-blue-500/30 shadow-sm">
                Align 1D fabric roll barcode horizontally across red laser
              </span>
            </div>
          )}
        </div>

        {/* Security & Authorization Footnote */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Possession of a roll barcode does not constitute dispatch authorization. All decisions are verified on-server.</span>
          </div>
          <button
            type="button"
            onClick={() => setCameraError('Camera permission was denied by device policy.')}
            className="text-slate-500 hover:text-slate-300 underline text-[10px]"
          >
            Test Denied State
          </button>
        </div>
      </div>

      {/* Search Error State */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start space-x-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Roll Lookup Notice</strong>
            <span>{searchError}</span>
          </div>
          <button onClick={() => setSearchError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Roll ID Entry Fallback */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Manual Roll-ID Fallback Entry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            If a label is torn, oil-stained, or unreadable by camera, type the printed Roll Code:
          </p>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. ROLL-001, ROLL-008, ROLL-009"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase"
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isSearching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-2 shrink-0 shadow-md shadow-blue-600/20"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <span>Look Up Roll</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* 1-Tap Sample Floor Barcode Tags */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Active Floor Barcode Tags (1-Tap Simulation)
          </span>
          <span className="text-[11px] text-slate-400">Click to test scanner</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DEMO_BARCODES.map(preset => (
            <button
              key={preset.code}
              type="button"
              onClick={() => handleRollResolved(preset.code)}
              disabled={isSearching}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition group shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-black text-slate-900 group-hover:text-blue-700">
                  {preset.code}
                </span>
                <span className="text-[10px] font-bold">
                  {preset.badge}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-1">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
