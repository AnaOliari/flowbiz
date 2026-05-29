'use client';

import type { Opportunity } from './types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface KanbanColumn {
  status: Opportunity['status'];
  label: string;
  headerClass: string;
  borderClass: string;
  badgeClass: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    status: 'OPEN',
    label: 'Em Aberto',
    headerClass: 'bg-blue-50 border-blue-200',
    borderClass: 'border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    status: 'WON',
    label: 'Ganho',
    headerClass: 'bg-green-50 border-green-200',
    borderClass: 'border-green-200',
    badgeClass: 'bg-green-100 text-green-700',
  },
  {
    status: 'LOST',
    label: 'Perdido',
    headerClass: 'bg-red-50 border-red-200',
    borderClass: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
  },
];

interface KanbanBoardProps {
  opportunities: Opportunity[];
}

export default function KanbanBoard({ opportunities }: KanbanBoardProps) {
  const grouped = opportunities.reduce<Record<string, Opportunity[]>>(
    (acc, opportunity) => {
      const key = opportunity.status;
      if (!acc[key]) acc[key] = [];
      acc[key].push(opportunity);
      return acc;
    },
    {},
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((column) => {
        const items = grouped[column.status] ?? [];
        return (
          <div
            key={column.status}
            className={`rounded-xl border ${column.borderClass} flex flex-col`}
          >
            <div className={`rounded-t-xl px-4 py-3 border-b ${column.headerClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{column.label}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${column.badgeClass}`}
                >
                  {items.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 min-h-[120px]">
              {items.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">Nenhuma oportunidade</p>
              ) : (
                items.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {opportunity.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{opportunity.client.name}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-700">
                      {currencyFormatter.format(opportunity.value)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
