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
export function calculateMatrixSavings(): MatrixCalculationOutput {
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

    // 4. Calculate savings
    const savingsPerTon = baselineCostPerTon - reformulatedCostPerTon;

    return {
        baselineCostPerTon: parseFloat(baselineCostPerTon.toFixed(2)),
        savingsPerTon: parseFloat(savingsPerTon.toFixed(2)),
    };
}
