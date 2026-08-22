import React from 'react';
import { Header } from '../../components/common/Header';
import { ImageQuality } from '../../components/screening/ImageQuality';

export const QualityCheckPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header
        showBack
        title="Image Quality Assessment"
        subtitle="Step 2: Verification"
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <ImageQuality />
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        Arogya Lens • Clinical Image Quality Validation
      </footer>
    </div>
  );
};
