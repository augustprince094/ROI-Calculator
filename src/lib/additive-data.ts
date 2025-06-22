export const additiveData = {
  "Jefo Pro Solution": { inclusionRate: 150, cost: 12, fcrImprovement: 2.5 },
  "Jefo P(OA+EO)": { inclusionRate: 200, cost: 15, fcrImprovement: 3 },
  "Belfeed": { inclusionRate: 150, cost: 10, fcrImprovement: 5 },
};

export type AdditiveName = keyof typeof additiveData;

export const allAdditives = Object.entries(additiveData).map(([name, data]) => ({
  name: name as AdditiveName,
  ...data,
}));
