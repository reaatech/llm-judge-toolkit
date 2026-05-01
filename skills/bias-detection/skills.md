# Bias Detection Skill

## Description
Implement bias detection and mitigation strategies for LLM judgments. This skill detects position bias, length bias, style bias, and other systematic errors, then provides mitigation strategies.

## Capabilities
- Detect position bias through swap testing
- Identify length bias in evaluations
- Detect style and formatting bias
- Implement mitigation strategies (averaging, debiasing)
- Generate comprehensive bias reports
- Monitor bias metrics over time
- Provide bias alerts and recommendations
- Support custom bias detection rules

## Invocation
```yaml
skill: bias-detection
action: detect-position-bias
parameters:
  candidates:
    - id: candidate-a
      content: "Response A content"
    - id: candidate-b
      content: "Response B content"
  judge: gpt-4
  threshold: 0.1
  autoDebias: true
```

## Examples

### Full Bias Assessment
```yaml
skill: bias-detection
action: comprehensive-assessment
parameters:
  criteria: relevance
  sampleSize: 50
  biasTypes:
    - position
    - length
    - style
  generateReport: true
  mitigation: true
```

### Monitor Bias Over Time
```yaml
skill: bias-detection
action: monitor-bias
parameters:
  period: 7d
  threshold: 0.1
  alertOnDetection: true
  metrics:
    - position-bias-score
    - length-bias-score
    - overall-bias-index
```

## Generated Code Examples

### Position Bias Detection
```typescript
// packages/bias/src/position.ts
export interface PositionBiasReport {
  hasBias: boolean;
  averageBias: number;
  biasByPosition: Array<{
    candidateId: string;
    originalPosition: number;
    originalScore: number;
    swappedScore: number;
    positionEffect: number;
  }>;
  recommendation: string;
}

export class PositionBiasDetector {
  async detect(
    judge: JudgmentEngine,
    candidates: Candidate[]
  ): Promise<PositionBiasReport> {
    if (candidates.length < 2) {
      throw new Error('Position bias detection requires at least 2 candidates');
    }
    
    // Original order
    const originalOrder = await judge.judge({
      candidates: candidates
    });
    
    // Swapped order
    const swappedCandidates = [...candidates].reverse();
    const swappedOrder = await judge.judge({
      candidates: swappedCandidates
    });
    
    // Calculate bias for each candidate
    const biasScores = candidates.map((candidate, i) => {
      const originalScore = this.extractScore(originalOrder, candidate.id);
      const swappedScore = this.extractScore(swappedOrder, candidate.id);
      
      return {
        candidateId: candidate.id,
        originalPosition: i,
        originalScore,
        swappedScore,
        positionEffect: Math.abs(originalScore - swappedScore)
      };
    });
    
    const averageBias = biasScores.reduce((sum, b) => sum + b.positionEffect, 0) / biasScores.length;
    const hasBias = averageBias > 0.1; // 10% threshold
    
    return {
      hasBias,
      averageBias,
      biasByPosition: biasScores,
      recommendation: hasBias 
        ? 'Use position debiasing: average scores from both orders'
        : 'No significant position bias detected'
    };
  }
  
  async debias(
    judge: JudgmentEngine,
    candidates: Candidate[]
  ): Promise<Judgment> {
    // Run both orders and average
    const [original, swapped] = await Promise.all([
      judge.judge({ candidates }),
      judge.judge({ candidates: [...candidates].reverse() })
    ]);
    
    // Average the scores for each candidate
    const debiasedScores = candidates.map(candidate => {
      const origScore = this.extractScore(original, candidate.id);
      const swappedScore = this.extractScore(swapped, candidate.id);
      return (origScore + swappedScore) / 2;
    });
    
    return {
      ...original,
      score: debiasedScores.reduce((a, b) => a + b, 0) / debiasedScores.length,
      metadata: {
        ...original.metadata,
        debiased: true,
        originalScores: debiasedScores
      }
    };
  }
  
  private extractScore(judgment: Judgment, candidateId: string): number {
    // Extract score for specific candidate from judgment
    // Implementation depends on judgment structure
    return judgment.metadata?.scores?.[candidateId] || judgment.score;
  }
}
```

