'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OpportunityTable from './_components/opportunity-table';
import KanbanBoard from './_components/kanban-board';
import OpportunityModal from './_components/opportunity-modal';
import DeleteDialog from '@/components/delete-dialog';
import ToastList from '@/components/toast';
import { useToast } from '@/hooks/use-toast';
import type { OpportunityFormData } from './_components/opportunity-form';
import type { Opportunity } from './_components/types';

type View = 'table' | 'kanban';

export default function OportunidadesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOpportunity, setDeletingOpportunity] = useState<Opportunity | null>(null);

  const [view, setView] = useState<View>('table');

  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/opportunities');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Erro ao buscar oportunidades' }));
        setFetchError(body.message ?? 'Erro ao buscar oportunidades');
        return;
      }
      const data = await res.json();
      setOpportunities(data);
    } catch {
      setFetchError('Não foi possível conectar ao servidor');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  function openCreate() {
    setEditingOpportunity(null);
    setModalOpen(true);
  }

  function openEdit(opportunity: Opportunity) {
    setEditingOpportunity(opportunity);
    setModalOpen(true);
  }

  function openDelete(opportunity: Opportunity) {
    setDeletingOpportunity(opportunity);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(data: OpportunityFormData) {
    setActionLoading(true);
    try {
      if (editingOpportunity) {
        const res = await fetch(`/api/opportunities/${editingOpportunity.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: 'Erro ao atualizar oportunidade' }));
          addToast(body.message ?? 'Erro ao atualizar oportunidade', 'error');
          return;
        }
        const updated: Opportunity = await res.json();
        setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        addToast('Oportunidade atualizada com sucesso', 'success');
        setEditingOpportunity(null);
      } else {
        const res = await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: 'Erro ao criar oportunidade' }));
          addToast(body.message ?? 'Erro ao criar oportunidade', 'error');
          return;
        }
        const created: Opportunity = await res.json();
        setOpportunities((prev) => [...prev, created]);
        addToast('Oportunidade criada com sucesso', 'success');
      }
      setModalOpen(false);
    } catch {
      addToast('Não foi possível conectar ao servidor', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingOpportunity) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${deletingOpportunity.id}`, {
        method: 'DELETE',
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({ message: 'Erro ao excluir oportunidade' }));
        addToast(body.message ?? 'Erro ao excluir oportunidade', 'error');
        return;
      }
      setOpportunities((prev) => prev.filter((o) => o.id !== deletingOpportunity.id));
      addToast('Oportunidade excluída com sucesso', 'success');
      setDeleteDialogOpen(false);
      setDeletingOpportunity(null);
    } catch {
      addToast('Não foi possível conectar ao servidor', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie suas oportunidades de negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === 'table'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Kanban
            </button>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            + Nova oportunidade
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-sm text-gray-400">
          Carregando...
        </div>
      ) : fetchError ? (
        <div className="py-16 text-center text-sm text-red-600 bg-red-50 rounded-xl px-4">
          {fetchError}
        </div>
      ) : view === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <OpportunityTable
            opportunities={opportunities}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </div>
      ) : (
        <KanbanBoard opportunities={opportunities} />
      )}

      <OpportunityModal
        open={modalOpen}
        opportunity={editingOpportunity}
        loading={actionLoading}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        entityName={deletingOpportunity?.title ?? ''}
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingOpportunity(null);
        }}
      />

      <ToastList toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
