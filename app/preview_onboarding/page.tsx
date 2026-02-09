'use client';

import { Suspense } from 'react';
import { OnboardingPreview } from './OnboardingPreview';

/**
 * Public onboarding inspection at /test-video.
 * Same 3-step flow as real onboarding (source → experience → video).
 * No storage: no Redis, no API. For visual inspection only.
 *
 * Also available at /en/test-video and /es/test-video.
 */
export default function TestVideoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">Loading onboarding preview…</div>}>
      <OnboardingPreview />
    </Suspense>
  );
}
