'use client';

import { useEffect, useState } from 'react';
import OpportunityForm, { type OpportunityFormData } from './opportunity-form';
import type { Opportunity } from './types';

interface OpportunityModalProps {
  open: boolean;
  opportunity: Opportunity | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: OpportunityFormData) => void;
}

export default function OpportunityModal({
  open,
  opportunity,
  loading,
  onClose,
  onSubmit,
}: OpportunityModalProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    setClientsError(false);
    fetch('/api/clients')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: { id: string; name: string }[]) => setClients(data))
      .catch(() => { setClients([]); setClientsError(true); })
      .finally(() => setLoadingClients(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {opportunity ? 'Editar oportunidade' : 'Nova oportunidade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {clientsError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            Não foi possível carregar os clientes. Feche e tente novamente.
          </p>
        )}
        <OpportunityForm
          initial={opportunity}
          clients={clients}
          loadingClients={loadingClients}
          loading={loading}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
