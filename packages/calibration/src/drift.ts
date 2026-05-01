import type { CalibrationReport } from '@reaatech/llm-judge-types';

export interface DriftReport {
  hasDrift: boolean;
  cohensKappaDelta: number;
  accuracyDelta: number;
  recommendation: string;
  baseline: CalibrationReport;
  current: CalibrationReport;
}

export class DriftDetector {
  constructor(
    private kappaThreshold = 0.1,
    private accuracyThreshold = 0.1,
  ) {}

  detect(baseline: CalibrationReport, current: CalibrationReport): DriftReport {
    const kappaDelta = baseline.cohensKappa - current.cohensKappa;
    const accuracyDelta = baseline.accuracy - current.accuracy;

    const hasDrift =
      Math.abs(kappaDelta) > this.kappaThreshold ||
      Math.abs(accuracyDelta) > this.accuracyThreshold;

    const isDegradation = kappaDelta > 0 || accuracyDelta > 0;

    return {
      hasDrift,
      cohensKappaDelta: kappaDelta,
      accuracyDelta,
      baseline,
      current,
      recommendation: hasDrift
        ? isDegradation
          ? `Calibration drift detected: Kappa changed by ${kappaDelta.toFixed(3)}, accuracy changed by ${accuracyDelta.toFixed(3)}. Consider recalibrating or reviewing recent template changes.`
          : `Significant calibration improvement detected: Kappa changed by ${kappaDelta.toFixed(3)}, accuracy changed by ${accuracyDelta.toFixed(3)}. Verify this is due to genuine improvement, not data leakage.`
        : 'No significant calibration drift detected.',
    };
  }
}
