import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { TrustWithCounts } from '@/types';

export default async function TrustsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: trusts, error } = await supabase
    .from('trusts')
    .select(`
      *,
      beneficiaries:beneficiaries(count),
      contributions:contributions(count)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trusts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your irrevocable trusts and beneficiaries
          </p>
        </div>
        <Link href="/trusts/new" className="btn-primary">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Trust
        </Link>
      </div>

      {/* Trust list */}
      {error ? (
        <div className="card card-body">
          <p className="text-red-600">Error loading trusts: {error.message}</p>
        </div>
      ) : trusts && trusts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trusts.map((trust: TrustWithCounts) => (
            <Link
              key={trust.id}
              href={`/trusts/${trust.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{trust.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Est. {new Date(trust.trust_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {trust.trust_type}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Beneficiaries:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {trust.beneficiaries?.[0]?.count || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Contributions:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {trust.contributions?.[0]?.count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-500">
                  <p>Trustee: {trust.trustee_name}</p>
                  <p className="text-xs">{trust.withdrawal_period_days}-day withdrawal period</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card card-body text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No trusts yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first irrevocable trust.
          </p>
          <Link href="/trusts/new" className="btn-primary mt-4">
            Create Trust
          </Link>
        </div>
      )}
    </div>
  );
}
