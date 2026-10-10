'use client';

import React from 'react';
import StageInspectionTracker from '@/components/quality-inspector/StageInspectionTracker';

export default function FabricCheckingPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-medium text-slate-800">Stage-by-Stage Inspection</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Select a yarn batch, then inspect each manufacturing stage in sequence.
        </p>
      </div>
      <StageInspectionTracker />
    </div>
  );
}
