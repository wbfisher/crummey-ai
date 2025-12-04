import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch dashboard stats
  const [
    { count: trustCount },
    { count: beneficiaryCount },
    { data: pendingNotices },
    { data: recentNotices },
    { data: upcomingDeadlines },
  ] = await Promise.all([
    supabase.from('trusts').select('*', { count: 'exact', head: true }),
    supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('notices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('notices').select(`
      *,
      trust:trusts(name),
      beneficiary:beneficiaries(full_name)
    `).order('created_at', { ascending: false }).limit(5),
    supabase.from('notices').select(`
      *,
      trust:trusts(name),
      beneficiary:beneficiaries(full_name)
    `)
      .eq('status', 'sent')
      .gte('withdrawal_deadline', new Date().toISOString().split('T')[0])
      .lte('withdrawal_deadline', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('withdrawal_deadline', { ascending: true })
      .limit(5),
  ]);

  const stats = [
    { name: 'Active Trusts', value: trustCount || 0, href: '/trusts' },
    { name: 'Beneficiaries', value: beneficiaryCount || 0, href: '/trusts' },
    { name: 'Pending Notices', value: pendingNotices?.length || 0, href: '/notices?status=pending' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your trusts and notice activity
          </p>
        </div>
        <Link href="/trusts/new" className="btn-primary">
          Create Trust
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="card card-body hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h2>
            <span className="text-xs text-gray-500">Next 14 days</span>
          </div>
          <div className="card-body">
            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {upcomingDeadlines.map((notice: any) => (
                  <li key={notice.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notice.beneficiary?.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notice.trust?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {new Date(notice.withdrawal_deadline).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${parseFloat(notice.withdrawal_amount).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming deadlines
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Notices</h2>
            <Link href="/notices" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="card-body">
            {recentNotices && recentNotices.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentNotices.map((notice: any) => (
                  <li key={notice.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notice.beneficiary?.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notice.trust?.name} - ${parseFloat(notice.withdrawal_amount).toLocaleString()}
                      </p>
                    </div>
                    <span className={`badge badge-${notice.status}`}>
                      {notice.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No notices yet</p>
                <Link href="/trusts/new" className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                  Create your first trust to get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(trustCount || 0) > 0 && (
        <div className="card card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/trusts"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Record Contribution</p>
                <p className="text-xs text-gray-500">Add a new gift to a trust</p>
              </div>
            </Link>
            <Link
              href="/notices?status=pending"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Send Notices</p>
                <p className="text-xs text-gray-500">Send pending Crummey notices</p>
              </div>
            </Link>
            <Link
              href="/reports"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Generate Report</p>
                <p className="text-xs text-gray-500">Export for tax records</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
