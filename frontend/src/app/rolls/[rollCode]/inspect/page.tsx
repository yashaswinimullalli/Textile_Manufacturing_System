import { redirect } from 'next/navigation';

export default async function RollInspectRedirect({
  params,
}: {
  params: Promise<{ rollCode: string }>;
}) {
  const { rollCode } = await params;
  redirect(`/quality-inspector/rolls/${encodeURIComponent(rollCode)}/inspect`);
}
