"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });

export default function TermsOfServicePage() {
  return <PdfViewer file="/assets/terms-of-service.pdf" />;
}
