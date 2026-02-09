"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use worker from public so Next.js can serve it
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

type PdfViewerProps = {
  /** URL to the PDF (e.g. /assets/terms-of-service.pdf) */
  file: string;
};

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setNumPages(null);
  }, [file]);

  return (
    <div className="pdf-viewer-no-select flex min-h-screen w-full flex-col items-center overflow-auto bg-slate-100 py-6">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(e) => setError(e?.message || "Failed to load PDF")}
        loading={
          <div className="flex min-h-[50vh] items-center justify-center">
            <span className="loading loading-spinner loading-lg text-slate-500" />
          </div>
        }
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
        {numPages !== null &&
          !error &&
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <Page
              key={pageNum}
              pageNumber={pageNum}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mb-4 shadow-md"
              loading=""
            />
          ))}
      </Document>
    </div>
  );
}
