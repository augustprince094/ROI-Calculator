import type { CalculationInput, CalculationOutput } from '@/lib/types';

export function calculateRoi(data: CalculationInput): CalculationOutput {
  // --- User's Farm Calculation (With Additive) ---
  const survivingBroilers = data.numberOfBroilers * (1 - data.mortalityRate / 100);
  const totalLiveWeight = survivingBroilers * data.broilerWeight;
  const totalFeedConsumed = totalLiveWeight * data.fcr; // in kg
  const totalFeedConsumedTons = totalFeedConsumed / 1000;
  
  const totalAdditiveConsumed = (totalFeedConsumedTons * data.additiveInclusionRate) / 1000; // in kg

  const totalFeedCost = totalFeedConsumed * data.feedPrice;
  const totalAdditiveCost = totalAdditiveConsumed * data.additiveCost;
  const totalCostWithAdditive = totalFeedCost + totalAdditiveCost;

  const costPerKgLiveWeight = totalLiveWeight > 0 ? totalCostWithAdditive / totalLiveWeight : 0;

  // --- Market Average Calculation (Baseline/Control) ---
  // We assume the same number of broilers and FCR for a fair comparison of other metrics.
  const survivingBroilersMarket = data.numberOfBroilers * (1 - data.averageMortalityRate / 100);
  const totalLiveWeightMarket = survivingBroilersMarket * data.averageBroilerWeight;
  const totalFeedConsumedMarket = totalLiveWeightMarket * data.fcr;

  const totalFeedCostMarket = totalFeedConsumedMarket * data.averageFeedPrice;
  // Assuming no additive cost for the market average scenario to calculate savings against it.
  const totalCostMarket = totalFeedCostMarket;

  const costPerKgLiveWeightMarket = totalLiveWeightMarket > 0 ? totalCostMarket / totalLiveWeightMarket : 0;
  
  // --- Savings & ROI Calculation ---
  const costDifference = costPerKgLiveWeightMarket - costPerKgLiveWeight;
  const totalCostSavings = costDifference * totalLiveWeight;
  const roi = totalAdditiveCost > 0 ? (totalCostSavings / totalAdditiveCost) * 100 : (totalCostSavings > 0 ? Infinity : 0);
  
  return {
    costPerKgLiveWeight,
    totalCostSavings,
    roi,
  };
}
