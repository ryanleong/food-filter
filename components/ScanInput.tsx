'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Loader2, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    if (typeof navigator === 'undefined') {
      return undefined;
    }

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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
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

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

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
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  }

  function handleAnalyze() {
    if (!selectedFile) {
      setValidationError('Select a menu image before analyzing.');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setValidationError(null);
      setIsOfflineAlertVisible(true);
      return;
    }

    analyze(selectedFile, items);
  }

  return (
    <div className="flex flex-col gap-6">
      {items.length === 0 ? (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Your ingredient list is empty. Add ingredients before scanning.{' '}
            <Link href="/ingredients" className="font-medium underline underline-offset-4">
              Go to My Ingredients
            </Link>
          </p>
        </div>
      ) : null}

      {isOfflineAlertVisible ? (
        <div
          className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>No internet connection. AI analysis requires connectivity.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={() => setIsOfflineAlertVisible(false)}
            aria-label="Dismiss offline alert"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {validationError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {validationError}
        </div>
      ) : null}

      {analyzeError ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p>{analyzeError}</p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={resetAnalyze}
            className="self-start"
          >
            Try Again
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Choose a menu image</CardTitle>
          <CardDescription>
            Take a fresh photo at the table or upload an existing image before you analyze.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* aria-live region must be statically present for screen readers to track changes */}
          <div aria-live="polite" aria-atomic="true">
            {status === 'loading' ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <Loader2 className="size-8 animate-spin" aria-hidden="true" />
                <p className="text-sm font-medium">Analyzing your menu…</p>
                {showSlowWarning ? (
                  <p className="text-xs">This is taking longer than usual…</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {status !== 'loading' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  ref={cameraInputRef}
                  id="camera-image-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera aria-hidden="true" />
                  Take Photo
                </Button>

                <input
                  ref={uploadInputRef}
                  id="upload-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 justify-start"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <ImageUp aria-hidden="true" />
                  Upload Image
                </Button>
              </div>

              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                {previewUrl ? (
                  <div className="flex flex-col gap-4">
                    <div className="overflow-hidden rounded-lg border bg-background">
                      <img
                        src={previewUrl}
                        alt="Selected menu preview"
                        className="max-h-[300px] w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                      <Button type="button" variant="secondary" onClick={clearSelection}>
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background/80 px-6 py-10 text-center">
                    <ImageUp className="size-8 text-muted-foreground" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No image selected</p>
                      <p className="text-sm text-muted-foreground">
                        Your menu preview will appear here after you take a photo or choose a file.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!selectedFile}
                >
                  Analyze Menu
                </Button>
                {selectedFile ? (
                  <Button type="button" variant="ghost" onClick={clearSelection}>
                    Change Image
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}