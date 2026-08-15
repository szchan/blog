"use client";

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-red-500/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm">
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close error"
        className="text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
