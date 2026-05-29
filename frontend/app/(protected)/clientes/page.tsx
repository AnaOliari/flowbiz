'use client';

import { useState, useEffect, useCallback } from 'react';
import ClientTable from './_components/client-table';
import ClientModal from './_components/client-modal';
import DeleteDialog from './_components/delete-dialog';
import ToastList from '@/components/toast';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Erro ao buscar clientes' }));
        setFetchError(body.message ?? 'Erro ao buscar clientes');
        return;
      }
      const data = await res.json();
      setClients(data);
    } catch {
      setFetchError('Não foi possível conectar ao servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function openCreate() {
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setModalOpen(true);
  }

  function openDelete(client: Client) {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(data: Omit<Client, 'id'>) {
    setActionLoading(true);
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: 'Erro ao atualizar cliente' }));
          addToast(body.message ?? 'Erro ao atualizar cliente', 'error');
          return;
        }
        const updated: Client = await res.json();
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        addToast('Cliente atualizado com sucesso', 'success');
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: 'Erro ao criar cliente' }));
          addToast(body.message ?? 'Erro ao criar cliente', 'error');
          return;
        }
        const created: Client = await res.json();
        setClients((prev) => [...prev, created]);
        addToast('Cliente criado com sucesso', 'success');
      }
      setModalOpen(false);
    } catch {
      addToast('Não foi possível conectar ao servidor', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingClient) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${deletingClient.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({ message: 'Erro ao excluir cliente' }));
        addToast(body.message ?? 'Erro ao excluir cliente', 'error');
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
      addToast('Cliente excluído com sucesso', 'success');
      setDeleteDialogOpen(false);
      setDeletingClient(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie seus clientes</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Novo cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Carregando...</div>
        ) : fetchError ? (
          <div className="py-16 text-center text-sm text-red-600 bg-red-50 rounded-xl px-4">
            {fetchError}
          </div>
        ) : (
          <ClientTable clients={clients} onEdit={openEdit} onDelete={openDelete} />
        )}
      </div>

      <ClientModal
        open={modalOpen}
        client={editingClient}
        loading={actionLoading}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        clientName={deletingClient?.name ?? ''}
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingClient(null);
        }}
      />

      <ToastList toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
