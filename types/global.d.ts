declare global {
  interface Window {
    datafast?: (goal: string, metadata?: Record<string, unknown>) => void;
  }
}

export {};
