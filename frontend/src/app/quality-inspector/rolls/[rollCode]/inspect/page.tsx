'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { RollDetailResponse } from '@/types/factory';
import InspectionForm from '@/components/quality-inspector/InspectionForm';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { ArrowLeft } from 'lucide-react';

export default function QIInspectPage() {
  const params = useParams();
  const router = useRouter();
  const rollCode = (params.rollCode as string) || '';

  const [data, setData] = useState<RollDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rollCode) loadRoll();
  }, [rollCode]);

  const loadRoll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getRoll(rollCode);
      setData(res);
    } catch (err: any) {
      setError(err.message || `Roll ${rollCode} not found.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState message={`Preparing inspection form for ${rollCode}...`} />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push(`/quality-inspector/rolls/${rollCode}`)}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roll Details</span>
        </button>
        <ErrorState
          title="Cannot Open Inspection Form"
          message={error || `Roll ${rollCode} could not be loaded.`}
          onRetry={loadRoll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs">
        <Link href="/quality-inspector" className="text-slate-500 hover:text-slate-800 font-medium">Dashboard</Link>
        <span className="text-slate-300">/</span>
        <Link href={`/quality-inspector/rolls/${rollCode}`} className="text-slate-500 hover:text-slate-800 font-medium font-mono">{rollCode}</Link>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-slate-900">Inspect</span>
      </div>

      <InspectionForm
        roll={data.roll}
        priorInspectionId={data.latest_inspection?.id}
        onSuccess={loadRoll}
        successRedirectPath={`/quality-inspector/rolls/${rollCode}`}
        backPath={`/quality-inspector/rolls/${rollCode}`}
      />
    </div>
  );
}

