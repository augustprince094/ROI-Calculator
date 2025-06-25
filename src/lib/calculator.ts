
import type { CalculationInput, CalculationOutput, MatrixCalculationOutput } from '@/lib/types';

/**
 * Calculates the financial impact of using a feed additive, accounting for feed consumed by mortalities.
 * It assumes birds that die consume, on average, 20% of the feed of a bird that survives to market.
 */
export function calculateRoi(data: CalculationInput, fcrImprovement: number): CalculationOutput {
  const pricePerKgFeed = data.fcr > 0 ? data.feedCostPerLw / data.fcr : 0;
  const improvedFcr = data.fcr * (1 - fcrImprovement / 100);

  // --- Helper function to calculate costs for a given scenario ---
  const calculateScenarioCost = (fcr: number, mortalityRate: number) => {
    const survivingBroilers = data.numberOfBroilers * (1 - mortalityRate / 100);
    const deadBroilers = data.numberOfBroilers - survivingBroilers;
    const totalLiveWeight = survivingBroilers * data.broilerWeight;

    // Feed consumed by birds that survive to market
    const feedForSurvivors = survivingBroilers * data.broilerWeight * fcr;

    // Feed consumed by birds that die (assuming they consume 20% on average)
    const feedForMortalities = deadBroilers * (data.broilerWeight * fcr * 0.2);

    const totalFeedConsumed = feedForSurvivors + feedForMortalities;
    const totalFeedCost = totalFeedConsumed * pricePerKgFeed;

    return { totalLiveWeight, totalFeedConsumed, totalFeedCost };
  };

  // --- Baseline Calculation (Without Additive) ---
  const { 
    totalLiveWeight: totalLiveWeightBaseline, 
    totalFeedCost: totalFeedCostBaseline,
  } = calculateScenarioCost(data.fcr, data.mortalityRate);

  const costPerKgLiveWeightBaseline = totalLiveWeightBaseline > 0 
    ? totalFeedCostBaseline / totalLiveWeightBaseline 
    : 0;

  // --- Calculation With Additive ---
  let adjustedMortalityRate = data.mortalityRate;
  if (data.additiveType === 'Jefo Pro Solution') {
    adjustedMortalityRate = Math.max(0, data.mortalityRate - 1.5);
  } else if (data.additiveType === 'Jefo P(OA+EO)') {
    adjustedMortalityRate = Math.max(0, data.mortalityRate - 2);
  }

  const {
    totalLiveWeight: totalLiveWeightWithAdditive,
    totalFeedConsumed: totalFeedConsumedWithAdditive,
    totalFeedCost: totalFeedCostWithAdditive,
  } = calculateScenarioCost(improvedFcr, adjustedMortalityRate);

  const totalFeedConsumedTonsWithAdditive = totalFeedConsumedWithAdditive / 1000;
  const totalAdditiveConsumed = (totalFeedConsumedTonsWithAdditive * data.additiveInclusionRate) / 1000;
  const totalAdditiveCost = totalAdditiveConsumed * data.additiveCost;
  const totalCostWithAdditive = totalFeedCostWithAdditive + totalAdditiveCost;

  const costPerKgLiveWeightWithAdditive = totalLiveWeightWithAdditive > 0 
    ? totalCostWithAdditive / totalLiveWeightWithAdditive 
    : 0;

  // --- Savings & ROI Calculation ---
  const totalCostSavings = totalFeedCostBaseline - totalCostWithAdditive;
  const roi = totalAdditiveCost > 0 ? (totalCostSavings / totalAdditiveCost) * 100 : (totalCostSavings > 0 ? Infinity : 0);
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
 * A database of feed ingredients for a standard 1-ton (1000kg) broiler feed formulation.
 * NOTE: Corn quantity adjusted to make the total sum 1000kg. Other raw material price updated per user request.
 */
const feedIngredients = [
    { name: "Corn", quantityKg: 488.2, pricePerTon: 232 },
    { name: "Soybean meal", quantityKg: 434.3, pricePerTon: 624 },
    { name: "Soybean oil", quantityKg: 44.6, pricePerTon: 1600 },
    { name: "Synthetic AA", quantityKg: 6.5, pricePerTon: 2854 },
    { name: "Other raw materials", quantityKg: 26.4, pricePerTon: 10 }
];

/**
 * Calculates feed cost savings based on a nutrient matrix reformulation.
 * This function models the additive as a direct ingredient in the reformulated diet.
 * @returns {MatrixCalculationOutput} The calculated savings and ROI.
 */
export function calculateMatrixSavings(data: CalculationInput): MatrixCalculationOutput {
    // Helper function to calculate the total cost of a given feed formulation.
    const calculateTotalCost = (ingredients: {name: string, quantityKg: number, pricePerTon: number}[]) => {
        return ingredients.reduce((total, ingredient) => {
            const costOfIngredient = (ingredient.quantityKg * ingredient.pricePerTon) / 1000;
            return total + costOfIngredient;
        }, 0);
    };

    // 1. Calculate baseline cost per ton
    const baselineCostPerTon = calculateTotalCost(feedIngredients);

    // 2. Define the reformulated diet.
    // Start with a deep copy of the baseline ingredients.
    const reformulatedIngredients = JSON.parse(JSON.stringify(feedIngredients));

    // Apply percentage-based changes to ingredient quantities
    const ingredientAdjustments: {[key: string]: number} = {
        "Corn": 1.036,                 // +3.6%
        "Soybean meal": 0.956,          // -4.4%
        "Soybean oil": 0.93,            // -7.0%
        "Synthetic AA": 0.964,          // -3.6%
        "Other raw materials": 1.006,   // +0.6%
    };
    
    reformulatedIngredients.forEach((ingredient: {name: string, quantityKg: number}) => {
        if (ingredientAdjustments[ingredient.name]) {
            ingredient.quantityKg *= ingredientAdjustments[ingredient.name];
        }
    });

    // Add the additive as an ingredient
    const additiveQuantityKg = data.additiveInclusionRate / 1000;
    reformulatedIngredients.push({
        name: data.additiveType,
        quantityKg: additiveQuantityKg,
        pricePerTon: data.additiveCost * 1000,
    });
    
    // Sum the weights of all ingredients to see how far off we are from 1000kg
    const totalWeightBeforeBalancing = reformulatedIngredients.reduce((sum: number, ing: {quantityKg: number}) => sum + ing.quantityKg, 0);

    // Re-balance the diet to 1000 kg by adjusting the corn quantity
    const cornIngredient = reformulatedIngredients.find((ing: {name: string}) => ing.name === "Corn");
    if (cornIngredient) {
        const difference = 1000 - totalWeightBeforeBalancing;
        cornIngredient.quantityKg += difference;
    }

    // 3. Calculate reformulated cost per ton (now includes additive cost)
    const reformulatedCostPerTon = calculateTotalCost(reformulatedIngredients);

    // 4. Calculate savings per ton (this is now net savings)
    const savingsPerTon = baselineCostPerTon - reformulatedCostPerTon;

    // Adjust mortality rate for certain additives before calculating cycle savings.
    let adjustedMortalityRate = data.mortalityRate;
    if (data.additiveType === 'Jefo Pro Solution') {
        adjustedMortalityRate = Math.max(0, data.mortalityRate - 1.5); // Ensure it doesn't go below 0
    }

    // 5. Calculate total feed consumed in the cycle to find savings per cycle, accounting for mortality wastage.
    const survivingBroilers = data.numberOfBroilers * (1 - adjustedMortalityRate / 100);
    const deadBroilers = data.numberOfBroilers - survivingBroilers;
    const feedForSurvivors = survivingBroilers * data.broilerWeight * data.fcr;
    const feedForMortalities = deadBroilers * (data.broilerWeight * data.fcr * 0.2);
    const totalFeedConsumedTons = (feedForSurvivors + feedForMortalities) / 1000;

    const savingsPerCycle = totalFeedConsumedTons * savingsPerTon;

    // 6. Calculate ROI
    const totalAdditiveConsumedKg = totalFeedConsumedTons * (data.additiveInclusionRate / 1000);
    const totalAdditiveCost = totalAdditiveConsumedKg * data.additiveCost;
    // ROI is Net Savings / Investment. `savingsPerCycle` is already net. `totalAdditiveCost` is the investment.
    const roi = totalAdditiveCost > 0 ? (savingsPerCycle / totalAdditiveCost) * 100 : (savingsPerCycle > 0 ? Infinity : 0);

    return {
        baselineCostPerTon: parseFloat(baselineCostPerTon.toFixed(2)),
        savingsPerTon: parseFloat(savingsPerTon.toFixed(2)),
        savingsPerCycle: Math.round(savingsPerCycle),
        roi,
    };
}
