'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Trust, ContributionFormInput, RecurringFrequency } from '@/types';

export default function NewContributionPage() {
  const router = useRouter();
  const params = useParams();
  const trustId = params.id as string;

  const [trust, setTrust] = useState<Trust | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingTrust, setFetchingTrust] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ContributionFormInput>({
    trust_id: trustId,
    amount: 0,
    contribution_date: new Date().toISOString().split('T')[0],
    description: '',
    is_recurring: false,
    recurring_frequency: 'none',
    recurring_end_date: '',
  });

  useEffect(() => {
    fetchTrust();
  }, [trustId]);

  async function fetchTrust() {
    try {
      const res = await fetch(`/api/trusts/${trustId}`);
      const data = await res.json();
      if (data.data) {
        setTrust(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch trust:', err);
    } finally {
      setFetchingTrust(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.amount <= 0) {
      setError('Contribution amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount.toString()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to record contribution');
        return;
      }

      // Show success and redirect
      router.push(`/trusts/${trustId}?contribution=created&notices=${data.data.notices?.length || 0}`);
    } catch (err) {
      setError('Failed to record contribution. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const frequencyOptions: { value: RecurringFrequency; label: string }[] = [
    { value: 'none', label: 'One-time contribution' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
  ];

  if (fetchingTrust) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <Link
          href={`/trusts/${trustId}`}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trust
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Record Contribution</h1>
        {trust && (
          <p className="text-sm text-gray-500 mt-1">
            {trust.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contribution Details */}
        <div className="card card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contribution Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="amount" className="form-label">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min={0.01}
                  step={0.01}
                  value={form.amount || ''}
                  onChange={handleChange}
                  className="form-input pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contribution_date" className="form-label">
                Contribution Date *
              </label>
              <input
                type="date"
                id="contribution_date"
                name="contribution_date"
                required
                value={form.contribution_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Annual premium payment, Gift contribution"
              />
            </div>
          </div>
        </div>

        {/* Recurring Schedule */}
        <div className="card card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule</h2>
          <p className="text-sm text-gray-500 mb-4">
            Set up recurring contributions to automatically generate notices on a schedule.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="recurring_frequency" className="form-label">
                Frequency
              </label>
              <select
                id="recurring_frequency"
                name="recurring_frequency"
                value={form.recurring_frequency}
                onChange={(e) => {
                  handleChange(e);
                  setForm((prev) => ({
                    ...prev,
                    is_recurring: e.target.value !== 'none',
                  }));
                }}
                className="form-input"
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {form.recurring_frequency !== 'none' && (
              <div>
                <label htmlFor="recurring_end_date" className="form-label">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  id="recurring_end_date"
                  name="recurring_end_date"
                  value={form.recurring_end_date}
                  onChange={handleChange}
                  min={form.contribution_date}
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for indefinite recurring contributions
                </p>
              </div>
            )}

            {form.recurring_frequency !== 'none' && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900">Schedule Preview</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {form.recurring_frequency === 'monthly' && 'Contributions will be recorded monthly'}
                  {form.recurring_frequency === 'quarterly' && 'Contributions will be recorded every 3 months'}
                  {form.recurring_frequency === 'annually' && 'Contributions will be recorded annually'}
                  {' '}starting {new Date(form.contribution_date).toLocaleDateString()}
                  {form.recurring_end_date && ` until ${new Date(form.recurring_end_date).toLocaleDateString()}`}.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Crummey notices will be automatically generated for each contribution.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notice Preview */}
        <div className="card card-body bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900 mb-2">What happens next</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Crummey notices will be automatically generated for each active beneficiary
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You can review and send notices from the Notices page
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Each beneficiary will receive an email with an acknowledgment link
            </li>
            {trust && (
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdrawal period: {trust.withdrawal_period_days} days from contribution date
              </li>
            )}
          </ul>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href={`/trusts/${trustId}`} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Recording...' : 'Record Contribution'}
          </button>
        </div>
      </form>
    </div>
  );
}
