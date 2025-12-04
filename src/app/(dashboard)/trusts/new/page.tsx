'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TrustFormInput } from '@/types';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function NewTrustPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<TrustFormInput>({
    name: '',
    trust_date: '',
    trust_type: 'ILIT',
    trustee_name: '',
    trustee_address: '',
    trustee_city: '',
    trustee_state: '',
    trustee_zip: '',
    trustee_phone: '',
    trustee_email: '',
    withdrawal_period_days: 30,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/trusts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create trust');
        return;
      }

      router.push(`/trusts/${data.data.id}`);
    } catch (err) {
      setError('Failed to create trust. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <Link href="/trusts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trusts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Create New Trust</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up an irrevocable trust for Crummey notice management
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trust Details */}
        <div className="card card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Trust Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="form-label">
                Trust Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Smith Family Irrevocable Trust"
              />
            </div>

            <div>
              <label htmlFor="trust_date" className="form-label">
                Date Established *
              </label>
              <input
                type="date"
                id="trust_date"
                name="trust_date"
                required
                value={form.trust_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="trust_type" className="form-label">
                Trust Type *
              </label>
              <select
                id="trust_type"
                name="trust_type"
                required
                value={form.trust_type}
                onChange={handleChange}
                className="form-input"
              >
                <option value="ILIT">ILIT (Irrevocable Life Insurance Trust)</option>
                <option value="Gift Trust">Gift Trust</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="withdrawal_period_days" className="form-label">
                Withdrawal Period (days) *
              </label>
              <select
                id="withdrawal_period_days"
                name="withdrawal_period_days"
                required
                value={form.withdrawal_period_days}
                onChange={handleChange}
                className="form-input"
              >
                <option value={30}>30 days</option>
                <option value={45}>45 days</option>
                <option value={60}>60 days</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Period beneficiaries have to exercise withdrawal rights
              </p>
            </div>
          </div>
        </div>

        {/* Trustee Information */}
        <div className="card card-body">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Trustee Information</h2>
          <p className="text-sm text-gray-500 mb-4">
            The trustee is responsible for sending Crummey notices
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="trustee_name" className="form-label">
                Trustee Name *
              </label>
              <input
                type="text"
                id="trustee_name"
                name="trustee_name"
                required
                value={form.trustee_name}
                onChange={handleChange}
                className="form-input"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label htmlFor="trustee_email" className="form-label">
                Trustee Email *
              </label>
              <input
                type="email"
                id="trustee_email"
                name="trustee_email"
                required
                value={form.trustee_email}
                onChange={handleChange}
                className="form-input"
                placeholder="trustee@example.com"
              />
            </div>

            <div>
              <label htmlFor="trustee_phone" className="form-label">
                Trustee Phone
              </label>
              <input
                type="tel"
                id="trustee_phone"
                name="trustee_phone"
                value={form.trustee_phone}
                onChange={handleChange}
                className="form-input"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="trustee_address" className="form-label">
                Street Address
              </label>
              <input
                type="text"
                id="trustee_address"
                name="trustee_address"
                value={form.trustee_address}
                onChange={handleChange}
                className="form-input"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label htmlFor="trustee_city" className="form-label">
                City
              </label>
              <input
                type="text"
                id="trustee_city"
                name="trustee_city"
                value={form.trustee_city}
                onChange={handleChange}
                className="form-input"
                placeholder="New York"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trustee_state" className="form-label">
                  State
                </label>
                <select
                  id="trustee_state"
                  name="trustee_state"
                  value={form.trustee_state}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="trustee_zip" className="form-label">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="trustee_zip"
                  name="trustee_zip"
                  value={form.trustee_zip}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="10001"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/trusts" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Trust'}
          </button>
        </div>
      </form>
    </div>
  );
}
