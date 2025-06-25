
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { Calculator, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formSchema } from "@/lib/types";
import type { CalculationInput } from "@/lib/types";
import { additiveData, type AdditiveName } from "@/lib/additive-data";
import { cn } from "@/lib/utils";

type CalculatorPanelProps = {
  onCalculate: (data: CalculationInput, fcrImprovement: number) => void;
  isCalculating: boolean;
};

const defaultValues: Partial<CalculationInput> = {
  numberOfBroilers: 10000,
  broilerWeight: 2.5,
  mortalityRate: 4,
  fcr: 1.6,
  feedCostPerLw: 0.72,
  additiveType: "Jefo Pro Solution",
  additiveInclusionRate: 125,
  additiveCost: 12,
  applicationType: 'on-top',
};

export function CalculatorPanel({ onCalculate, isCalculating }: CalculatorPanelProps) {
  const form = useForm<CalculationInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const selectedAdditive = form.watch("additiveType");
  const selectedApplicationType = form.watch("applicationType");

  const onSubmit = (data: CalculationInput) => {
    const fcrImprovement = additiveData[data.additiveType as AdditiveName].fcrImprovement;
    onCalculate(data, fcrImprovement);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Calculation Parameters</CardTitle>
        <CardDescription>
          Input your data to start calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 border rounded-lg space-y-4 bg-card">
                  <h3 className="font-semibold text-foreground">Your Farm's Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField name="numberOfBroilers" label="Number of birds per production cycle" form={form} />
                      <InputField name="broilerWeight" label="Broiler Weight (kg)" form={form} />
                      <InputField name="mortalityRate" label="Mortality Rate (%)" form={form} />
                      <InputField name="fcr" label="Baseline FCR" form={form} />
                      <InputField name="feedCostPerLw" label="Feed Cost ($/kg live weight)" form={form} />
                  </div>
              </div>

              <div className="p-4 border rounded-lg space-y-4 bg-card">
                    <h3 className="font-semibold text-foreground">Jefo Solutions</h3>
                    
                    <FormField
                        control={form.control}
                        name="additiveType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Additive Type</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    const data = additiveData[value as keyof typeof additiveData];
                                    if (data) {
                                        form.setValue("additiveInclusionRate", data.inclusionRate);
                                        form.setValue("additiveCost", data.cost);
                                    }
                                    if (value === 'Jefo Pro Solution' || value === 'Belfeed') {
                                      form.setValue('applicationType', form.getValues('applicationType') || 'on-top');
                                    } else {
                                      form.setValue('applicationType', undefined);
                                      form.clearErrors('applicationType');
                                    }
                                }}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an additive" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.keys(additiveData).map((name) => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    {(selectedAdditive === "Jefo Pro Solution" || selectedAdditive === "Belfeed") && (
                        <div className="animate-in fade-in-50 duration-300">
                            <FormField
                                control={form.control}
                                name="applicationType"
                                render={({ field }) => (
                                <FormItem className="space-y-2 pt-2">
                                    <FormLabel>Application Type</FormLabel>
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex items-center space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="on-top" /></FormControl>
                                            <FormLabel className="font-normal cursor-pointer">On-top</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="matrix" /></FormControl>
                                            <FormLabel className="font-normal cursor-pointer">Matrix</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <div className={cn(
                        "space-y-4 pt-2 animate-in fade-in-50 duration-300",
                        selectedApplicationType === 'matrix' && "hidden"
                    )}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField name="additiveInclusionRate" label="Additive Inclusion (g/ton)" form={form} />
                          <InputField name="additiveCost" label="Additive Cost ($/kg)" form={form} />
                        </div>
                    </div>
              </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={isCalculating}>
              {isCalculating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Please wait...</>
              ) : (
                <><Calculator className="mr-2 h-5 w-5" /> Calculate</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Helper component for form fields to reduce repetition
type InputFieldProps = {
    name: keyof CalculationInput;
    label: string;
    form: UseFormReturn<CalculationInput>;
}

function InputField({name, label, form}: InputFieldProps) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => {
              const value = field.value === null || field.value === undefined ? "" : field.value;
              return (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                    <Input 
                      type="number" 
                      step="any" 
                      placeholder={`Enter ${label.toLowerCase()}`} 
                      {...field} 
                      value={value}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )
            }}
        />
    )
}
