import { z } from 'zod';
import { additiveData } from './additive-data';

const additiveNames = Object.keys(additiveData) as [keyof typeof additiveData, ...(keyof typeof additiveData)[]];

export const formSchema = z.object({
  // User's farm data
  numberOfBroilers: z.coerce.number({ required_error: "Required" }).positive("Must be positive"),
  broilerWeight: z.coerce.number({ required_error: "Required" }).positive("Must be positive"),
  mortalityRate: z.coerce.number({ required_error: "Required" }).min(0, "Cannot be negative").max(100, "Cannot exceed 100"),
  fcr: z.coerce.number({ required_error: "Required" }).positive("Must be positive"),
  feedCostPerLw: z.coerce.number({ required_error: "Required" }).positive("Must be positive"),

  // Additive data
  additiveType: z.enum(additiveNames, { required_error: "Required" }),
  additiveInclusionRate: z.coerce.number({ required_error: "Required" }).positive("Must be positive"),
  additiveCost: z.coerce.number({ required_error: "Required" }).positive("Must be positive"),

  // Conditional field for Jefo Pro Solution
  jefoProApplicationType: z.enum(['matrix', 'on-top']).optional(),
}).refine(data => {
  if (data.additiveType === 'Jefo Pro Solution') {
    return data.jefoProApplicationType !== undefined;
  }
  return true;
}, {
  message: "Application type is required for Jefo Pro Solution",
  path: ['jefoProApplicationType'],
});


export type CalculationInput = z.infer<typeof formSchema>;

export interface CalculationOutput {
  baseline: {
    costPerKgLiveWeight: number;
    totalCost: number;
  };
  withAdditive: {
    costPerKgLiveWeight: number;
    totalCost: number;
    improvedFcr: number;
  };
  comparison: {
    totalCostSavings: number;
    roi: number;
    costReductionPercentage: number;
  };
}
