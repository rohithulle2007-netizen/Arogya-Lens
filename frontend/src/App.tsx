import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScreeningProvider } from './context/ScreeningContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScreeningProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
            <AppRoutes />
          </div>
        </ScreeningProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
