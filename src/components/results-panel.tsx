"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Percent, TrendingUp, Lightbulb, LineChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalculationOutput } from "@/lib/types";
import { cn } from "@/lib/utils";

type ResultsPanelProps = {
  results: CalculationOutput | null;
  suggestions: string | null;
  isCalculating: boolean;
  showResults: boolean;
};

export function ResultsPanel({ results, suggestions, isCalculating, showResults }: ResultsPanelProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (value === Infinity) return "∞ %";
    return `${value.toFixed(2)} %`;
  };

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
          ) : results ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard 
                    icon={DollarSign}
                    title="Cost / kg Live Weight"
                    value={formatCurrency(results.costPerKgLiveWeight)}
                    isPositive={false}
                />
                <MetricCard 
                    icon={TrendingUp}
                    title="Total Cost Savings"
                    value={formatCurrency(results.totalCostSavings)}
                    isPositive={results.totalCostSavings > 0}
                />
                <MetricCard 
                    icon={Percent}
                    title="Return on Investment (ROI)"
                    value={formatPercent(results.roi)}
                    isPositive={results.roi > 0}
                />
            </div>
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
    const valueColorClass = isPositive ? "text-accent-foreground" : "text-destructive";

    return (
        <div className="p-4 border rounded-lg flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="p-1.5 bg-muted rounded-md">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
                <p className={cn(
                    "text-3xl font-bold tracking-tight",
                    isPositive && "text-green-600",
                    !isPositive && Number(value.replace(/[^0-9.-]+/g,"")) < 0 && "text-red-600",
                )}>
                    {value}
                </p>
            </div>
        </div>
    )
}
