import type { CalculationInput, CalculationOutput, MatrixCalculationOutput } from '@/lib/types';

export function calculateRoi(data: CalculationInput, fcrImprovement: number): CalculationOutput {
  // The user inputs feed price as "$/kg live weight".
  // To get the price of feed per kg, we divide this by the FCR.
  // This assumes the feed cost per live weight is based on the baseline FCR.
  const pricePerKgFeed = data.fcr > 0 ? data.feedCostPerLw / data.fcr : 0;
  
  // Calculate the new, improved Feed Conversion Ratio (FCR)
  const improvedFcr = data.fcr - (data.fcr * fcrImprovement / 100);

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
      improvedFcr: parseFloat(improvedFcr.toFixed(2)),
    },
    comparison: {
      totalCostSavings: Math.round(totalCostSavings),
      roi,
      costReductionPercentage,
    }
  };
}


/**
 * Calculates feed cost savings based on a nutrient matrix application.
 * This function assumes a 5% reduction in soybean meal, which is replaced by an equal weight of corn.
 * A typical inclusion of 250 kg of soybean meal per ton of feed is used as the basis for this calculation.
 * @param {object} params - The parameters for the calculation.
 * @param {number} params.cornPrice - The price of corn in $/ton.
 * @param {number} params.soybeanPrice - The price of soybean in $/ton.
 * @returns {MatrixCalculationOutput} The calculated savings per ton of feed.
 */
export function calculateMatrixSavings({ cornPrice, soybeanPrice }: { cornPrice: number; soybeanPrice: number; }): MatrixCalculationOutput {
  // Assume a standard 250kg of soybean meal per ton of complete feed.
  const soybeanMealPerTon = 250; // in kg
  
  // The matrix allows for a 5% reduction in soybean meal.
  const soybeanReductionKg = soybeanMealPerTon * 0.05; // 5% of 250kg = 12.5kg

  // This reduced amount of soybean is replaced by an equal weight of corn.
  const cornIncreaseKg = soybeanReductionKg;
  
  // Convert prices from $/ton to $/kg
  const soybeanPricePerKg = soybeanPrice / 1000;
  const cornPricePerKg = cornPrice / 1000;
  
  // Calculate the cost of the removed soybean and the added corn.
  const costOfRemovedSoybean = soybeanReductionKg * soybeanPricePerKg;
  const costOfAddedCorn = cornIncreaseKg * cornPricePerKg;

  // The savings per ton is the difference in cost.
  const savingsPerTon = costOfRemovedSoybean - costOfAddedCorn;

  return {
    savingsPerTon: parseFloat(savingsPerTon.toFixed(2)),
  };
}
