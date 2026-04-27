# Calibration Analysis Skill

## Description
Perform statistical calibration analysis including Cohen's kappa, Fleiss' kappa, Krippendorff's alpha, and other inter-rater reliability metrics. This skill validates LLM judgments against human labels and detects calibration drift.

## Capabilities
- Calculate Cohen's kappa for inter-rater reliability
- Compute Fleiss' kappa for multiple raters
- Calculate Krippendorff's alpha for agreement
- Generate confusion matrices and accuracy metrics
- Detect calibration drift over time
- Create calibration reports with visualizations
- Manage gold standard datasets
- Perform statistical significance testing

## Invocation
```yaml
skill: calibration-analysis
action: analyze-calibration
parameters:
  judgments: judgments.json
  humanLabels: human-labels.json
  metrics:
    - cohens-kappa
    - accuracy
    - confusion-matrix
  threshold: 0.7
```

## Examples

### Run Full Calibration
```yaml
skill: calibration-analysis
action: run-calibration
parameters:
  criteria: faithfulness
  sampleSize: 100
  metrics:
    - cohens-kappa
    - fleiss-kappa
    - krippendorff-alpha
    - accuracy
    - precision
    - recall
  generateReport: true
```

### Detect Calibration Drift
```yaml
skill: calibration-analysis
action: detect-drift
parameters:
  baseline: baseline-calibration.json
  current: current-judgments.json
  threshold: 0.1
  window: 7d
```

## Generated Code Examples

### Calibration Metrics
```typescript
// src/calibration/metrics.ts
export class CalibrationMetrics {
  static cohensKappa(judgments: number[], humanLabels: number[]): number {
    const n = judgments.length;
    let observed = 0;
    const judgeDist = new Map<number, number>();
    const humanDist = new Map<number, number>();
    
    // Discretize scores to 3 categories (0-0.33, 0.34-0.66, 0.67-1.0)
    const discretize = (score: number) => Math.min(2, Math.floor(score * 3));
    
    for (let i = 0; i < n; i++) {
      const jCat = discretize(judgments[i]);
      const hCat = discretize(humanLabels[i]);
      
      if (jCat === hCat) observed++;
      judgeDist.set(jCat, (judgeDist.get(jCat) || 0) + 1);
      humanDist.set(hCat, (humanDist.get(hCat) || 0) + 1);
    }
    
    const po = observed / n;
    
    let pe = 0;
    for (const [cat, count] of judgeDist) {
      const humanCount = humanDist.get(cat) || 0;
      pe += (count / n) * (humanCount / n);
    }
    
    return (po - pe) / (1 - pe);
  }
  
  static fleissKappa(ratings: number[][], categories: number = 3): number {
    const n = ratings.length;
    const m = ratings[0].length; // Number of raters
    
    // Calculate category proportions
    const categoryCounts = new Array(categories).fill(0);
    for (const raterRatings of ratings) {
      for (const rating of raterRatings) {
        categoryCounts[rating]++;
      }
    }
    
    const categoryProps = categoryCounts.map(c => c / (n * m));
    
    // Calculate agreement for each subject
    let sumPe = 0;
    let sumPa = 0;
    
    for (const raterRatings of ratings) {
      // Count ratings per category for this subject
      const counts = new Array(categories).fill(0);
      for (const rating of raterRatings) {
        counts[rating]++;
      }
      
      // Calculate agreement for this subject
      let sumSquares = 0;
      for (const count of counts) {
        sumSquares += count * count;
      }
      
      const pa = (sumSquares - m) / (m * (m - 1));
      sumPa += pa;
      
      // Expected agreement
      let pe = 0;
      for (const prop of categoryProps) {
        pe += prop * prop;
      }
      sumPe += pe;
    }
    
    const paBar = sumPa / n;
    const peBar = sumPe / n;
    
    return (paBar - peBar) / (1 - peBar);
  }
  
  static confusionMatrix(
    judgments: number[],
    humanLabels: number[],
    thresholds: number[] = [0.33, 0.66]
  ): { matrix: number[][]; categories: number; thresholds: number[] } {
    const categories = thresholds.length + 1;
    const matrix = Array(categories).fill(null).map(() => Array(categories).fill(0));
    
    const categorize = (score: number) => {
      for (let i = 0; i < thresholds.length; i++) {
        if (score <= thresholds[i]) return i;
      }
      return thresholds.length;
    };
    
    for (let i = 0; i < judgments.length; i++) {
      const pred = categorize(judgments[i]);
      const actual = categorize(humanLabels[i]);
      matrix[pred][actual]++;
    }
    
    return { matrix, categories, thresholds };
  }
  
  static accuracy(judgments: number[], humanLabels: number[], threshold: number = 0.5): number {
    let correct = 0;
    for (let i = 0; i < judgments.length; i++) {
      const predClass = judgments[i] >= threshold ? 1 : 0;
      const actualClass = humanLabels[i] >= threshold ? 1 : 0;
      if (predClass === actualClass) correct++;
    }
    return correct / judgments.length;
  }
  
  static precision(judgments: number[], humanLabels: number[], threshold: number = 0.5): number {
    let truePositives = 0;
    let falsePositives = 0;
    
    for (let i = 0; i < judgments.length; i++) {
      const predClass = judgments[i] >= threshold ? 1 : 0;
      const actualClass = humanLabels[i] >= threshold ? 1 : 0;
      
      if (predClass === 1 && actualClass === 1) truePositives++;
      if (predClass === 1 && actualClass === 0) falsePositives++;
    }
    
    return truePositives / (truePositives + falsePositives);
  }
  
  static recall(judgments: number[], humanLabels: number[], threshold: number = 0.5): number {
    let truePositives = 0;
    let falseNegatives = 0;
    
    for (let i = 0; i < judgments.length; i++) {
      const predClass = judgments[i] >= threshold ? 1 : 0;
      const actualClass = humanLabels[i] >= threshold ? 1 : 0;
      
      if (predClass === 1 && actualClass === 1) truePositives++;
      if (predClass === 0 && actualClass === 1) falseNegatives++;
    }
    
    return truePositives / (truePositives + falseNegatives);
  }
}
```

