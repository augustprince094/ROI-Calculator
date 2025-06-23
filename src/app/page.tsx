"use client";

import { useState } from 'react';
import type { z } from 'zod';

import type { CalculationInput, CalculationOutput } from '@/lib/types';
import { calculateRoi } from '@/lib/calculator';
import { allAdditives } from '@/lib/additive-data';
import { getSmartSuggestions, type SmartSuggestionsInput } from '@/ai/flows/smart-suggestions';

import { CalculatorPanel } from '@/components/calculator-panel';
import { ResultsPanel } from '@/components/results-panel';
import { Toaster } from "@/components/ui/toaster";
import { Leaf, Rss } from 'lucide-react';

export default function Home() {
  const [results, setResults] = useState<CalculationOutput | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAdditive, setSelectedAdditive] = useState<string | null>(null);

  const handleCalculate = async (data: CalculationInput, fcrImprovement: number) => {
    setIsCalculating(true);
    setSuggestions(null);
    setShowResults(true);
    setSelectedAdditive(data.additiveType);

    const calculatedResults = calculateRoi(data, fcrImprovement);
    setResults(calculatedResults);

    try {
      const aiInput: SmartSuggestionsInput = {
        additiveType: data.additiveType,
        feedCostPerLw: data.feedCostPerLw,
        broilerWeight: data.broilerWeight,
        mortalityRate: data.mortalityRate,
        baselineFcr: data.fcr,
        currentFcr: calculatedResults.withAdditive.improvedFcr,
        allAdditives: allAdditives,
      };
      const aiResult = await getSmartSuggestions(aiInput);
      setSuggestions(aiResult.suggestions);
    } catch (error) {
      console.error("Error fetching smart suggestions:", error);
      setSuggestions("Could not retrieve AI suggestions at this time. Please try again later.");
    }

    setIsCalculating(false);
  };

  return (
    <>
      <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-screen-2xl relative">
          <header className="mb-8 text-center pt-8">
            <div className="inline-flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Rss className="h-8 w-8 text-primary" />
                </div>
                 <div className="p-2 bg-accent/20 rounded-lg">
                    <Leaf className="h-8 w-8 text-accent-foreground" />
                </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
              Jefo ROI Optimizer for Broilers
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Calculate ROI and cost per kg live weight for your broiler flock when using feed additives. Get smart insights to boost your profitability.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8 space-y-8 lg:space-y-0">
            <div className="lg:col-span-2">
              <CalculatorPanel onCalculate={handleCalculate} isCalculating={isCalculating} />
            </div>
            <div className="lg:col-span-3">
              <ResultsPanel 
                results={results}
                suggestions={suggestions} 
                isCalculating={isCalculating}
                showResults={showResults}
                additiveType={selectedAdditive}
              />
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}
