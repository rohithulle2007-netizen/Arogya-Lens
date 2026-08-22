import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historyService } from '../../services/api/historyService';
import { ScreeningRecord } from '../../types/health';
import { AppLayout } from '../../components/navigation/AppLayout';
import { ScreeningDetailsView } from '../../components/screeningDetails/ScreeningDetailsView';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ScreeningDetailPage: React.FC = () => {
  const { screeningId } = useParams<{ screeningId: string }>();
  const navigate = useNavigate();
  const [screening, setScreening] = useState<ScreeningRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!screeningId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await historyService.getScreeningById(screeningId);
        if (data) {
          setScreening(data);
        } else {
          setError(`Screening with ID "${screeningId}" could not be found.`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load screening details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [screeningId]);

  return (
    <AppLayout subtitle="Assessment Details" showBack onBack={() => navigate('/history')}>
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-600 mt-2">Loading assessment...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <p className="text-xs font-bold text-rose-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/history')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mx-auto"
          >
            Back to History
          </Button>
        </div>
      )}

      {!isLoading && screening && (
        <ScreeningDetailsView screening={screening} onBack={() => navigate('/history')} />
      )}
    </AppLayout>
  );
};
