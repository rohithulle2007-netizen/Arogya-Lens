import React from 'react';
import { Header } from '../../components/common/Header';
import { ScreeningResult } from '../../components/screening/ScreeningResult';

export const ResultPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header
        showBack
        title="Anaemia Screening Estimation"
        subtitle="Step 3: Screening Analysis"
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <ScreeningResult />
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        Arogya Lens • Non-Invasive Healthcare Screening
      </footer>
    </div>
  );
};
