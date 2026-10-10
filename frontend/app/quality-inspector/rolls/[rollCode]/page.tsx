'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { RollDetailResponse, Inspection } from '@/types/factory';
import RollSummary from '@/components/quality-inspector/RollSummary';
import InspectionTimeline from '@/components/quality-inspector/InspectionTimeline';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function QIRollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rollCode = (params.rollCode as string) || '';

  const [data, setData] = useState<RollDetailResponse | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rollCode) loadRoll();
  }, [rollCode]);

  const loadRoll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [rollRes, inspRes] = await Promise.all([
        api.getRoll(rollCode),
        api.getRollInspections(rollCode)
      ]);
      setData(rollRes);
      setInspections(inspRes.inspections || []);
    } catch (err: any) {
      setError(err.message || `Could not find roll ${rollCode}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState message={`Fetching details for ${rollCode}...`} />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push('/quality-inspector')}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
        <ErrorState
          title="Roll Not Found"
          message={error || `Roll "${rollCode}" could not be found. Check the label and try again.`}
          onRetry={loadRoll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs">
        <Link href="/quality-inspector" className="text-slate-500 hover:text-slate-800 font-medium">
          Dashboard
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-mono font-medium text-slate-900">{rollCode}</span>
      </div>

      <RollSummary data={data} onRefresh={loadRoll} basePath="/quality-inspector" />
      <InspectionTimeline inspections={inspections} />
    </div>
  );
}

