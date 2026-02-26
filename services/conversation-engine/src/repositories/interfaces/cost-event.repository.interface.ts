import type { ICostEvent } from '@ai-platform/shared';

export interface ICostEventRepository {
  save(event: ICostEvent): Promise<void>;
}
