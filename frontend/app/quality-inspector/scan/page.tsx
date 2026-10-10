'use client';

import React from 'react';
import BarcodeScanner from '@/components/quality-inspector/BarcodeScanner';
import { Barcode, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb / Navigation */}
      <div className="flex items-center space-x-2 text-xs">
        <Link href="/quality-inspector" className="text-slate-500 hover:text-slate-800 font-medium">
          Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-800">Scan Barcode</span>
      </div>

      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <Barcode className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-serif tracking-tight text-slate-900">Scan Roll Barcode</h1>
        </div>
        <p className="text-sm text-slate-500">
          Point your industrial barcode scanner or camera at the roll label, or use manual entry below.
        </p>
      </div>

      {/* Barcode Scanner Component */}
      <BarcodeScanner redirectOnScan={true} />
    </div>
  );
}
