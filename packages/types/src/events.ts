import type { PositionBiasReport } from './bias.js';
import type { CalibrationReport } from './calibration.js';
import type { ConsensusJudgment, Judgment } from './judgment.js';

export type JudgmentEvent =
  | { type: 'judgment:completed'; judgment: Judgment }
  | { type: 'judgment:cached'; judgment: Judgment }
  | { type: 'judgment:error'; error: Error; context: unknown }
  | { type: 'consensus:completed'; judgment: ConsensusJudgment }
  | { type: 'budget:exceeded'; current: number; limit: number }
  | { type: 'calibration:completed'; report: CalibrationReport }
  | { type: 'bias:detected'; report: PositionBiasReport };

export interface EventBus {
  emit<T extends JudgmentEvent['type']>(
    event: T,
    payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>,
  ): void;
  on<T extends JudgmentEvent['type']>(
    event: T,
    handler: (payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>) => void,
  ): void;
  off<T extends JudgmentEvent['type']>(
    event: T,
    handler: (payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>) => void,
  ): void;
}
