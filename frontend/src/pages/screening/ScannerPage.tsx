import React from 'react';
import { Header } from '../../components/common/Header';
import { EyeScanner } from '../../components/screening/EyeScanner';

export const ScannerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      <Header
        showBack
        title="Position conjunctiva in frame"
        subtitle="Step 1: Eye Scanner"
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        <EyeScanner />
      </main>

      <footer className="py-3 text-center text-[11px] text-slate-500">
        Align eye inside frame until border turns green
      </footer>
    </div>
  );
};
