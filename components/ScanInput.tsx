'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Loader2, ScanLine, TriangleAlert, X } from 'lucide-react';
import { useBlacklistContext } from '@/app/providers';
import { useAnalyze } from '@/lib/hooks/useAnalyze';

function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function ScanInput() {
  const { items } = useBlacklistContext();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isOfflineAlertVisible, setIsOfflineAlertVisible] = useState(false);
  const { status, error: analyzeError, analyze, reset: resetAnalyze } = useAnalyze();
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return undefined;

    function syncOnlineState() {
      setIsOfflineAlertVisible(!navigator.onLine);
    }

    syncOnlineState();
    window.addEventListener('online', syncOnlineState);
    window.addEventListener('offline', syncOnlineState);

    return () => {
      window.removeEventListener('online', syncOnlineState);
      window.removeEventListener('offline', syncOnlineState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (status !== 'loading') {
      setShowSlowWarning(false);
      return undefined;
    }
    const timer = setTimeout(() => setShowSlowWarning(true), 15_000);
    return () => clearTimeout(timer);
  }, [status]);

  function updateSelectedFile(file: File | null) {
    setValidationError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(createPreviewUrl(file));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    updateSelectedFile(file);
  }

  function clearSelection() {
    updateSelectedFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setValidationError('Select a menu image before analyzing.');
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setValidationError(null);
      setIsOfflineAlertVisible(true);
      return;
    }
    const succeeded = await analyze(selectedFile, items);
    if (succeeded) clearSelection();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Empty blacklist warning */}
      {items.length === 0 && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Your ingredient list is empty.{' '}
            <Link href="/ingredients" className="font-semibold underline underline-offset-4">
              Add ingredients
            </Link>{' '}
            before scanning.
          </p>
        </div>
      )}

      {/* Offline warning */}
      {isOfflineAlertVisible && (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>No internet connection. AI analysis requires connectivity.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOfflineAlertVisible(false)}
            aria-label="Dismiss offline alert"
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {validationError}
        </div>
      )}

      {/* Analyze error */}
      {analyzeError && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <p>{analyzeError}</p>
          <button
            type="button"
            onClick={resetAnalyze}
            className="self-start px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Loading state */}
        <div aria-live="polite" aria-atomic="true">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-6">
              <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
              <div>
                <p className="font-display text-base font-semibold text-foreground">Analyzing your menu…</p>
                {showSlowWarning && (
                  <p className="mt-1 text-xs text-muted-foreground">This is taking longer than usual…</p>
                )}
              </div>
            </div>
          )}
        </div>

        {status !== 'loading' && (
          <div className="p-5 flex flex-col gap-5">
            {/* Camera viewfinder */}
            <div className="relative">
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                  <img
                    src={previewUrl}
                    alt="Selected menu preview"
                    className="max-h-[280px] w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearSelection}
                    aria-label="Remove image"
                    className="absolute top-2 right-2 bg-foreground/70 hover:bg-foreground text-background rounded-full p-1.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* Viewfinder with corner bracket decorations */
                <div className="relative flex min-h-56 items-center justify-center rounded-xl bg-muted/50 border border-border border-dashed">
                  <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-sm" aria-hidden="true" />
                  <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-sm" aria-hidden="true" />
                  <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-sm" aria-hidden="true" />
                  <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-sm" aria-hidden="true" />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground px-6 text-center">
                    <ScanLine size={32} strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-sm font-medium">No image selected</p>
                    <p className="text-xs">Take a photo or upload an image of the menu</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera / upload buttons */}
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={cameraInputRef}
                id="camera-image-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
              >
                <Camera size={16} aria-hidden="true" />
                Take Photo
              </button>

              <input
                ref={uploadInputRef}
                id="upload-image-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
              >
                <ImageUp size={16} aria-hidden="true" />
                Upload Image
              </button>
            </div>

            {/* Analyze CTA */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile}
              className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
