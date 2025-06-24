export const additiveData = {
  "Jefo Pro Solution": { inclusionRate: 125, cost: 12, fcrImprovement: 2.5, color: "#FCB839" },
  "Jefo P(OA+EO)": { inclusionRate: 200, cost: 15, fcrImprovement: 3, color: "#C00000" },
  "Belfeed": { inclusionRate: 100, cost: 10, fcrImprovement: 5, color: "hsl(var(--primary))" },
};

export type AdditiveName = keyof typeof additiveData;

export const allAdditives = Object.entries(additiveData).map(([name, data]) => ({
  name: name as AdditiveName,
  ...data,
}));
