import type { CalculationInput, CalculationOutput } from '@/lib/types';

export function calculateRoi(data: CalculationInput, fcrImprovement: number): CalculationOutput {
  // The user inputs feed price as "$/kg live weight".
  // To get the price of feed per kg, we divide this by the FCR.
  // This assumes the feed cost per live weight is based on the baseline FCR.
  const pricePerKgFeed = data.fcr > 0 ? data.feedCostPerLw / data.fcr : 0;
  
  // Calculate the new, improved Feed Conversion Ratio (FCR)
  const improvedFcr = data.fcr * (1 - fcrImprovement / 100);

  // --- Baseline Calculation (Without Additive Effect on FCR) ---
  // This represents the scenario without using any Jefo solution.
  const survivingBroilersBaseline = data.numberOfBroilers * (1 - data.mortalityRate / 100);
  const totalLiveWeightBaseline = survivingBroilersBaseline * data.broilerWeight;
  const totalFeedConsumedBaseline = totalLiveWeightBaseline * data.fcr;
  const totalFeedCostBaseline = totalFeedConsumedBaseline * pricePerKgFeed;
  const costPerKgLiveWeightBaseline = totalLiveWeightBaseline > 0 ? totalFeedCostBaseline / totalLiveWeightBaseline : 0;

  // --- Calculation With Additive ---
  // This represents the scenario using the selected Jefo solution.
  const survivingBroilersWithAdditive = data.numberOfBroilers * (1 - data.mortalityRate / 100);
  const totalLiveWeightWithAdditive = survivingBroilersWithAdditive * data.broilerWeight;
  
  // Total feed consumed is lower due to the improved FCR.
  const totalFeedConsumedWithAdditive = totalLiveWeightWithAdditive * improvedFcr;
  const totalFeedConsumedTonsWithAdditive = totalFeedConsumedWithAdditive / 1000;
  
  // Calculate how much additive is needed based on the inclusion rate (g/ton).
  const totalAdditiveConsumed = (totalFeedConsumedTonsWithAdditive * data.additiveInclusionRate) / 1000;

  // Calculate the total costs for the 'with additive' scenario.
  const totalFeedCostWithAdditive = totalFeedConsumedWithAdditive * pricePerKgFeed;
  const totalAdditiveCost = totalAdditiveConsumed * data.additiveCost;
  const totalCostWithAdditive = totalFeedCostWithAdditive + totalAdditiveCost;

  const costPerKgLiveWeightWithAdditive = totalLiveWeightWithAdditive > 0 ? totalCostWithAdditive / totalLiveWeightWithAdditive : 0;

  // --- Savings & ROI Calculation ---
  // The ROI formula is: (Total Cost Savings / Total Additive Cost) * 100

  // 1. Calculate Total Cost Savings
  // This is the difference between the baseline cost and the cost with the additive.
  const totalCostSavings = totalFeedCostBaseline - totalCostWithAdditive;
  
  // 2. Calculate ROI
  // If the additive has a cost, ROI is savings divided by cost.
  // If the additive is free (cost=0) and there are savings, ROI is infinite.
  const roi = totalAdditiveCost > 0 ? (totalCostSavings / totalAdditiveCost) * 100 : (totalCostSavings > 0 ? Infinity : 0);
  
  // Calculate the percentage reduction in cost per kg of live weight.
  const costReductionPercentage = costPerKgLiveWeightBaseline > 0
    ? ((costPerKgLiveWeightBaseline - costPerKgLiveWeightWithAdditive) / costPerKgLiveWeightBaseline) * 100
    : 0;
  
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
      costReductionPercentage,
    }
  };
}
