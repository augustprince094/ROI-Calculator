"use client";

import { useState } from 'react';
import type { z } from 'zod';
import { Landmark, Feather } from 'lucide-react';

import type { CalculationInput, CalculationOutput, MatrixCalculationOutput } from '@/lib/types';
import { calculateRoi, calculateMatrixSavings } from '@/lib/calculator';
import { allAdditives } from '@/lib/additive-data';
import { getSmartSuggestions, type SmartSuggestionsInput } from '@/ai/flows/smart-suggestions';

import { CalculatorPanel } from '@/components/calculator-panel';
import { ResultsPanel } from '@/components/results-panel';
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [results, setResults] = useState<CalculationOutput | null>(null);
  const [matrixResults, setMatrixResults] = useState<MatrixCalculationOutput | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAdditive, setSelectedAdditive] = useState<string | null>(null);
  const [calculationMode, setCalculationMode] = useState<'roi' | 'matrix'>('roi');

  const handleCalculate = async (data: CalculationInput, fcrImprovement: number) => {
    setIsCalculating(true);
    setSuggestions(null);
    setResults(null);
    setMatrixResults(null);
    setShowResults(true);
    setSelectedAdditive(data.additiveType);

    const mode = data.applicationType === 'matrix' ? 'matrix' : 'roi';
    setCalculationMode(mode);

    if (mode === 'matrix') {
        const matrixCalcResults = calculateMatrixSavings(data);
        setMatrixResults(matrixCalcResults);
        // AI suggestions are not implemented for matrix view yet.
        setSuggestions("AI suggestions are available for the 'on-top' application analysis.");
    } else { // 'roi' mode
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
    }

    setIsCalculating(false);
  };

  return (
    <>
      <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-screen-2xl relative">
          <header className="mb-8 text-center pt-8">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Landmark className="h-10 w-10 text-primary" />
              <Feather className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
              Jefo ROI Calculator for Broilers
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
                matrixResults={matrixResults}
                calculationMode={calculationMode}
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
