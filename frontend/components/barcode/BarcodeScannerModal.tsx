'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Camera,
  Keyboard,
  Search,
  X,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '@/lib/api';
import { YarnBatch } from '@/lib/types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchFound: (batch: YarnBatch) => void;
  onRegisterNew: (scannedCode?: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBatchFound,
  onRegisterNew,
}) => {
  const [activeTab, setActiveTab] = useState<'usb' | 'camera' | 'manual'>('usb');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera Scanner State
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const usbInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus USB input whenever modal opens or tab switches to USB
  useEffect(() => {
    if (isOpen && activeTab === 'usb') {
      setTimeout(() => {
        usbInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Handle Camera scanning initialization and cleanup
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCameraScanning();
    } else {
      stopCameraScanning();
    }

    return () => {
      stopCameraScanning();
    };
  }, [isOpen, activeTab]);

  const startCameraScanning = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('camera-reader-box');
      html5QrCodeRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No camera found on this device. Please use USB scanner or manual entry.');
        return;
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
        },
        (decodedText) => {
          stopCameraScanning();
          handleLookup(decodedText);
        },
        () => {
          // Frame scan callback (ignore empty frames)
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera scanning error', err);
      setCameraError(
        err.message || 'Camera access was blocked or is unavailable. Please use manual entry or a USB scanner.'
      );
      setCameraActive(false);
    }
  };

  const stopCameraScanning = () => {
    if (html5QrCodeRef.current && cameraActive) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current?.clear();
          setCameraActive(false);
        })
        .catch(() => {});
    }
  };

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) {
      setErrorMessage('Please scan or enter a barcode value.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const batch = await api.getBatchByBarcode(code);
      onBatchFound(batch);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || `No batch found for barcode "${code}".`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Scan Yarn Batch Barcode</h3>
              <p className="text-xs text-slate-500">USB Handheld • Camera • Manual Lookup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scan Mode Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'usb' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>USB Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'camera' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Camera Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Tab 1: USB Barcode Scanner (Recommended for Warehouse Floor) */}
        {activeTab === 'usb' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Ready for USB Scanner Input</p>
              <p className="text-[11px] text-slate-500">
                Point your handheld physical scanner at the yarn package label. Hardware barcode scanners automatically type the code and press Enter.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  ref={usbInputRef}
                  type="text"
                  placeholder="Focus is active — scan barcode now..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full px-4 py-3 text-base font-mono border-2 border-teal-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-100 bg-teal-50/20"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Press Enter or click Lookup</span>
                <button
                  type="submit"
                  disabled={loading || !barcodeInput.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{loading ? 'Verifying...' : 'Lookup Batch'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-3 text-center">
            {cameraError ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs text-left space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span>Camera Unavailable</span>
                </div>
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
                >
                  Switch to Manual Entry
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Position the Code 128 barcode within the viewfinder box:
                </p>
                <div
                  id="camera-reader-box"
                  className="w-full h-56 bg-black rounded-lg overflow-hidden border border-slate-300"
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manual Entry & Quick Samples */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Barcode or Batch Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. FTB-202610-001 or YB-COT-2026-001"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !barcodeInput.trim()}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
              >
                <Search className="h-3.5 w-3.5" />
                <span>{loading ? 'Searching...' : 'Find Yarn Batch'}</span>
              </button>
            </form>

            {/* Quick Demo Test Badges */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Demo Barcodes (Click to load):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['FTB-202610-001', 'FTB-202610-014', 'FTB-202610-008', 'FTB-202610-004'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setBarcodeInput(code);
                      handleLookup(code);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded text-[11px] font-mono text-slate-700 transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Unknown Barcode Error Banner with "Register New Batch" option */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Unrecognized Barcode</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegisterNew(barcodeInput);
                }}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Register as New Batch</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
