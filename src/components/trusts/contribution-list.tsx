'use client';

import Link from 'next/link';
import type { Contribution } from '@/types';

interface ContributionListProps {
  trustId: string;
  contributions: (Contribution & { notices: { count: number }[] })[];
}

export function ContributionList({ trustId, contributions }: ContributionListProps) {
  return (
    <div className="card-body">
      {contributions.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {contributions.slice(0, 10).map((contribution) => (
            <li key={contribution.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ${parseFloat(contribution.amount.toString()).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(contribution.contribution_date).toLocaleDateString()}
                    {contribution.description && ` - ${contribution.description}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {contribution.is_recurring && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                      {contribution.recurring_frequency}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {contribution.notices?.[0]?.count || 0} notices
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No contributions yet</p>
        </div>
      )}

      <Link
        href={`/trusts/${trustId}/contributions/new`}
        className="mt-4 w-full btn-secondary text-sm inline-flex items-center justify-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Record Contribution
      </Link>

      {contributions.length > 10 && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Showing 10 of {contributions.length} contributions
        </p>
      )}
    </div>
  );
}
