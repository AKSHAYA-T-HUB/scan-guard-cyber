import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { AlertCircle, ArrowRight, Check, ImagePlus, LoaderCircle, RefreshCw, ScanLine, ShieldCheck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQRScanner } from '@/hooks/useQRScanner';
import { analyzeScan, makePaymentResult, saveScanResult } from '@/lib/api';

export default function Scanner() {
  const navigate = useNavigate();
  const { videoRef, state, startScanning, stopScanning, resetScanner } = useQRScanner();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAnalyzed = useRef(false);

  const submitContent = useCallback(async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || hasAnalyzed.current) return;
    hasAnalyzed.current = true;
    setPendingContent(content);
    setAnalysisError(null);

    try {
      const result = content.toLowerCase().startsWith('upi://')
        ? makePaymentResult(content)
        : await analyzeScan(content);
      saveScanResult(result);
      navigate('/results', { state: { scanResult: result } });
    } catch {
      hasAnalyzed.current = false;
      setAnalysisError('Could not reach the security service. Your QR content was not opened. Check the service connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (state.result) void submitContent(state.result);
  }, [state.result, submitContent]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void startScanning(); }, 250);
    return () => window.clearTimeout(timer);
  }, [startScanning]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitContent(manualContent);
  };

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    setAnalysisError(null);
    try {
      const decoded = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      void submitContent(decoded.data);
    } catch {
      setAnalysisError('No readable QR code was found in that image. Try another photo or scan with your camera.');
    } finally {
      event.target.value = '';
    }
  };

  const retryAnalysis = () => {
    if (!pendingContent) return;
    hasAnalyzed.current = false;
    void submitContent(pendingContent);
  };

  const clearAnalysisError = () => {
    setAnalysisError(null);
    setPendingContent(null);
    hasAnalyzed.current = false;
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28 pt-24 sm:px-8 lg:pb-14 lg:pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-glow" />
            Live protection
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">Scan a QR code</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Check the destination before opening a link or making a payment.</p>
        </div>
        <Link to="/history" className="text-sm text-muted-foreground transition-colors hover:text-primary">Recent scans <span aria-hidden="true">→</span></Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)] lg:gap-12">
        <section aria-label="Camera scanner">
          <div className="relative aspect-[4/3] min-h-64 overflow-hidden border border-border bg-card sm:aspect-[16/10]">
            <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${state.isScanning ? 'opacity-100' : 'opacity-0'}`} playsInline muted autoPlay aria-label="Camera preview" />
            {!state.isScanning && <div className="absolute inset-0 flex items-center justify-center bg-muted/30"><ScanLine className="h-12 w-12 text-primary/50" /></div>}
            {state.isScanning && <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
              <div className="relative aspect-square w-[min(62%,18rem)] border border-primary/70 shadow-glow">
                <span className="absolute -left-px -top-px h-8 w-8 border-l-2 border-t-2 border-primary" />
                <span className="absolute -right-px -top-px h-8 w-8 border-r-2 border-t-2 border-primary" />
                <span className="absolute -bottom-px -left-px h-8 w-8 border-b-2 border-l-2 border-primary" />
                <span className="absolute -bottom-px -right-px h-8 w-8 border-b-2 border-r-2 border-primary" />
                <span className="absolute left-0 right-0 top-1/2 h-px animate-pulse bg-primary/80 shadow-glow" />
              </div>
            </div>}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                {state.isScanning ? <><span className="h-2 w-2 rounded-full bg-primary" /> Camera is scanning</> : <><ScanLine className="h-4 w-4 text-muted-foreground" /> Camera paused</>}
              </p>
              {state.isScanning ? <Button type="button" variant="ghost" size="sm" onClick={stopScanning} aria-label="Pause camera"><X className="h-4 w-4" /> Pause</Button> : <Button type="button" variant="outline" size="sm" onClick={() => { clearAnalysisError(); void startScanning(); }}><RefreshCw className="h-4 w-4" /> Start camera</Button>}
            </div>
          </div>

          {(state.error || analysisError) && <div role="alert" className="mt-4 flex items-start gap-3 border border-danger/30 bg-danger/5 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="min-w-0 flex-1"><p className="font-medium text-foreground">{state.error ? 'Camera unavailable' : 'Analysis unavailable'}</p><p className="mt-1 leading-5 text-muted-foreground">{state.error ?? analysisError}</p></div>
            {analysisError && pendingContent && <Button type="button" variant="outline" size="sm" onClick={retryAnalysis}><RefreshCw className="h-4 w-4" /> Retry</Button>}
          </div>}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Your QR content stays on this device until it is sent for a security check.</span>
          </div>
        </section>

        <aside className="flex flex-col gap-7">
          <div>
            <h2 className="text-lg font-semibold">Scan a photo instead</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Choose an image containing a QR code.</p>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleImage} className="sr-only" aria-label="Choose a QR code image" />
            <Button type="button" variant="outline" className="mt-4 w-full justify-start" onClick={() => inputRef.current?.click()}>
              {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {imageName ?? 'Choose an image'}
              <Upload className="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-semibold">Check a link or code</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Paste QR content to check it with the security service.</p>
            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
              <label className="sr-only" htmlFor="qr-content">QR code content or link</label>
              <textarea id="qr-content" value={manualContent} onChange={(event) => setManualContent(event.target.value)} placeholder="Paste a link or QR code content" rows={4} className="w-full resize-y border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <Button type="submit" className="w-full" disabled={isAnalyzing || !manualContent.trim()}>
                {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Check for risks <ArrowRight className="ml-auto h-4 w-4" /></>}
              </Button>
            </form>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" /> Before you open</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">A scan can help spot suspicious links. Always confirm a payment recipient and amount in your payment app.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}