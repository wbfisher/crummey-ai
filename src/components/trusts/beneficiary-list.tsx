'use client';

import { useState } from 'react';
import type { Beneficiary } from '@/types';
import { AddBeneficiaryModal } from './add-beneficiary-modal';

interface BeneficiaryListProps {
  trustId: string;
  beneficiaries: Beneficiary[];
}

export function BeneficiaryList({ trustId, beneficiaries }: BeneficiaryListProps) {
  const [showModal, setShowModal] = useState(false);
  const [list, setList] = useState(beneficiaries);

  const activeBeneficiaries = list.filter((b) => b.is_active);
  const inactiveBeneficiaries = list.filter((b) => !b.is_active);

  function handleAdd(newBeneficiary: Beneficiary) {
    setList((prev) => [newBeneficiary, ...prev]);
    setShowModal(false);
  }

  return (
    <>
      <div className="card-body">
        {activeBeneficiaries.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {activeBeneficiaries.map((beneficiary) => (
              <li key={beneficiary.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {beneficiary.full_name}
                      {beneficiary.is_minor && (
                        <span className="ml-2 text-xs text-orange-600">(Minor)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{beneficiary.email}</p>
                    {beneficiary.is_minor && beneficiary.guardian_name && (
                      <p className="text-xs text-gray-400">
                        Guardian: {beneficiary.guardian_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {beneficiary.share_percentage}%
                    </span>
                    <p className="text-xs text-gray-500">share</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No beneficiaries yet</p>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="mt-4 w-full btn-secondary text-sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Beneficiary
        </button>

        {inactiveBeneficiaries.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer">
              {inactiveBeneficiaries.length} inactive beneficiar{inactiveBeneficiaries.length === 1 ? 'y' : 'ies'}
            </summary>
            <ul className="mt-2 divide-y divide-gray-100 opacity-60">
              {inactiveBeneficiaries.map((beneficiary) => (
                <li key={beneficiary.id} className="py-2">
                  <p className="text-sm text-gray-500">{beneficiary.full_name}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {showModal && (
        <AddBeneficiaryModal
          trustId={trustId}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}
