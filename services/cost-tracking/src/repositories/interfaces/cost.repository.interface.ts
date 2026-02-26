import type { ICostEvent, IDailyRollup, IMonthlyRollup, IPricingConfig } from '@ai-platform/shared';

export interface ICostRepository {
  getCostEventsByConversation(conversationId: string): Promise<ICostEvent[]>;
  getCostEventsByTenant(tenantId: string, startDate: string, endDate: string): Promise<ICostEvent[]>;
  getActiveTenantIdsForDate(dateStr: string): Promise<Set<string>>;
  putDailyRollup(rollup: IDailyRollup): Promise<void>;
  getDailyRollups(tenantId: string, startDate: string, endDate: string): Promise<IDailyRollup[]>;
  getDailyRollupTenantIds(startDate: string, endDate: string): Promise<Set<string>>;
  putMonthlyRollup(rollup: IMonthlyRollup): Promise<void>;
  getMonthlyRollups(tenantId: string, startMonth: string, endMonth: string): Promise<IMonthlyRollup[]>;
  getPricing(modelId: string): Promise<IPricingConfig | null>;
  putPricing(config: IPricingConfig): Promise<void>;
  getAllPricing(): Promise<IPricingConfig[]>;
}
