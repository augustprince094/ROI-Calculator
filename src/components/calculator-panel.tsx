"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { useState, useEffect } from "react";
import { Calculator, FolderOpen, Save, Trash2, Loader2 } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formSchema } from "@/lib/types";
import type { CalculationInput } from "@/lib/types";
import { Separator } from "./ui/separator";

const LOCAL_STORAGE_KEY = "broiler-roi-scenarios";

type CalculatorPanelProps = {
  onCalculate: (data: CalculationInput) => void;
  isCalculating: boolean;
};

const defaultValues: Partial<CalculationInput> = {
  numberOfBroilers: 10000,
  broilerWeight: 2.5,
  mortalityRate: 4,
  fcr: 1.6,
  feedPrice: 0.45,
  additiveInclusionRate: 500,
  additiveCost: 12,
  averageBroilerWeight: 2.4,
  averageMortalityRate: 5,
  averageFeedPrice: 0.48,
  averageAdditiveCost: 10,
};

export function CalculatorPanel({ onCalculate, isCalculating }: CalculatorPanelProps) {
  const form = useForm<CalculationInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Record<string, CalculationInput>>({});
  const [saveScenarioName, setSaveScenarioName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<string>("");

  useEffect(() => {
    try {
      const savedScenarios = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedScenarios) {
        setScenarios(JSON.parse(savedScenarios));
      }
    } catch (error) {
      console.error("Could not load scenarios from local storage.", error);
    }
  }, []);

  const saveToLocalStorage = (newScenarios: Record<string, CalculationInput>) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newScenarios));
      setScenarios(newScenarios);
    } catch (error) {
      console.error("Could not save scenarios to local storage.", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save scenario.",
      });
    }
  };

  const handleSaveScenario = () => {
    if (!saveScenarioName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Name",
        description: "Scenario name cannot be empty.",
      });
      return;
    }
    const newScenarios = { ...scenarios, [saveScenarioName]: form.getValues() };
    saveToLocalStorage(newScenarios);
    toast({
      title: "Scenario Saved",
      description: `"${saveScenarioName}" has been saved successfully.`,
    });
    setSaveScenarioName("");
  };

  const handleLoadScenario = (scenarioName: string) => {
    if (scenarios[scenarioName]) {
      form.reset(scenarios[scenarioName]);
      setSelectedScenario(scenarioName);
      toast({
        title: "Scenario Loaded",
        description: `"${scenarioName}" has been loaded.`,
      });
    }
  };

  const handleDeleteScenario = () => {
    if (selectedScenario && scenarios[selectedScenario]) {
      const { [selectedScenario]: _, ...remainingScenarios } = scenarios;
      saveToLocalStorage(remainingScenarios);
      setSelectedScenario("");
      toast({
        title: "Scenario Deleted",
        description: `"${selectedScenario}" has been deleted.`,
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Calculation Parameters</CardTitle>
        <CardDescription>
          Manage scenarios and input your data to start calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-background">
              <h3 className="font-semibold mb-2 text-foreground">Scenario Management</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select onValueChange={handleLoadScenario} value={selectedScenario}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Load a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(scenarios).length > 0 ? (
                      Object.keys(scenarios).map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No saved scenarios.</div>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Save className="h-4 w-4 mr-2"/>Save</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Save Scenario</DialogTitle>
                                <DialogDescription>Enter a name for your current set of parameters.</DialogDescription>
                            </DialogHeader>
                            <Input 
                                placeholder="e.g., Summer Flock 2024" 
                                value={saveScenarioName}
                                onChange={(e) => setSaveScenarioName(e.target.value)}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                <Button onClick={handleSaveScenario}>Save</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {selectedScenario && (
                        <Button variant="destructive" size="icon" onClick={handleDeleteScenario}><Trash2 className="h-4 w-4"/></Button>
                    )}
                </div>
              </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCalculate)} className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4 bg-card">
                     <h3 className="font-semibold text-foreground">Your Farm's Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField name="numberOfBroilers" label="Number of Broilers" form={form} />
                        <InputField name="broilerWeight" label="Broiler Weight (kg)" form={form} />
                        <InputField name="mortalityRate" label="Mortality Rate (%)" form={form} />
                        <InputField name="fcr" label="Feed Conversion Ratio (FCR)" form={form} />
                        <InputField name="feedPrice" label="Feed Price ($/kg)" form={form} />
                        <InputField name="additiveInclusionRate" label="Additive Inclusion (g/ton)" form={form} />
                        <InputField name="additiveCost" label="Additive Cost ($/kg)" form={form} />
                    </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4 bg-card">
                     <h3 className="font-semibold text-foreground">Market Average Data</h3>
                     <p className="text-sm text-muted-foreground -mt-2">Used for baseline comparison and AI suggestions.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField name="averageBroilerWeight" label="Avg. Broiler Weight (kg)" form={form} />
                        <InputField name="averageMortalityRate" label="Avg. Mortality Rate (%)" form={form} />
                        <InputField name="averageFeedPrice" label="Avg. Feed Price ($/kg)" form={form} />
                        <InputField name="averageAdditiveCost" label="Avg. Additive Cost ($/kg)" form={form} />
                    </div>
                </div>
              
              <Button type="submit" className="w-full" size="lg" disabled={isCalculating}>
                {isCalculating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Please wait...</>
                ) : (
                  <><Calculator className="mr-2 h-5 w-5" /> Calculate ROI</>
                )}
              </Button>
            </form>
          </Form>
        </div>
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
            render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                <Input type="number" step="any" placeholder={`Enter ${label.toLowerCase()}`} {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
    )
}
