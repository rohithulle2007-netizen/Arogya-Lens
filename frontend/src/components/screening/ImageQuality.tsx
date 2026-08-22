import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ArrowRight, Eye, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useScreening } from '../../context/ScreeningContext';
import { mockScreeningService } from '../../services/mocks/mockScreeningService';

export const ImageQuality: React.FC = () => {
  const navigate = useNavigate();
  const {
    capturedImage,
    qualityResult,
    isProcessingQuality,
    runQualityCheck,
    runScreeningAnalysis,
    resetScreening,
  } = useScreening();

  const [simulatedStep, setSimulatedStep] = useState(0);

  useEffect(() => {
    // If no image, redirect back to scanner
    if (!capturedImage) {
      navigate('/scanner', { replace: true });
      return;
    }

    let isMounted = true;
    const performCheck = async () => {
      // Step animation sequence
      setTimeout(() => isMounted && setSimulatedStep(1), 300);
      setTimeout(() => isMounted && setSimulatedStep(2), 600);
      setTimeout(() => isMounted && setSimulatedStep(3), 900);
      setTimeout(() => isMounted && setSimulatedStep(4), 1200);

      const res = await runQualityCheck();
      if (res && res.image_quality === 'good') {
        // Automatically start screening analysis
        setTimeout(async () => {
          if (isMounted) {
            await runScreeningAnalysis();
            navigate('/screening/result');
          }
        }, 1100);
      }
    };

    performCheck();

    return () => {
      isMounted = false;
    };
  }, [capturedImage]);

  const handleRetake = () => {
    resetScreening();
    navigate('/scanner');
  };

  const handleForceQualityToggle = async (mode: 'good' | 'poor') => {
    mockScreeningService.setQualityMode(mode);
    setSimulatedStep(0);
    const res = await runQualityCheck();
    if (res && res.image_quality === 'good') {
      await runScreeningAnalysis();
      navigate('/screening/result');
    }
  };

  const isGood = qualityResult?.image_quality === 'good';
  const isPoor = qualityResult?.image_quality === 'poor';

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5">
      {/* Captured Image Preview card */}
      <div className="relative w-full aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-200">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured Palpebral Conjunctiva"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            No image captured
          </div>
        )}

        {/* Scan line effect during check */}
        {isProcessingQuality && (
          <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[1px] flex flex-col justify-between p-3 pointer-events-none">
            <div className="h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scan-line" />
            <div className="self-center bg-black/75 text-teal-300 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing conjunctival exposure...</span>
            </div>
          </div>
        )}

        {/* Quality status tag */}
        {qualityResult && (
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${
                isGood
                  ? 'bg-emerald-500/90 text-white border border-emerald-300'
                  : 'bg-rose-500/90 text-white border border-rose-300'
              }`}
            >
              {isGood ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {isGood ? 'Quality Verified' : 'Quality Insufficient'}
            </span>
          </div>
        )}
      </div>

      {/* Quality Checks Checklist Card */}
      <Card className="text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Image Quality Verification</h3>
            <p className="text-xs text-slate-500">Checking clinical visibility metrics</p>
          </div>
          {qualityResult?.quality_score && (
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Score</span>
              <p className={`text-base font-bold ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Math.round(qualityResult.quality_score * 100)}%
              </p>
            </div>
          )}
        </div>

        {/* 4 Core Verification Criteria */}
        <div className="space-y-2.5">
          {/* 1. Eye visibility */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-800">Eye Visibility</span>
            </div>
            {simulatedStep >= 1 ? (
              <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Passed
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Checking...</span>
            )}
          </div>

          {/* 2. Image Sharpness */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-800">Image Sharpness & Focus</span>
            </div>
            {simulatedStep >= 2 ? (
              qualityResult?.checks?.sharpness ?? true ? (
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Clear
                </span>
              ) : (
                <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Blurry
                </span>
              )
            ) : (
              <span className="text-xs text-slate-400 font-medium">Checking...</span>
            )}
          </div>

          {/* 3. Lighting */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-800">Lighting & Glare Uniformity</span>
            </div>
            {simulatedStep >= 3 ? (
              qualityResult?.checks?.lighting ?? true ? (
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Adequate
                </span>
              ) : (
                <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Poor Light
                </span>
              )
            ) : (
              <span className="text-xs text-slate-400 font-medium">Checking...</span>
            )}
          </div>

          {/* 4. Conjunctiva Visibility */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-800">Palpebral Conjunctiva Exposure</span>
            </div>
            {simulatedStep >= 4 ? (
              qualityResult?.checks?.conjunctiva_visible ?? true ? (
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Exposed
                </span>
              ) : (
                <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Obscured
                </span>
              )
            ) : (
              <span className="text-xs text-slate-400 font-medium">Checking...</span>
            )}
          </div>
        </div>

        {/* Poor Quality Notice */}
        {isPoor && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Image quality is insufficient.
            </p>
            <p className="text-rose-700 leading-relaxed">
              {qualityResult?.message ||
                'The conjunctival region could not be resolved clearly. Please retake under better lighting and pull down the lower eyelid gently.'}
            </p>
          </div>
        )}

        {/* Good Quality Progress Indicator */}
        {isGood && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Image verified. Transitioning to Anaemia Screening Estimation...</span>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2.5">
        {isPoor && (
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={handleRetake}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retake Scan
          </Button>
        )}

        {isGood && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/screening/result')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            View Screening Result
          </Button>
        )}

        {/* Quick Demo Mode Switcher */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
          <span>Test mock quality:</span>
          <button
            onClick={() => handleForceQualityToggle('good')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
              mockScreeningService.getQualityMode() === 'good'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Pass (Good)
          </button>
          <button
            onClick={() => handleForceQualityToggle('poor')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
              mockScreeningService.getQualityMode() === 'poor'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Fail (Poor)
          </button>
        </div>
      </div>
    </div>
  );
};
