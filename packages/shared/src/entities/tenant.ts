export interface ITenant {
  tenantId: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  maxAssistants: number;
  maxConversationsPerMonth: number;
  createdAt: string;
  updatedAt: string;
}

