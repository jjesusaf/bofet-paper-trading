'use client';

import React, { useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { useDictionary } from '@/providers/dictionary-provider';
import { useWallet } from '@/providers/WalletContext';

const ONBOARDING_PLAYBACK_ID = 'p2c9MIWT2agNAAbgu4HQHgLgOFAAoHWH3d2ihPIIMjg';
const ONBOARDING_POSTER_URL = `https://image.mux.com/${ONBOARDING_PLAYBACK_ID}/animated.gif?width=320&end=3`;

interface OnboardingWelcomeProps {
  onComplete: () => void;
}

type SurveyStep = 'source' | 'experience' | 'video';

type OnboardingSource =
  | 'search_engine'
  | 'friend_referral'
  | 'social_media'
  | 'crypto_community'
  | 'twitter'
  | 'youtube'
  | 'other';

type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'professional';

interface SourceOption {
  id: OnboardingSource;
  label: string;
}

interface ExperienceOption {
  id: ExperienceLevel;
  label: string;
  description: string;
}

export function OnboardingWelcome({ onComplete }: OnboardingWelcomeProps) {
  const { dict } = useDictionary();
  const { eoaAddress } = useWallet();
  const [currentStep, setCurrentStep] = useState<SurveyStep>('source');
  const [selectedSource, setSelectedSource] = useState<OnboardingSource | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to submit to Redis silently (fire and forget)
  const submitToRedis = async (questionName: 'source' | 'experience', answer: string) => {
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_name: questionName,
          answer: answer,
        }),
      });
    } catch (error) {
      // Log error but don't block user flow
      console.error('[Onboarding] Error submitting to Redis:', error);
    }
  };

  const sourceOptions: SourceOption[] = [
    {
      id: 'search_engine',
      label: (dict.onboarding?.source?.options as any)?.search_engine ?? 'Google Search',
    },
    {
      id: 'friend_referral',
      label: (dict.onboarding?.source?.options as any)?.friend_referral ?? 'De un amigo',
    },
    {
      id: 'social_media',
      label: (dict.onboarding?.source?.options as any)?.social_media ?? 'Blog o Artículo',
    },
    {
      id: 'crypto_community',
      label: (dict.onboarding?.source?.options as any)?.crypto_community ?? 'Comunidad Crypto',
    },
    {
      id: 'twitter',
      label: (dict.onboarding?.source?.options as any)?.twitter ?? 'X (Twitter)',
    },
    {
      id: 'youtube',
      label: (dict.onboarding?.source?.options as any)?.youtube ?? 'YouTube',
    },
    {
      id: 'other',
      label: (dict.onboarding?.source?.options as any)?.other ?? 'Otro',
    },
  ];

  const experienceOptions: ExperienceOption[] = [
    {
      id: 'beginner',
      label: (dict.onboarding as any)?.experience?.options?.beginner?.label ?? 'Nuevo en Mercados de Predicción',
      description: (dict.onboarding as any)?.experience?.options?.beginner?.description ?? 'Apenas estoy empezando con los mercados de predicción',
    },
    {
      id: 'intermediate',
      label: (dict.onboarding as any)?.experience?.options?.intermediate?.label ?? 'Algo de Experiencia',
      description: (dict.onboarding as any)?.experience?.options?.intermediate?.description ?? 'He operado en mercados de predicción antes',
    },
    {
      id: 'advanced',
      label: (dict.onboarding as any)?.experience?.options?.advanced?.label ?? 'Trader Experimentado',
      description: (dict.onboarding as any)?.experience?.options?.advanced?.description ?? 'Opero regularmente en mercados de predicción',
    },
    {
      id: 'professional',
      label: (dict.onboarding as any)?.experience?.options?.professional?.label ?? 'Profesional',
      description: (dict.onboarding as any)?.experience?.options?.professional?.description ?? 'Uso los mercados de predicción para trading profesional',
    },
  ];

  const getCurrentStepNumber = () => {
    if (currentStep === 'source') return 1;
    if (currentStep === 'experience') return 2;
    return 3;
  };

  const TOTAL_STEPS = 3;
  const getProgressPercentage = () => {
    return (getCurrentStepNumber() / TOTAL_STEPS) * 100;
  };

  const handleNext = (nextStep: SurveyStep) => {
    // Submit answer when clicking "Next" from question 1, even if no selection was made
    if (currentStep === 'source') {
      const answerToSubmit = selectedSource || 'no_selection';
      submitToRedis('source', answerToSubmit);
    }
    
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsVisible(true);
    }, 200);
  };

  const handleSourceSelect = (source: OnboardingSource) => {
    setSelectedSource(source);
    
    // Submit to Redis immediately and silently (fire and forget)
    submitToRedis('source', source);
  };

  const handleExperienceSelect = (experience: ExperienceLevel) => {
    setSelectedExperience(experience);
    
    // Submit to Redis immediately and silently (fire and forget)
    submitToRedis('experience', experience);
  };

  const handleComplete = async () => {
    if (!selectedSource || !selectedExperience || isSaving || !eoaAddress) {
      return;
    }

    try {
      setIsSaving(true);

      // Submit experience answer when clicking "Complete" button
      submitToRedis('experience', selectedExperience);

      // Save onboarding completion to Redis
      const key = `app:user:onboarding:completed:${eoaAddress}`;
      const timestamp = new Date().toISOString();

      const response = await fetch("/api/redis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: key,
          value: timestamp,
        }),
      });

      if (response.ok) {
        console.log('[Onboarding] ✅ Onboarding completed saved to Redis:', {
          eoaAddress,
          timestamp,
        });
      } else {
        console.error('[Onboarding] Failed to save completion to Redis');
      }
    } catch (error) {
      console.error('[Onboarding] Error saving onboarding completion:', error);
      // Continue anyway - don't block the user experience
    } finally {
      setIsSaving(false);
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  };

  return (
    <div data-testid="onboarding-modal" className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div
        className={`w-full max-w-2xl transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      >
        {currentStep === 'source' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-6 sm:px-8 sm:py-8 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bofet_logo.svg" alt="Bofet Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dict.onboarding?.welcome?.title ?? 'Bienvenido a Bofet'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {(dict.onboarding?.welcome as any)?.subtitle ?? 'Configuremos tu cuenta'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#00C805] to-[#00C805] transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {((dict.onboarding?.welcome as any)?.progressLabel ?? '{{current}} de {{total}}')
                    .replace('{{current}}', getCurrentStepNumber().toString())
                    .replace('{{total}}', TOTAL_STEPS.toString())}
                </span>
              </div>
            </div>

            {/* Content - Scrollable area */}
            <div className="px-6 py-0 sm:px-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {dict.onboarding?.source?.title ?? '¿Cómo nos conociste?'}
              </h2>
              <p className="text-gray-600 mb-8">
                {dict.onboarding?.source?.description ?? 'Ayúdanos a entender cómo descubriste nuestra plataforma.'}
              </p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {sourceOptions.map((option) => (
                  <button
                    key={option.id + option.label}
                    onClick={() => handleSourceSelect(option.id)}
                    className={`w-full flex flex-row items-center justify-start gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedSource === option.id
                        ? 'border-[#00C805] bg-[#00C805]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedSource === option.id
                          ? 'border-[#00C805]'
                          : 'border-gray-300'
                        }`}
                    >
                      {selectedSource === option.id && (
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#00C805]" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation - Fixed at bottom */}
            <div className="px-6 py-4 sm:px-8 sm:py-6 shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={() => handleNext('experience')}
                  disabled={!selectedSource}
                  className="px-8 py-3 bg-linear-to-r from-[#00C805] to-[#00C805] text-white font-medium rounded-lg hover:from-[#009904] hover:to-[#009904] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {(dict.onboarding?.source as any)?.next ?? 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'experience' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-6 sm:px-8 sm:py-8 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bofet_logo.svg" alt="Bofet Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dict.onboarding?.welcome?.title ?? 'Bienvenido a Bofet'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {(dict.onboarding?.welcome as any)?.subtitle ?? 'Configuremos tu cuenta'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#00C805] to-[#00C805] transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {((dict.onboarding?.welcome as any)?.progressLabel ?? '{{current}} de {{total}}')
                    .replace('{{current}}', getCurrentStepNumber().toString())
                    .replace('{{total}}', TOTAL_STEPS.toString())}
                </span>
              </div>
            </div>

            {/* Content - Scrollable area */}
            <div className="px-6 py-0 sm:px-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {(dict.onboarding as any)?.experience?.title ?? '¿Cuál es tu nivel de experiencia?'}
              </h2>
              <p className="text-gray-600 mb-8">
                {(dict.onboarding as any)?.experience?.description ?? 'Selecciona la opción que mejor describa tu experiencia en trading.'}
              </p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {experienceOptions.map((option) => (
                  <button
                    key={option.id + option.label}
                    onClick={() => handleExperienceSelect(option.id)}
                    className={`w-full flex flex-row items-start justify-start gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedExperience === option.id
                        ? 'border-[#00C805] bg-[#00C805]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedExperience === option.id
                          ? 'border-[#00C805]'
                          : 'border-gray-300'
                        }`}
                    >
                      {selectedExperience === option.id && (
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#00C805]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-0.5 sm:mb-1 text-xs sm:text-sm leading-tight">{option.label}</div>
                      <p className="text-xs text-gray-600 hidden sm:block leading-tight">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation - Fixed at bottom */}
            <div className="px-6 py-4 sm:px-8 sm:py-6 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => handleNext('source')}
                  className="px-6 py-3 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  {(dict.onboarding as any)?.experience?.back ?? 'Anterior'}
                </button>
                <button
                  onClick={() => handleNext('video')}
                  disabled={!selectedExperience}
                  className="px-8 py-3 bg-linear-to-r from-[#00C805] to-[#00C805] text-white font-medium rounded-lg hover:from-[#009904] hover:to-[#009904] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {(dict.onboarding?.source as any)?.next ?? 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'video' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <style>{`
              .onboarding-video-player mux-player::part(center-play-button) {
                display: none;
              }
            `}</style>
            {/* Header */}
            <div className="px-6 py-6 sm:px-8 sm:py-8 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bofet_logo.svg" alt="Bofet Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dict.onboarding?.welcome?.title ?? 'Bienvenido a Bofet'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {(dict.onboarding?.welcome as any)?.subtitle ?? 'Configuremos tu cuenta'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#00C805] to-[#00C805] transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {((dict.onboarding?.welcome as any)?.progressLabel ?? '{{current}} de {{total}}')
                    .replace('{{current}}', getCurrentStepNumber().toString())
                    .replace('{{total}}', TOTAL_STEPS.toString())}
                </span>
              </div>
            </div>

            {/* Content - Scrollable area */}
            <div className="px-6 py-0 sm:px-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {(dict.onboarding as any)?.video?.title ?? 'Mira una introducción rápida'}
              </h2>
              <p className="text-gray-600 mb-6">
                {(dict.onboarding as any)?.video?.description ?? 'Aprende cómo hacer tu primera predicción en Bofet.'}
              </p>
              <div className="onboarding-video-player w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
                <MuxPlayer
                  playbackId={ONBOARDING_PLAYBACK_ID}
                  poster={ONBOARDING_POSTER_URL}
                  metadata={{ video_title: 'Onboarding Video' }}
                  style={{ aspectRatio: '16/9', width: '100%' }}
                  streamType="on-demand"
                  paused={!isVisible}
                />
              </div>
            </div>

            {/* Navigation - Single Continue button */}
            <div className="px-6 py-4 sm:px-8 sm:py-6 shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="px-8 py-3 bg-linear-to-r from-[#00C805] to-[#00C805] text-white font-medium rounded-lg hover:from-[#009904] hover:to-[#009904] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isSaving
                    ? ((dict.onboarding as any)?.experience?.saving ?? 'Guardando...')
                    : ((dict.onboarding as any)?.video?.continue ?? (dict.onboarding?.source as any)?.next ?? 'Continuar')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
