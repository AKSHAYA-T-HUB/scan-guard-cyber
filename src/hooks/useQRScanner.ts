import { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

export interface QRScannerState {
  isScanning: boolean;
  hasPermission: boolean;
  error: string | null;
  result: string | null;
}

export function useQRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  
  const [state, setState] = useState<QRScannerState>({
    isScanning: false,
    hasPermission: false,
    error: null,
    result: null,
  });

  const startScanning = useCallback(async () => {
    if (!videoRef.current) {
      setState(prev => ({ ...prev, error: 'Video element not found' }));
      return;
    }

    try {
      // Check if QR scanner is supported
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setState(prev => ({ ...prev, error: 'No camera found on device' }));
        return;
      }

      // Create scanner instance
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          setState(prev => ({ ...prev, result: result.data, isScanning: false }));
          scanner.stop();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera by default
          maxScansPerSecond: 5,
        }
      );

      scannerRef.current = scanner;

      // Start scanning
      await scanner.start();
      
      setState(prev => ({ 
        ...prev, 
        isScanning: true, 
        hasPermission: true, 
        error: null,
        result: null 
      }));
      
    } catch (error) {
      console.error('Scanner error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start camera',
        isScanning: false 
      }));
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  const resetScanner = useCallback(() => {
    setState(prev => ({ ...prev, result: null, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  return {
    videoRef,
    state,
    startScanning,
    stopScanning,
    resetScanner,
  };
}