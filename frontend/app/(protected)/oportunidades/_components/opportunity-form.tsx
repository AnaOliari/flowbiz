'use client';

import type { Opportunity } from './types';

export interface OpportunityFormData {
  title: string;
  description?: string;
  value: number;
  status: 'OPEN' | 'WON' | 'LOST';
  expectedCloseDate?: string;
  clientId: string;
}

interface OpportunityFormProps {
  initial?: Opportunity | null;
  clients: { id: string; name: string }[];
  loadingClients: boolean;
  loading: boolean;
  onSubmit: (data: OpportunityFormData) => void;
  onCancel: () => void;
}

export default function OpportunityForm({
  initial,
  clients,
  loadingClients,
  loading,
  onSubmit,
  onCancel,
}: OpportunityFormProps) {
  function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rawDate = (fd.get('expectedCloseDate') as string).trim();
    const rawDescription = (fd.get('description') as string).trim();

    onSubmit({
      title: (fd.get('title') as string).trim(),
      description: rawDescription || undefined,
      value: parseFloat(fd.get('value') as string),
      status: fd.get('status') as 'OPEN' | 'WON' | 'LOST',
      expectedCloseDate: rawDate || undefined,
      clientId: fd.get('clientId') as string,
    });
  }

  const initialDate = initial?.expectedCloseDate
    ? initial.expectedCloseDate.slice(0, 10)
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Título da oportunidade"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ''}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          placeholder="Descreva a oportunidade..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor (R$) <span className="text-red-500">*</span>
          </label>
          <input
            name="value"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={initial?.value ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={initial?.status ?? 'OPEN'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="OPEN">Em aberto</option>
            <option value="WON">Ganho</option>
            <option value="LOST">Perdido</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data prevista de fechamento</label>
          <input
            name="expectedCloseDate"
            type="date"
            defaultValue={initialDate}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            name="clientId"
            required
            defaultValue={initial?.clientId ?? ''}
            disabled={loadingClients}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="" disabled>
              {loadingClients ? 'Carregando...' : 'Selecione um cliente'}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || loadingClients}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Salvando...' : initial ? 'Salvar alterações' : 'Criar oportunidade'}
        </button>
      </div>
    </form>
  );
}
