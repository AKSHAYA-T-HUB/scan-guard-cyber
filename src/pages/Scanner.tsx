import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQRScanner } from '@/hooks/useQRScanner';
import { analyzeScan, saveScanResult } from '@/lib/api';
import { Camera, Square, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Scanner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { videoRef, state, startScanning, stopScanning, resetScanner } = useQRScanner();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-start camera when component mounts
  useEffect(() => {
    if (!state.isScanning && !state.hasPermission && !state.error) {
      handleStartScan();
    }
  }, []);

  // Handle scan result
  useEffect(() => {
    if (state.result && !isAnalyzing) {
      handleScanResult(state.result);
    }
  }, [state.result, isAnalyzing]);

  const handleScanResult = async (content: string) => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeScan(content);
      saveScanResult(result);
      
      // Navigate to results with the scan data
      navigate('/results', { state: { scanResult: result } });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      resetScanner();
    }
  };

  const handleStartScan = async () => {
    resetScanner();
    await startScanning();
  };

  // Check for UPI detection and show immediate feedback
  const isUPI = state.result?.startsWith('upi://');

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container max-w-md mx-auto px-4">
          <Card className="bg-gradient-glass border-primary/20 shadow-glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Analyzing QR Code</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Running security checks...
                </p>
                {isUPI && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-primary text-sm font-medium">
                      ✅ UPI Payment Link Detected
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 pt-20 pb-24">
        
        {/* Scanner Status */}
        <Card className="mb-6 bg-gradient-glass border-primary/10 shadow-glass">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">QR Code Scanner</CardTitle>
            <CardDescription>
              Position a QR code within the camera frame
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Camera View */}
        <div className="mb-6">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border-2 border-primary/20 shadow-cyber-card">
            {state.isScanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                />
                {/* Scanner Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 border-2 border-primary rounded-2xl relative">
                      {/* Corner indicators */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      
                      {/* Scanning line animation */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scanning Status */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <p className="text-primary text-sm font-medium">
                      Scanning for QR codes...
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Camera not active
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Scanner Error</p>
                  <p className="text-sm text-muted-foreground">{state.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanner Controls */}
        <div className="space-y-3">
          {!state.isScanning ? (
            <Button
              onClick={handleStartScan}
              variant="scan"
              size="xl"
              className="w-full"
            >
              <Camera className="w-6 h-6" />
              Start Camera
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              size="xl"
              className="w-full"
            >
              <Square className="w-6 h-6" />
              Stop Scanner
            </Button>
          )}
        </div>

        {/* Instructions */}
        <Card className="mt-6 bg-muted/30 border-muted">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">How to scan:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Allow camera permissions when prompted</li>
              <li>• Hold your device steady</li>
              <li>• Point the camera at the QR code</li>
              <li>• Wait for automatic detection</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}