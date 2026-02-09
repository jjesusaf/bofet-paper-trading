'use client';

import { OnboardingPreview } from '@/app/preview_onboarding/OnboardingPreview';

/**
 * Onboarding inspection at /en/test-video and /es/test-video.
 * Same 3-step flow, no storage. For visual inspection only.
 */
export default function LangTestVideoPage() {
  return <OnboardingPreview />;
}
