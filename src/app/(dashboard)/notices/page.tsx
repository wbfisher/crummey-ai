'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Notice, NoticeStatus } from '@/types';

interface NoticeWithRelations extends Notice {
  trust: { id: string; name: string };
  beneficiary: { id: string; full_name: string };
  contribution: { id: string; amount: number; contribution_date: string };
}

export default function NoticesPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') as NoticeStatus | null;

  const [notices, setNotices] = useState<NoticeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [selectedNotices, setSelectedNotices] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, [statusFilter]);

  async function fetchNotices() {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/notices?status=${statusFilter}`
        : '/api/notices';
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setNotices(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendNotice(noticeId: string) {
    setSending(noticeId);
    try {
      const res = await fetch('/api/notices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_ids: [noticeId] }),
      });

      if (res.ok) {
        // Update local state
        setNotices((prev) =>
          prev.map((n) =>
            n.id === noticeId
              ? { ...n, status: 'sent', sent_at: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Failed to send notice:', err);
    } finally {
      setSending(null);
    }
  }

  async function sendSelected() {
    if (selectedNotices.size === 0) return;

    setBulkSending(true);
    try {
      const res = await fetch('/api/notices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice_ids: Array.from(selectedNotices) }),
      });

      if (res.ok) {
        const result = await res.json();
        // Refresh notices
        await fetchNotices();
        setSelectedNotices(new Set());
        alert(`Sent ${result.data.sent} notices. ${result.data.failed} failed.`);
      }
    } catch (err) {
      console.error('Failed to send notices:', err);
    } finally {
      setBulkSending(false);
    }
  }

  function toggleSelect(noticeId: string) {
    setSelectedNotices((prev) => {
      const next = new Set(prev);
      if (next.has(noticeId)) {
        next.delete(noticeId);
      } else {
        next.add(noticeId);
      }
      return next;
    });
  }

  function selectAllPending() {
    const pendingIds = notices
      .filter((n) => n.status === 'pending')
      .map((n) => n.id);
    setSelectedNotices(new Set(pendingIds));
  }

  const statusCounts = notices.reduce(
    (acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pendingCount = statusCounts['pending'] || 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and send Crummey notices to beneficiaries
          </p>
        </div>
        {pendingCount > 0 && selectedNotices.size > 0 && (
          <button
            onClick={sendSelected}
            disabled={bulkSending}
            className="btn-primary"
          >
            {bulkSending ? 'Sending...' : `Send ${selectedNotices.size} Selected`}
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/notices"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !statusFilter
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({notices.length})
        </Link>
        {['pending', 'sent', 'acknowledged', 'bounced'].map((status) => (
          <Link
            key={status}
            href={`/notices?status=${status}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status] || 0})
          </Link>
        ))}
      </div>

      {/* Bulk actions for pending */}
      {pendingCount > 0 && !statusFilter && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-800">
              You have <strong>{pendingCount}</strong> pending notice{pendingCount !== 1 ? 's' : ''} ready to send.
            </span>
          </div>
          <button onClick={selectAllPending} className="text-sm text-yellow-700 hover:text-yellow-900 font-medium">
            Select All Pending
          </button>
        </div>
      )}

      {/* Notices list */}
      {loading ? (
        <div className="card card-body">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : notices.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Beneficiary
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trust
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Deadline
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {notice.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedNotices.has(notice.id)}
                        onChange={() => toggleSelect(notice.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {notice.recipient_name}
                    </p>
                    <p className="text-xs text-gray-500">{notice.recipient_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/trusts/${notice.trust?.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {notice.trust?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${parseFloat(notice.withdrawal_amount.toString()).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">
                      {new Date(notice.withdrawal_deadline).toLocaleDateString()}
                    </p>
                    {new Date(notice.withdrawal_deadline) < new Date() && notice.status !== 'acknowledged' && (
                      <span className="text-xs text-red-600">Expired</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${notice.status}`}>
                      {notice.status}
                    </span>
                    {notice.acknowledged_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notice.acknowledged_at).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {notice.status === 'pending' && (
                      <button
                        onClick={() => sendNotice(notice.id)}
                        disabled={sending === notice.id}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                      >
                        {sending === notice.id ? 'Sending...' : 'Send'}
                      </button>
                    )}
                    {notice.pdf_url && (
                      <a
                        href={notice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-sm text-gray-600 hover:text-gray-700"
                      >
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card card-body text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notices found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {statusFilter
              ? `No ${statusFilter} notices.`
              : 'Record a contribution to generate Crummey notices.'}
          </p>
          {!statusFilter && (
            <Link href="/trusts" className="btn-primary mt-4">
              View Trusts
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
