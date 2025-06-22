"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronsDown, Percent, TrendingUp, Lightbulb, LineChart, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalculationOutput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { additiveData, type AdditiveName } from "@/lib/additive-data";


type ResultsPanelProps = {
  results: CalculationOutput | null;
  suggestions: string | null;
  isCalculating: boolean;
  showResults: boolean;
  additiveType: string | null;
};

export function ResultsPanel({ results, suggestions, isCalculating, showResults, additiveType }: ResultsPanelProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    if (value === Infinity) return "∞ %";
    return `${value.toFixed(2)} %`;
  };

  const baselineColor = "#AEAEAE";
  const additiveColor = additiveType ? additiveData[additiveType as AdditiveName].color : "hsl(var(--primary))";

  const chartData = results ? [
    { name: 'Baseline', 'Cost/kg': results.baseline.costPerKgLiveWeight.toFixed(3), fill: baselineColor },
    { name: additiveType || 'With Additive', 'Cost/kg': results.withAdditive.costPerKgLiveWeight.toFixed(3), fill: additiveColor },
  ] : [];

  const chartConfig = {
    "Cost/kg": {
      label: "Cost/kg",
    },
  }

  if (!showResults) {
    return (
        <Card className="shadow-lg flex items-center justify-center min-h-[400px] lg:min-h-full">
            <div className="text-center text-muted-foreground">
                <LineChart className="h-12 w-12 mx-auto mb-4"/>
                <h3 className="text-xl font-semibold">Your Results Await</h3>
                <p>Enter your data and click "Calculate" to see your financial metrics.</p>
            </div>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg animate-in fade-in-50 duration-500">
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>
            Here is the financial breakdown based on your inputs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCalculating && !results ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
          ) : results ? (
            <>
            <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Cost per kg Live Weight Comparison</h4>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                formatter={(value) => formatCurrency(Number(value))}
                                />}
                         />
                        <Bar dataKey="Cost/kg" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    icon={TrendingDown}
                    title="Improved FCR"
                    value={parseFloat(results.withAdditive.improvedFcr.toFixed(2)).toString()}
                    isPositive={true} // Lower FCR is better
                />
                 <MetricCard 
                    icon={ChevronsDown}
                    title="Cost Reduction"
                    value={formatPercent(results.comparison.costReductionPercentage)}
                    isPositive={results.comparison.costReductionPercentage > 0}
                />
                <MetricCard 
                    icon={TrendingUp}
                    title="Total Cost Savings"
                    value={formatCurrency(results.comparison.totalCostSavings)}
                    isPositive={results.comparison.totalCostSavings > 0}
                />
                <MetricCard 
                    icon={Percent}
                    title="Return on Investment (ROI)"
                    value={formatPercent(results.comparison.roi)}
                    isPositive={results.comparison.roi > 0}
                />
            </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {(isCalculating || suggestions) && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500 delay-150">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500"/>
                    <CardTitle>Smart Suggestions</CardTitle>
                </div>
                <CardDescription>
                    AI-powered insights to help optimize your farming practices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isCalculating && !suggestions ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ) : suggestions ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{suggestions}</p>
                ) : null}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

type MetricCardProps = {
    icon: React.ElementType;
    title: string;
    value: string;
    isPositive: boolean;
}

function MetricCard({ icon: Icon, title, value, isPositive }: MetricCardProps) {
    return (
        <div className="p-4 border rounded-lg flex flex-col justify-between bg-card">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="p-1.5 bg-muted rounded-md">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
                <p className={cn(
                    "text-3xl font-bold tracking-tight",
                     isPositive ? "text-green-600" : "text-red-600",
                )}>
                    {value}
                </p>
            </div>
        </div>
    )
}
