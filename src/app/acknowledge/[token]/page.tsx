'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface NoticeDetails {
  id: string;
  trust_name: string;
  recipient_name: string;
  notice_date: string;
  withdrawal_amount: number;
  withdrawal_deadline: string;
  status: string;
  acknowledged_at: string | null;
}

export default function AcknowledgePage() {
  const params = useParams();
  const token = params.token as string;

  const [notice, setNotice] = useState<NoticeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchNotice();
  }, [token]);

  async function fetchNotice() {
    try {
      const res = await fetch(`/api/acknowledge/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Notice not found');
      } else {
        setNotice(data.data);
      }
    } catch (err) {
      setError('Failed to load notice');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(e: React.FormEvent) {
    e.preventDefault();

    if (!signatureName.trim()) {
      setError('Please enter your name to acknowledge');
      return;
    }

    setAcknowledging(true);
    setError(null);

    try {
      const res = await fetch(`/api/acknowledge/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_name: signatureName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to acknowledge');
      } else {
        setSuccess(true);
        setNotice(data.data);
      }
    } catch (err) {
      setError('Failed to submit acknowledgment');
    } finally {
      setAcknowledging(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !notice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!notice) return null;

  const isAlreadyAcknowledged = notice.status === 'acknowledged' || !!notice.acknowledged_at;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4">
            <h1 className="text-xl font-semibold">Crummey Notice Acknowledgment</h1>
            <p className="text-blue-100 text-sm mt-1">{notice.trust_name}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {success || isAlreadyAcknowledged ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Acknowledgment Received
                </h2>
                <p className="text-gray-600 mb-4">
                  Thank you for acknowledging receipt of this notice. A record has been saved.
                </p>
                {notice.acknowledged_at && (
                  <p className="text-sm text-gray-500">
                    Acknowledged on: {new Date(notice.acknowledged_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Notice Details */}
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Notice Details</h2>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Beneficiary</dt>
                      <dd className="font-medium text-gray-900">{notice.recipient_name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Notice Date</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(notice.notice_date).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Withdrawal Amount</dt>
                      <dd className="font-medium text-gray-900">
                        ${notice.withdrawal_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Withdrawal Deadline</dt>
                      <dd className="font-medium text-red-600">
                        {new Date(notice.withdrawal_deadline).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Acknowledgment Statement */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    By acknowledging below, I confirm that I have received notice of my right to withdraw
                    the above amount from the trust. This acknowledgment is for record-keeping purposes
                    only and does not affect my right to exercise or waive my withdrawal rights.
                  </p>
                </div>

                {/* Acknowledgment Form */}
                <form onSubmit={handleAcknowledge}>
                  <div className="mb-4">
                    <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-1">
                      Type your full name to acknowledge
                    </label>
                    <input
                      type="text"
                      id="signature"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  {error && (
                    <div className="mb-4 text-sm text-red-600">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={acknowledging}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {acknowledging ? 'Submitting...' : 'Acknowledge Receipt'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-xs text-gray-500">
            <p>
              This acknowledgment system is provided for your convenience. If you have questions
              about exercising your withdrawal rights, please contact the trustee directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
