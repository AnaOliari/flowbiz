'use client';

import type { Opportunity } from './types';

const STATUS_LABEL: Record<Opportunity['status'], string> = {
  OPEN: 'Em aberto',
  WON: 'Ganho',
  LOST: 'Perdido',
};

const STATUS_CLASS: Record<Opportunity['status'], string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
}

export default function OpportunityTable({ opportunities, onEdit, onDelete }: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Nenhuma oportunidade cadastrada.</p>
        <p className="text-xs text-gray-400 mt-1">Clique em &quot;Nova oportunidade&quot; para começar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left font-medium text-gray-500 px-4 py-3">Título</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Cliente</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Valor</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Data Prevista</th>
            <th className="text-right font-medium text-gray-500 px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => (
            <tr
              key={opportunity.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900">{opportunity.title}</td>
              <td className="px-4 py-3 text-gray-500">{opportunity.client.name}</td>
              <td className="px-4 py-3 text-gray-700 font-medium">
                {currencyFormatter.format(opportunity.value)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[opportunity.status]}`}
                >
                  {STATUS_LABEL[opportunity.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {opportunity.expectedCloseDate
                  ? dateFormatter.format(new Date(opportunity.expectedCloseDate))
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(opportunity)}
                  className="text-blue-600 hover:text-blue-800 font-medium mr-4 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(opportunity)}
                  className="text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
