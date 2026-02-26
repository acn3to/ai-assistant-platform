import type { ITenant } from '@ai-platform/shared';

export interface ITenantRepository {
  create(tenant: ITenant): Promise<void>;
  get(tenantId: string): Promise<ITenant | null>;
}