### Length Bias Detection
```typescript
// packages/bias/src/length.ts
export interface LengthBiasReport {
  hasBias: boolean;
  correlationCoefficient: number;
  biasDirection: 'prefers-longer' | 'prefers-shorter' | 'none';
  recommendations: string[];
}

export class LengthBiasDetector {
  async detect(
    judge: JudgmentEngine,
    samples: Array<{ response: string; expectedScore?: number }>
  ): Promise<LengthBiasReport> {
    // Run judgments on all samples
    const judgments = await Promise.all(
      samples.map(sample => judge.judge({ response: sample.response }))
    );
    
    // Calculate correlation between length and score
    const lengths = samples.map(s => s.response.length);
    const scores = judgments.map(j => j.score);
    
    const correlation = this.calculateCorrelation(lengths, scores);
    const hasBias = Math.abs(correlation) > 0.3; // Moderate correlation threshold
    
    const biasDirection = correlation > 0 
      ? 'prefers-longer' 
      : correlation < 0 
        ? 'prefers-shorter' 
        : 'none';
    
    const recommendations = this.generateRecommendations(correlation, hasBias);
    
    return {
      hasBias,
      correlationCoefficient: correlation,
      biasDirection,
      recommendations
    };
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  private generateRecommendations(correlation: number, hasBias: boolean): string[] {
    if (!hasBias) {
      return ['No significant length bias detected'];
    }
    
    const recommendations = [];
    if (correlation > 0) {
      recommendations.push('Model tends to prefer longer responses - consider normalizing for length');
      recommendations.push('Review prompt to emphasize quality over quantity');
    } else {
      recommendations.push('Model tends to prefer shorter responses - ensure completeness is valued');
      recommendations.push('Review prompt to emphasize comprehensive answers');
    }
    
    return recommendations;
  }
}
```

### Comprehensive Bias Report
```typescript
// packages/types/src/bias.ts — report types are in the shared types package
export interface ComprehensiveBiasReport {
  timestamp: Date;
  overallBiasScore: number;
  positionBias?: PositionBiasReport;
  lengthBias?: LengthBiasReport;
  styleBias?: StyleBiasReport;
  recommendations: string[];
  mitigationStrategies: string[];
}

export class BiasReportGenerator {
  static async generate(
    judge: JudgmentEngine,
    candidates: Candidate[],
    samples: Array<{ response: string }>
  ): Promise<ComprehensiveBiasReport> {
    const positionDetector = new PositionBiasDetector();
    const lengthDetector = new LengthBiasDetector();
    
    const [positionBias, lengthBias] = await Promise.all([
      positionDetector.detect(judge, candidates).catch(() => null),
      lengthDetector.detect(judge, samples).catch(() => null)
    ]);
    
    // Calculate overall bias score
    const biasScores = [
      positionBias?.averageBias || 0,
      lengthBias?.correlationCoefficient ? Math.abs(lengthBias.correlationCoefficient) : 0
    ];
    const overallBiasScore = biasScores.reduce((a, b) => a + b, 0) / biasScores.length;
    
    const recommendations = this.generateRecommendations({ positionBias, lengthBias });
    const mitigationStrategies = this.generateMitigationStrategies({ positionBias, lengthBias });
    
    return {
      timestamp: new Date(),
      overallBiasScore,
      positionBias: positionBias || undefined,
      lengthBias: lengthBias || undefined,
      recommendations,
      mitigationStrategies
    };
  }
  
  private static generateRecommendations(biases: {
    positionBias?: PositionBiasReport | null;
    lengthBias?: LengthBiasReport | null;
  }): string[] {
    const recommendations: string[] = [];
    
    if (biases.positionBias?.hasBias) {
      recommendations.push('Implement position debiasing by averaging both orders');
      recommendations.push('Consider using multiple judges with different orderings');
    }
    
    if (biases.lengthBias?.hasBias) {
      recommendations.push('Normalize scores for response length');
      recommendations.push('Update prompt templates to emphasize quality over length');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('No significant bias detected - continue monitoring');
    }
    
    return recommendations;
  }
  
  private static generateMitigationStrategies(biases: {
    positionBias?: PositionBiasReport | null;
    lengthBias?: LengthBiasReport | null;
  }): string[] {
    const strategies: string[] = [];
    
    if (biases.positionBias?.hasBias) {
      strategies.push('Use position debiasing: run both orders and average');
      strategies.push('Implement swap testing in CI/CD pipeline');
    }
    
    if (biases.lengthBias?.hasBias) {
      strategies.push('Add length normalization to scoring algorithm');
      strategies.push('Create length-balanced evaluation sets');
    }
    
    return strategies;
  }
}
```

## Constraints
- Position bias detection requires at least 2 candidates
- Length bias detection requires minimum 10 samples
- Statistical significance requires adequate sample sizes
- Bias thresholds should be configurable per use case
- Mitigation strategies may increase cost/latency

## Best Practices
1. **Regular Testing**: Run bias detection tests regularly
2. **Multiple Bias Types**: Test for various bias types
3. **Automated Detection**: Integrate bias detection into CI/CD
4. **Human Review**: Have humans review flagged biases
5. **Documentation**: Document bias findings and mitigations
6. **Monitoring**: Continuously monitor bias metrics
7. **Threshold Tuning**: Adjust thresholds based on use case
8. **Cost Awareness**: Balance bias mitigation with cost

## Related Skills
- `calibration-analysis` - For validating bias mitigation effectiveness
- `cost-optimization` - For managing increased costs from debiasing
- `test-generation` - For creating bias detection tests
