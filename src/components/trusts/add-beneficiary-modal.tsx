'use client';

import { useState } from 'react';
import type { Beneficiary, BeneficiaryFormInput } from '@/types';

interface AddBeneficiaryModalProps {
  trustId: string;
  onClose: () => void;
  onAdd: (beneficiary: Beneficiary) => void;
}

export function AddBeneficiaryModal({ trustId, onClose, onAdd }: AddBeneficiaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BeneficiaryFormInput>({
    trust_id: trustId,
    full_name: '',
    email: '',
    is_minor: false,
    share_percentage: 100,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add beneficiary');
        return;
      }

      onAdd(data.data);
    } catch (err) {
      setError('Failed to add beneficiary. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add Beneficiary</h3>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="full_name" className="form-label">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="share_percentage" className="form-label">
                Share Percentage *
              </label>
              <input
                type="number"
                id="share_percentage"
                name="share_percentage"
                required
                min={0}
                max={100}
                step={0.01}
                value={form.share_percentage}
                onChange={handleChange}
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage of each contribution this beneficiary can withdraw
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_minor"
                name="is_minor"
                checked={form.is_minor}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_minor" className="ml-2 text-sm text-gray-700">
                Beneficiary is a minor
              </label>
            </div>

            {form.is_minor && (
              <>
                <div>
                  <label htmlFor="guardian_name" className="form-label">
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    id="guardian_name"
                    name="guardian_name"
                    required={form.is_minor}
                    value={form.guardian_name || ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="guardian_email" className="form-label">
                    Guardian Email *
                  </label>
                  <input
                    type="email"
                    id="guardian_email"
                    name="guardian_email"
                    required={form.is_minor}
                    value={form.guardian_email || ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Notices will be sent to the guardian's email
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Adding...' : 'Add Beneficiary'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
