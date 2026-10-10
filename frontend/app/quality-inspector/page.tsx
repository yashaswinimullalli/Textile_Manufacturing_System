'use client';

import React from 'react';
import StageInspectionTracker from '@/components/quality-inspector/StageInspectionTracker';

export default function FabricCheckingPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-slate-800 tracking-tight">Stage-by-Stage Inspection</h2>
      </div>
      <StageInspectionTracker />
    </div>
  );
}
