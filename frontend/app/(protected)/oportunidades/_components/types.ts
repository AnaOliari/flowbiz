export interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  value: number;
  status: 'OPEN' | 'WON' | 'LOST';
  expectedCloseDate?: string | null;
  clientId: string;
  responsibleUserId: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
  };
  responsibleUser: {
    id: string;
    name: string;
    email: string;
  };
}
