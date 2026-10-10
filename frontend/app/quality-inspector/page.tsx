'use client';

import React from 'react';
import StageInspectionTracker from '@/components/quality-inspector/StageInspectionTracker';

export default function FabricCheckingPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-slate-800 tracking-tight">Stage-by-Stage Inspection</h2>
        <p className="text-sm text-slate-500 mt-1 font-sans">
          Select a yarn batch, then inspect each manufacturing stage in sequence.
        </p>
      </div>
      <StageInspectionTracker />
    </div>
  );
}