### Calibration Report Generator
```typescript
// src/calibration/report.ts
export interface CalibrationReport {
  cohensKappa: number;
  fleissKappa?: number;
  krippendorffAlpha?: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  sampleSize: number;
  timestamp: Date;
  passed: boolean;
  recommendations: string[];
}

export class CalibrationReportGenerator {
  static generate(
    judgments: number[],
    humanLabels: number[],
    minKappa: number = 0.7
  ): CalibrationReport {
    const cohensKappa = CalibrationMetrics.cohensKappa(judgments, humanLabels);
    const accuracy = CalibrationMetrics.accuracy(judgments, humanLabels);
    const precision = CalibrationMetrics.precision(judgments, humanLabels);
    const recall = CalibrationMetrics.recall(judgments, humanLabels);
    const f1Score = 2 * (precision * recall) / (precision + recall);
    const confusionMatrix = CalibrationMetrics.confusionMatrix(judgments, humanLabels);
    
    const passed = cohensKappa >= minKappa;
    const recommendations = this.generateRecommendations({
      cohensKappa, accuracy, precision, recall, f1Score
    });
    
    return {
      cohensKappa,
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: confusionMatrix.matrix,
      sampleSize: judgments.length,
      timestamp: new Date(),
      passed,
      recommendations
    };
  }
  
  private static generateRecommendations(metrics: {
    cohensKappa: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (metrics.cohensKappa < 0.4) {
      recommendations.push('Poor agreement - consider recalibrating the judgment model or template');
    } else if (metrics.cohensKappa < 0.7) {
      recommendations.push('Moderate agreement - review prompt templates and examples');
    }
    
    if (metrics.precision < 0.7) {
      recommendations.push('Low precision - model may be over-predicting positive cases');
    }
    
    if (metrics.recall < 0.7) {
      recommendations.push('Low recall - model may be missing positive cases');
    }
    
    if (metrics.f1Score < 0.7) {
      recommendations.push('Low F1 score - consider adjusting the decision threshold');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Calibration looks good - continue monitoring for drift');
    }
    
    return recommendations;
  }
}
```

## Constraints
- Require minimum sample size of 30 for statistical significance
- Use appropriate discretization for continuous scores
- Handle edge cases (all same class, perfect agreement)
- Provide confidence intervals for metrics
- Document assumptions and limitations

## Best Practices
1. **Sample Size**: Use at least 30-50 samples for reliable metrics
2. **Balanced Data**: Ensure balanced representation of all classes
3. **Multiple Metrics**: Don't rely on a single metric
4. **Confidence Intervals**: Report uncertainty in estimates
5. **Regular Calibration**: Recalibrate periodically and after model changes
6. **Human Review**: Have humans review edge cases and disagreements
7. **Documentation**: Document calibration methodology and results
8. **Version Control**: Version calibration datasets and results

## Related Skills
- `test-generation` - For creating calibration tests
- `bias-detection` - For detecting bias in calibrated judgments
- `documentation` - For generating calibration reports
