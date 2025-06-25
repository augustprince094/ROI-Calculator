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
  
  // Matrix specific prices
  cornPrice: z.coerce.number({ invalid_type_error: "Required" }).positive("Must be positive").optional(),
  soybeanPrice: z.coerce.number({ invalid_type_error: "Required" }).positive("Must be positive").optional(),

  // Conditional field for Jefo Pro Solution & Belfeed
  applicationType: z.enum(['matrix', 'on-top']).optional(),
}).superRefine((data, ctx) => {
  const isMatrixApplicable = data.additiveType === 'Jefo Pro Solution' || data.additiveType === 'Belfeed';

  if (isMatrixApplicable) {
    if (!data.applicationType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Application type is required for this additive",
        path: ['applicationType'],
      });
    }
    
    if (data.applicationType === 'matrix') {
      if (!data.cornPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for matrix calculation",
          path: ['cornPrice'],
        });
      }
      if (!data.soybeanPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for matrix calculation",
          path: ['soybeanPrice'],
        });
      }
    }
  }
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

export interface MatrixCalculationOutput {
  savingsPerTon: number;
}
