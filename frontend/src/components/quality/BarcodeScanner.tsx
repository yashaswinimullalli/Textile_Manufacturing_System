'use client';

import React, { useState } from 'react';
import { Camera, QrCode, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (rollCode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const demoPresets = [
    { code: 'ROLL-008', title: 'ROLL-008', desc: 'Needs re-check (Oil spots)', badge: 'Rework' },
    { code: 'ROLL-009', title: 'ROLL-009', desc: 'New roll (Not checked yet)', badge: 'New' },
    { code: 'ROLL-010', title: 'ROLL-010', desc: 'Torn fabric (Scrapped)', badge: 'Reject' },
    { code: 'ROLL-001', title: 'ROLL-001', desc: 'Clean fabric (Approved)', badge: 'Passed' }
  ];

  const handleSimulateScan = (code: string) => {
    setScannedCode(code);
    setTimeout(() => {
      onScan(code);
    }, 500);
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden relative space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              Roll Barcode & QR Scanner
            </h3>
            <p className="text-xs text-slate-400">Point phone or scanner at label, or click a test roll</p>
          </div>
        </div>
        <button
          onClick={() => setCameraPermissionDenied(!cameraPermissionDenied)}
          className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
        >
          {cameraPermissionDenied ? 'Enable camera' : 'Test camera denied'}
        </button>
      </div>

      {cameraPermissionDenied ? (
        <div className="bg-slate-800/90 border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Camera is Turned Off or Blocked</h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            You can type the roll number manually in the box below instead.
          </p>
        </div>
      ) : (
        <div className="relative aspect-video max-h-64 w-full bg-slate-950 rounded-2xl border-2 border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Scanning Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

          {/* Scanner Viewfinder Box */}
          <div className="relative w-44 h-44 border-2 border-dashed border-teal-400 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-teal-500/20">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-300"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-300"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-300"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-300"></div>

            {/* Laser Line Animation */}
            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_2s_infinite]"></div>

            <QrCode className="w-14 h-14 text-slate-600" />
            <span className="text-[11px] text-teal-300 font-bold mt-2 bg-slate-900/95 px-3 py-1 rounded-full border border-teal-500/40 shadow-sm">
              Hold QR code inside box
            </span>
          </div>

          {/* Scanned Feedback Overlay */}
          {scannedCode && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
              <div className="text-xl font-black text-white font-mono tracking-wider">{scannedCode}</div>
              <div className="text-xs text-emerald-400 font-bold mt-1">Found Roll! Loading fabric details...</div>
            </div>
          )}
        </div>
      )}

      {/* One-Tap Demo Barcode Targets */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            1-Click Sample Scans (Click to simulate a real scan)
          </span>
          <span className="text-[11px] text-slate-400">Instant test</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {demoPresets.map(preset => (
            <button
              key={preset.code}
              type="button"
              onClick={() => handleSimulateScan(preset.code)}
              className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-teal-400 text-left transition cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-white group-hover:text-teal-300 transition-colors">
                  {preset.code}
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  {preset.badge}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-1 font-medium">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
