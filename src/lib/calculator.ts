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
 */
const feedIngredients = [
    { name: "Corn", quantityKg: 579.2, pricePerTon: 232 },
    { name: "Soybean meal", quantityKg: 396, pricePerTon: 624 },
    { name: "Soybean oil", quantityKg: 43.6, pricePerTon: 1600 },
    { name: "Synthetic AA", quantityKg: 6.5, pricePerTon: 3250 },
    { name: "Other raw materials", quantityKg: 26.4, pricePerTon: 100 }
];

/**
 * Calculates feed cost savings based on a nutrient matrix reformulation.
 * This function uses a predefined feed formulation and applies specific percentage
 * changes to ingredient quantities when Jefo Pro Solution is used.
 * @returns {MatrixCalculationOutput} The calculated savings per ton of feed.
 */
export function calculateMatrixSavings(data: CalculationInput): MatrixCalculationOutput {
    // Helper function to calculate the total cost of a given feed formulation.
    const calculateTotalCost = (ingredients: typeof feedIngredients) => {
        return ingredients.reduce((total, ingredient) => {
            const costOfIngredient = (ingredient.quantityKg * ingredient.pricePerTon) / 1000;
            return total + costOfIngredient;
        }, 0);
    };

    // 1. Calculate baseline cost per ton
    const baselineCostPerTon = calculateTotalCost(feedIngredients);

    // 2. Define the reformulated diet
    const reformulatedIngredients = JSON.parse(JSON.stringify(feedIngredients));
    
    const originalQuantities: { [key: string]: number } = {};
    feedIngredients.forEach(ing => {
        originalQuantities[ing.name] = ing.quantityKg;
    });

    let totalWeightChange = 0;

    // Apply percentage changes for each specified ingredient
    reformulatedIngredients.forEach((ingredient: { name: string; quantityKg: number }) => {
        let change = 0;
        switch (ingredient.name) {
            case "Corn":
                change = originalQuantities[ingredient.name] * 0.031; // 3.1% increase
                ingredient.quantityKg += change;
                totalWeightChange += change;
                break;
            case "Soybean meal":
                change = originalQuantities[ingredient.name] * -0.045; // 4.5% decrease
                ingredient.quantityKg += change;
                totalWeightChange += change;
                break;
            case "Soybean oil":
                change = originalQuantities[ingredient.name] * -0.06; // 6% decrease
                ingredient.quantityKg += change;
                totalWeightChange += change;
                break;
            case "Synthetic AA":
                change = originalQuantities[ingredient.name] * -0.031; // 3.1% decrease
                ingredient.quantityKg += change;
                totalWeightChange += change;
                break;
        }
    });

    // Balance the total weight to 1000kg by adjusting "Other raw materials"
    const otherMaterials = reformulatedIngredients.find((ing: {name: string}) => ing.name === "Other raw materials");
    if (otherMaterials) {
        otherMaterials.quantityKg -= totalWeightChange;
    }

    // 3. Calculate reformulated cost per ton
    const reformulatedCostPerTon = calculateTotalCost(reformulatedIngredients);

    // 4. Calculate savings per ton
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
    const totalAdditiveConsumedKg = (totalFeedConsumedTons * data.additiveInclusionRate) / 1000;
    const totalAdditiveCost = totalAdditiveConsumedKg * data.additiveCost;
    const roi = totalAdditiveCost > 0 ? (savingsPerCycle / totalAdditiveCost) * 100 : (savingsPerCycle > 0 ? Infinity : 0);

    return {
        baselineCostPerTon: parseFloat(baselineCostPerTon.toFixed(2)),
        savingsPerTon: parseFloat(savingsPerTon.toFixed(2)),
        savingsPerCycle: Math.round(savingsPerCycle),
        roi,
    };
}
