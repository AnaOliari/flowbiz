'use client';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export default function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Nenhum cliente cadastrado.</p>
        <p className="text-xs text-gray-400 mt-1">Clique em &quot;Novo cliente&quot; para começar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left font-medium text-gray-500 px-4 py-3">Nome</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">E-mail</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Telefone</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Empresa</th>
            <th className="text-right font-medium text-gray-500 px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
              <td className="px-4 py-3 text-gray-500">{client.email ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{client.phone ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{client.company ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(client)}
                  className="text-blue-600 hover:text-blue-800 font-medium mr-4 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(client)}
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
