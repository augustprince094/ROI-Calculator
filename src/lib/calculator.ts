import type { CalculationInput, CalculationOutput } from '@/lib/types';

export function calculateRoi(data: CalculationInput, fcrImprovement: number): CalculationOutput {
  const improvedFcr = data.fcr * (1 - fcrImprovement / 100);

  // --- Baseline Calculation (Without Additive Effect on FCR) ---
  const survivingBroilersBaseline = data.numberOfBroilers * (1 - data.mortalityRate / 100);
  const totalLiveWeightBaseline = survivingBroilersBaseline * data.broilerWeight;
  const totalFeedConsumedBaseline = totalLiveWeightBaseline * data.fcr;
  const totalFeedCostBaseline = totalFeedConsumedBaseline * data.feedPrice;
  // Note: Baseline cost doesn't include additive, as we compare against it.
  const costPerKgLiveWeightBaseline = totalLiveWeightBaseline > 0 ? totalFeedCostBaseline / totalLiveWeightBaseline : 0;

  // --- Calculation With Additive ---
  const survivingBroilersWithAdditive = data.numberOfBroilers * (1 - data.mortalityRate / 100);
  const totalLiveWeightWithAdditive = survivingBroilersWithAdditive * data.broilerWeight;
  const totalFeedConsumedWithAdditive = totalLiveWeightWithAdditive * improvedFcr;
  const totalFeedConsumedTonsWithAdditive = totalFeedConsumedWithAdditive / 1000;
  
  const totalAdditiveConsumed = (totalFeedConsumedTonsWithAdditive * data.additiveInclusionRate) / 1000;

  const totalFeedCostWithAdditive = totalFeedConsumedWithAdditive * data.feedPrice;
  const totalAdditiveCost = totalAdditiveConsumed * data.additiveCost;
  const totalCostWithAdditive = totalFeedCostWithAdditive + totalAdditiveCost;

  const costPerKgLiveWeightWithAdditive = totalLiveWeightWithAdditive > 0 ? totalCostWithAdditive / totalLiveWeightWithAdditive : 0;

  // --- Savings & ROI Calculation ---
  const totalCostSavings = totalFeedCostBaseline - totalCostWithAdditive;
  const roi = totalAdditiveCost > 0 ? (totalCostSavings / totalAdditiveCost) * 100 : (totalCostSavings > 0 ? Infinity : 0);
  
  return {
    baseline: {
      costPerKgLiveWeight: costPerKgLiveWeightBaseline,
      totalCost: totalFeedCostBaseline,
    },
    withAdditive: {
      costPerKgLiveWeight: costPerKgLiveWeightWithAdditive,
      totalCost: totalCostWithAdditive,
      improvedFcr: improvedFcr,
    },
    comparison: {
      totalCostSavings,
      roi,
    }
  };
}