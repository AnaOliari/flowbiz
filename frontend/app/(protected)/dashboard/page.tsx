import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

interface DashboardMetrics {
  totalClients: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  openValue: number;
  wonValue: number;
  conversionRate: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const CARDS = (m: DashboardMetrics) => [
  { label: 'Total de Clientes', value: m.totalClients },
  { label: 'Total de Oportunidades', value: m.totalOpportunities },
  { label: 'Em Aberto', value: m.openOpportunities, sub: 'status OPEN' },
  { label: 'Ganhas', value: m.wonOpportunities, sub: 'status WON' },
  { label: 'Perdidas', value: m.lostOpportunities, sub: 'status LOST' },
  { label: 'Valor em Aberto', value: formatCurrency(m.openValue), sub: 'soma OPEN' },
  { label: 'Valor Ganho', value: formatCurrency(m.wonValue), sub: 'soma WON' },
  { label: 'Taxa de Conversão', value: `${m.conversionRate}%`, sub: 'WON / Total × 100' },
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value ?? '';

  let metrics: DashboardMetrics | null = null;
  let error = '';

  try {
    metrics = await backendFetch<DashboardMetrics>('/dashboard', token);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Erro ao carregar métricas';
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral do CRM</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-6">{error}</p>
      )}

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS(metrics).map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4"
            >
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
              {card.sub && <p className="mt-1 text-xs text-gray-400">{card.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
