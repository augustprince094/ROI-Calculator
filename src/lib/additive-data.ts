export const additiveData = {
  "Additive A": { inclusionRate: 500, cost: 12, fcrImprovement: 3 },
  "Additive B": { inclusionRate: 300, cost: 15, fcrImprovement: 5 },
  "Additive C": { inclusionRate: 700, cost: 10, fcrImprovement: 2 },
};

export type AdditiveName = keyof typeof additiveData;

export const allAdditives = Object.entries(additiveData).map(([name, data]) => ({
  name: name as AdditiveName,
  ...data,
}));
