import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BeneficiaryList } from '@/components/trusts/beneficiary-list';
import { ContributionList } from '@/components/trusts/contribution-list';

interface TrustDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrustDetailPage({ params }: TrustDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch trust with beneficiaries
  const { data: trust, error } = await supabase
    .from('trusts')
    .select(`
      *,
      beneficiaries:beneficiaries(*),
      contributions:contributions(
        *,
        notices:notices(count)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !trust) {
    notFound();
  }

  // Sort beneficiaries and contributions
  const beneficiaries = (trust.beneficiaries || []).sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const contributions = (trust.contributions || []).sort((a: any, b: any) =>
    new Date(b.contribution_date).getTime() - new Date(a.contribution_date).getTime()
  );

  // Calculate stats
  const activeBeneficiaries = beneficiaries.filter((b: any) => b.is_active).length;
  const totalContributions = contributions.reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/trusts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trusts
        </Link>
      </div>

      {/* Trust header */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{trust.name}</h1>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {trust.trust_type}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Established {new Date(trust.trust_date).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link href={`/trusts/${id}/contributions/new`} className="btn-primary text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contribution
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Active Beneficiaries</p>
            <p className="text-xl font-semibold text-gray-900">{activeBeneficiaries}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Contributions</p>
            <p className="text-xl font-semibold text-gray-900">{contributions.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-xl font-semibold text-gray-900">
              ${totalContributions.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Withdrawal Period</p>
            <p className="text-xl font-semibold text-gray-900">{trust.withdrawal_period_days} days</p>
          </div>
        </div>

        {/* Trustee info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Trustee</h3>
          <div className="mt-2 text-sm text-gray-600">
            <p>{trust.trustee_name}</p>
            <p>{trust.trustee_email}</p>
            {trust.trustee_phone && <p>{trust.trustee_phone}</p>}
            {trust.trustee_address && (
              <p>
                {trust.trustee_address}
                {trust.trustee_city && `, ${trust.trustee_city}`}
                {trust.trustee_state && ` ${trust.trustee_state}`}
                {trust.trustee_zip && ` ${trust.trustee_zip}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Beneficiaries and Contributions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Beneficiaries */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Beneficiaries</h2>
            <Link
              href={`/trusts/${id}/beneficiaries`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Manage
            </Link>
          </div>
          <BeneficiaryList trustId={id} beneficiaries={beneficiaries} />
        </div>

        {/* Contributions */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Contributions</h2>
            <Link
              href={`/trusts/${id}/contributions/new`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Add New
            </Link>
          </div>
          <ContributionList trustId={id} contributions={contributions} />
        </div>
      </div>
    </div>
  );
}
