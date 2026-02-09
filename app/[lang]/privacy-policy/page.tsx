"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });

export default function PrivacyPolicyPage() {
  return <PdfViewer file="/assets/privacy-policy.pdf" />;
}
