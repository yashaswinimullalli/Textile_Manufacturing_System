'use client';

import React from 'react';
import ReinspectionQueue from '@/components/quality-inspector/ReinspectionQueue';
import { RefreshCw } from 'lucide-react';

export default function ReinspectionPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <RefreshCw className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl font-medium text-slate-900">Reinspection Queue</h1>
        </div>
        <p className="text-sm text-slate-500">
          Fabric rolls that were sent for rework (washing or repair) and need a second quality check before they can be shipped.
        </p>
      </div>

      <ReinspectionQueue basePath="/quality-inspector" />
    </div>
  );
}
