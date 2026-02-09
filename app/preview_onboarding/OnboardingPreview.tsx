'use client';

import React, { useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { useDictionary } from '@/providers/dictionary-provider';

const PLAYBACK_ID = 'p2c9MIWT2agNAAbgu4HQHgLgOFAAoHWH3d2ihPIIMjg';
const POSTER_URL = `https://image.mux.com/${PLAYBACK_ID}/animated.gif?width=320&end=3`;

type Step = 'source' | 'experience' | 'video';
type SourceId = 'search_engine' | 'friend_referral' | 'social_media' | 'crypto_community' | 'twitter' | 'youtube' | 'other';
type ExperienceId = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export function OnboardingPreview() {
  const { dict } = useDictionary();
  const [currentStep, setCurrentStep] = useState<Step>('source');
  const [selectedSource, setSelectedSource] = useState<SourceId | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceId | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [done, setDone] = useState(false);

  const TOTAL_STEPS = 3;
  const getStepNumber = () => (currentStep === 'source' ? 1 : currentStep === 'experience' ? 2 : 3);
  const getProgress = () => (getStepNumber() / TOTAL_STEPS) * 100;

  const sourceOptions = [
    { id: 'search_engine' as const, label: (dict.onboarding?.source?.options as any)?.search_engine ?? 'Google Search' },
    { id: 'friend_referral' as const, label: (dict.onboarding?.source?.options as any)?.friend_referral ?? 'De un amigo' },
    { id: 'social_media' as const, label: (dict.onboarding?.source?.options as any)?.social_media ?? 'Blog o Artículo' },
    { id: 'crypto_community' as const, label: (dict.onboarding?.source?.options as any)?.crypto_community ?? 'Comunidad Crypto' },
    { id: 'twitter' as const, label: (dict.onboarding?.source?.options as any)?.twitter ?? 'X (Twitter)' },
    { id: 'youtube' as const, label: (dict.onboarding?.source?.options as any)?.youtube ?? 'YouTube' },
    { id: 'other' as const, label: (dict.onboarding?.source?.options as any)?.other ?? 'Otro' },
  ];

  const experienceOptions = [
    { id: 'beginner' as const, label: (dict.onboarding as any)?.experience?.options?.beginner?.label ?? 'Nuevo en Mercados de Predicción', description: (dict.onboarding as any)?.experience?.options?.beginner?.description ?? 'Apenas estoy empezando con los mercados de predicción' },
    { id: 'intermediate' as const, label: (dict.onboarding as any)?.experience?.options?.intermediate?.label ?? 'Algo de Experiencia', description: (dict.onboarding as any)?.experience?.options?.intermediate?.description ?? 'He operado en mercados de predicción antes' },
    { id: 'advanced' as const, label: (dict.onboarding as any)?.experience?.options?.advanced?.label ?? 'Trader Experimentado', description: (dict.onboarding as any)?.experience?.options?.advanced?.description ?? 'Opero regularmente en mercados de predicción' },
    { id: 'professional' as const, label: (dict.onboarding as any)?.experience?.options?.professional?.label ?? 'Profesional', description: (dict.onboarding as any)?.experience?.options?.professional?.description ?? 'Uso los mercados de predicción para trading profesional' },
  ];

  const goNext = (next: Step) => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(next);
      setIsVisible(true);
    }, 200);
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => setDone(true), 300);
  };

  const progressLabel = ((dict.onboarding?.welcome as any)?.progressLabel ?? '{{current}} de {{total}}')
    .replace('{{current}}', String(getStepNumber()))
    .replace('{{total}}', String(TOTAL_STEPS));

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <p className="text-xl font-medium text-gray-600">Onboarding inspection complete. No data was stored.</p>
      </div>
    );
  }

  return (
    <div data-testid="onboarding-preview" className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className={`w-full max-w-2xl transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {currentStep === 'source' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-6 sm:px-8 sm:py-8 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bofet_logo.svg" alt="Bofet Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{dict.onboarding?.welcome?.title ?? 'Bienvenido a Bofet'}</h1>
                  <p className="text-sm text-gray-500">{(dict.onboarding?.welcome as any)?.subtitle ?? 'Configuremos tu cuenta'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#00C805] to-[#00C805] transition-all duration-300" style={{ width: `${getProgress()}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-600">{progressLabel}</span>
              </div>
            </div>
            <div className="px-6 py-0 sm:px-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{dict.onboarding?.source?.title ?? '¿Cómo nos conociste?'}</h2>
              <p className="text-gray-600 mb-8">{dict.onboarding?.source?.description ?? 'Ayúdanos a entender cómo descubriste nuestra plataforma.'}</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {sourceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedSource(opt.id)}
                    className={`w-full flex flex-row items-center justify-start gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedSource === opt.id ? 'border-[#00C805] bg-[#00C805]/10' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedSource === opt.id ? 'border-[#00C805]' : 'border-gray-300'}`}>
                      {selectedSource === opt.id && <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#00C805]" />}
                    </div>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 sm:px-8 sm:py-6 shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={() => goNext('experience')}
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
            <div className="px-6 py-6 sm:px-8 sm:py-8 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bofet_logo.svg" alt="Bofet Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{dict.onboarding?.welcome?.title ?? 'Bienvenido a Bofet'}</h1>
                  <p className="text-sm text-gray-500">{(dict.onboarding?.welcome as any)?.subtitle ?? 'Configuremos tu cuenta'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#00C805] to-[#00C805] transition-all duration-300" style={{ width: `${getProgress()}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-600">{progressLabel}</span>
              </div>
            </div>
            <div className="px-6 py-0 sm:px-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{(dict.onboarding as any)?.experience?.title ?? '¿Cuál es tu nivel de experiencia?'}</h2>
              <p className="text-gray-600 mb-8">{(dict.onboarding as any)?.experience?.description ?? 'Selecciona la opción que mejor describa tu experiencia en trading.'}</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedExperience(opt.id)}
                    className={`w-full flex flex-row items-start justify-start gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedExperience === opt.id ? 'border-[#00C805] bg-[#00C805]/10' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedExperience === opt.id ? 'border-[#00C805]' : 'border-gray-300'}`}>
                      {selectedExperience === opt.id && <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#00C805]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-0.5 sm:mb-1 text-xs sm:text-sm leading-tight">{opt.label}</div>
                      <p className="text-xs text-gray-600 hidden sm:block leading-tight">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 sm:px-8 sm:py-6 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <button onClick={() => goNext('source')} className="px-6 py-3 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  {(dict.onboarding as any)?.experience?.back ?? 'Anterior'}
                </button>
                <button
                  onClick={() => goNext('video')}
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
              .onboarding-preview-video mux-player::part(center-play-button) {
                display: none;
              }
            `}</style>
            <div className="px-6 py-6 sm:px-8 sm:py-8 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/bofet_logo.svg" alt="Bofet Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{dict.onboarding?.welcome?.title ?? 'Bienvenido a Bofet'}</h1>
                  <p className="text-sm text-gray-500">{(dict.onboarding?.welcome as any)?.subtitle ?? 'Configuremos tu cuenta'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#00C805] to-[#00C805] transition-all duration-300" style={{ width: `${getProgress()}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-600">{progressLabel}</span>
              </div>
            </div>
            <div className="px-6 py-0 sm:px-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{(dict.onboarding as any)?.video?.title ?? 'Mira una introducción rápida'}</h2>
              <p className="text-gray-600 mb-6">{(dict.onboarding as any)?.video?.description ?? 'Aprende cómo hacer tu primera predicción en Bofet.'}</p>
              <div className="onboarding-preview-video w-full overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
                <MuxPlayer
                  playbackId={PLAYBACK_ID}
                  poster={POSTER_URL}
                  metadata={{ video_title: 'Onboarding Video' }}
                  style={{ aspectRatio: '16/9', width: '100%' }}
                  streamType="on-demand"
                  paused={!isVisible}
                />
              </div>
            </div>
            <div className="px-6 py-4 sm:px-8 sm:py-6 shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 bg-linear-to-r from-[#00C805] to-[#00C805] text-white font-medium rounded-lg hover:from-[#009904] hover:to-[#009904] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {(dict.onboarding as any)?.video?.continue ?? (dict.onboarding?.source as any)?.next ?? 'Continuar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
