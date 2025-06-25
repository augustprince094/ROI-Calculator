"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgePercent, PiggyBank, Target, TrendingUp, Lightbulb, LineChart, DollarSign, Database, Scales } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalculationOutput, MatrixCalculationOutput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { additiveData, type AdditiveName } from "@/lib/additive-data";
import { feedIngredients } from "@/lib/calculator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


type ResultsPanelProps = {
  results: CalculationOutput | null;
  matrixResults: MatrixCalculationOutput | null;
  calculationMode: 'roi' | 'matrix';
  suggestions: string | null;
  isCalculating: boolean;
  showResults: boolean;
  additiveType: string | null;
};

const formatCurrency = (value: number, digits: number = 2) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value);
};

const formatPercent = (value: number) => {
    if (value === Infinity) return "∞ %";
    return `${value.toFixed(1)} %`;
};

const formatRatio = (percentage: number) => {
    if (percentage === Infinity) {
        return "∞ : 1";
    }
    const ratio = percentage / 100;
    return `${ratio.toFixed(1)} : 1`;
};

export function ResultsPanel(props: ResultsPanelProps) {
  const { showResults, isCalculating, calculationMode, results, matrixResults } = props;

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

  if (isCalculating) {
    return (
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-3/5" />
                    <Skeleton className="h-4 w-4/5" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {calculationMode === 'roi' && results && <RoiResultsView {...props} />}
      {calculationMode === 'matrix' && matrixResults && <MatrixResultsView {...props} />}

      {(isCalculating || props.suggestions) && (
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
                {isCalculating && !props.suggestions ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ) : props.suggestions ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{props.suggestions}</p>
                ) : null}
            </CardContent>
        </Card>
      )}
    </div>
  );
}


function RoiResultsView({ results, additiveType }: Pick<ResultsPanelProps, 'results' | 'additiveType'>) {
    const baselineColor = "#AEAEAE";
    const additiveColor = (additiveType && additiveData[additiveType as AdditiveName]?.color) || "hsl(var(--primary))";

    const chartData = results ? [
        { name: 'Baseline', 'Cost/kg': results.baseline.costPerKgLiveWeight, fill: baselineColor },
        { name: additiveType || 'With Additive', 'Cost/kg': results.withAdditive.costPerKgLiveWeight, fill: additiveColor },
    ] : [];

    const chartConfig = {
      'Cost/kg': {
        label: 'Cost/kg',
      },
    } satisfies ChartConfig;

    return (
        <Card className="shadow-lg animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle>Cost per broiler live weight comparison</CardTitle>
                <CardDescription>Financial breakdown comparing baseline to additive use.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Cost per broiler live weight comparison</h4>
                     <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value), 2)} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                                content={<ChartTooltipContent 
                                    formatter={(value) => formatCurrency(Number(value), 2)}
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
                    <MetricCard icon={Target} title="Improved FCR" value={parseFloat(results!.withAdditive.improvedFcr.toFixed(2)).toString()} isPositive={true} />
                    <MetricCard icon={BadgePercent} title="Cost Reduction" value={formatPercent(results!.comparison.costReductionPercentage)} isPositive={results!.comparison.costReductionPercentage > 0} />
                    <MetricCard icon={PiggyBank} title="Total Cost Savings" value={formatCurrency(results!.comparison.totalCostSavings, 0)} isPositive={results!.comparison.totalCostSavings > 0} />
                    <MetricCard icon={TrendingUp} title="Return on Investment (ROI)" value={formatRatio(results!.comparison.roi)} isPositive={results!.comparison.roi > 0} />
                </div>
            </CardContent>
        </Card>
    );
}

function MatrixResultsView({ matrixResults, additiveType }: Pick<ResultsPanelProps, 'matrixResults' | 'additiveType'>) {
    const additiveColor = (additiveType && additiveData[additiveType as AdditiveName]?.color) || "hsl(var(--primary))";

    const chartData = matrixResults ? [
        { name: "Savings", value: matrixResults.savingsPerTon, fill: additiveColor }
    ] : [];

    const chartConfig = {
      value: {
        label: "Savings",
        color: additiveColor,
      },
    } satisfies ChartConfig;
    
    return (
        <Card className="shadow-lg animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle>Feed Cost Savings (Matrix Application)</CardTitle>
                <CardDescription>Estimated savings from reformulating feed with the selected additive.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Savings per ton of feed</h4>
                     <ChartContainer config={chartConfig} className="w-full h-[250px]">
                        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))}/>
                            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                                content={<ChartTooltipContent 
                                    formatter={(value) => formatCurrency(Number(value), 2)}
                                    />}
                             />
                            <Bar dataKey="value" name="Savings per Ton" radius={[0, 4, 4, 0]} barSize={60}>
                                <Cell fill={additiveColor} />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>
                <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-2">Baseline Feed Composition</h4>
                    <p className="text-sm text-muted-foreground mb-4">Based on a 1-ton (1000kg) formulation.</p>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Ingredient</TableHead>
                                    <TableHead className="text-right">Quantity (kg)</TableHead>
                                    <TableHead className="text-right">Price ($/ton)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedIngredients.map((ing) => (
                                    <TableRow key={ing.name}>
                                        <TableCell className="font-medium">{ing.name}</TableCell>
                                        <TableCell className="text-right">{ing.quantityKg.toFixed(1)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(ing.pricePerTon, 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                        icon={Database}
                        title="Baseline Cost / Ton"
                        value={formatCurrency(matrixResults!.baselineCostPerTon)}
                    />
                    <MetricCard 
                        icon={DollarSign}
                        title="Savings per ton of feed"
                        value={formatCurrency(matrixResults!.savingsPerTon)}
                        isPositive={matrixResults!.savingsPerTon > 0}
                    />
                     <MetricCard 
                        icon={PiggyBank}
                        title="Savings per production cycle"
                        value={formatCurrency(matrixResults!.savingsPerCycle, 0)}
                        isPositive={matrixResults!.savingsPerCycle > 0}
                    />
                     <MetricCard 
                        icon={TrendingUp}
                        title="Return on Investment (ROI)"
                        value={formatRatio(matrixResults!.roi)}
                        isPositive={matrixResults!.roi > 0}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

type MetricCardProps = {
    icon: React.ElementType;
    title: string;
    value: string;
    isPositive?: boolean;
};

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
                     isPositive === true && "text-green-600",
                     isPositive === false && "text-red-600"
                )}>
                    {value}
                </p>
            </div>
        </div>
    );
}
