// Formatting helpers for date, numbers, currencies, and human-friendly plain language

export function formatDate(isoString?: string | null): string {
  if (!isoString) return 'Not recorded';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  } catch {
    return '';
  }
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatQuantity(qty: number, unit = 'm'): string {
  return `${Number(qty).toLocaleString()} ${unit}`;
}

export function getFriendlyStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PASSED':
      return 'Approved • Good to Ship';
    case 'REWORK_REQUIRED':
      return 'On Hold • Needs Wash / Repair';
    case 'REJECTED':
      return 'Scrapped • Permanent Reject';
    case 'NEEDS_INSPECTION':
      return 'Awaiting Initial Quality Check';
    case 'DISPATCHED':
      return 'Shipped to Customer';
    default:
      return status?.replace(/_/g, ' ') || 'Unknown';
  }
}

export function getFriendlyFlawName(flaw: string): string {
  switch (flaw?.toLowerCase()) {
    case 'none':
      return 'Clean Fabric (No Defects)';
    case 'hole/tear':
      return 'Hole or Tear in Fabric';
    case 'stain/oil':
      return 'Machine Oil / Grease Stain';
    case 'shade or colour variation':
      return 'Uneven Dye / Color Mismatch';
    case 'weaving/knitting defect':
      return 'Broken Thread / Misweave';
    case 'width/measurement issue':
      return 'Incorrect Fabric Width';
    case 'contamination':
      return 'Foreign Dirt or Plastic';
    case 'other':
      return 'Other Documented Flaw';
    default:
      return flaw || 'No defect';
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PASSED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20';
    case 'REWORK_REQUIRED':
      return 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-500/20';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-900 border-rose-300 ring-2 ring-rose-500/20';
    case 'NEEDS_INSPECTION':
      return 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20';
    case 'DISPATCHED':
      return 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-500/20';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

export function getDecisionBadgeClass(decision: string): string {
  switch (decision?.toUpperCase()) {
    case 'PASS':
      return 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30';
    case 'REWORK':
      return 'bg-amber-600 text-white shadow-md shadow-amber-600/30';
    case 'REJECT':
      return 'bg-rose-600 text-white shadow-md shadow-rose-600/30';
    default:
      return 'bg-slate-600 text-white';
  }
}
