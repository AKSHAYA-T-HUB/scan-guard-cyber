// API service for QR Scanner backend integration

export interface ScanResult {
  id: string;
  content: string;
  type: 'url' | 'upi' | 'text';
  riskLevel: 'safe' | 'warning' | 'danger';
  verdict: string;
  reasons: string[];
  timestamp: string;
  analysisStats?: {
    domainAge?: number;
    sslExpiry?: number;
    virusTotalScore?: number;
    suspiciousPatterns?: number;
  };
}

export interface ApiResponse {
  success: boolean;
  data: ScanResult;
  error?: string;
}

// Mock backend for demo - replace with actual FastAPI endpoint
const MOCK_BACKEND_URL = '/api/scan'; // Replace with actual backend URL

export async function analyzeScan(content: string): Promise<ScanResult> {
  // Mock analysis for demo purposes
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
  
  const isUPI = content.startsWith('upi://');
  const isURL = content.startsWith('http://') || content.startsWith('https://');
  
  let riskLevel: 'safe' | 'warning' | 'danger' = 'safe';
  let reasons: string[] = [];
  let verdict = '';
  
  if (isUPI) {
    riskLevel = 'safe';
    verdict = '✅ Safe Payment QR';
    reasons = ['Verified UPI payment link', 'Safe to proceed with payment'];
  } else if (isURL) {
    // Mock risk analysis based on URL characteristics
    const suspiciousPatterns = ['bit.ly', 'tinyurl', 'suspicious-domain'];
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      content.toLowerCase().includes(pattern)
    );
    
    if (hasSuspiciousPattern) {
      riskLevel = 'danger';
      verdict = '🚨 Risky URL Detected';
      reasons = [
        'Contains suspicious URL shorteners',
        'Domain flagged in threat database',
        'Potential phishing attempt'
      ];
    } else if (content.includes('http://')) {
      riskLevel = 'warning';
      verdict = '⚠️ Potentially Suspicious';
      reasons = [
        'Uses insecure HTTP protocol',
        'SSL certificate not verified',
        'Proceed with caution'
      ];
    } else {
      riskLevel = 'safe';
      verdict = '✅ URL Appears Safe';
      reasons = [
        'HTTPS secure connection',
        'Domain verified',
        'No suspicious patterns detected'
      ];
    }
  } else {
    verdict = '✅ Text Content Safe';
    reasons = ['Plain text content', 'No security risks detected'];
  }
  
  return {
    id: Date.now().toString(),
    content,
    type: isUPI ? 'upi' : isURL ? 'url' : 'text',
    riskLevel,
    verdict,
    reasons,
    timestamp: new Date().toISOString(),
    analysisStats: {
      domainAge: Math.floor(Math.random() * 365) + 30,
      sslExpiry: Math.floor(Math.random() * 90) + 1,
      virusTotalScore: Math.floor(Math.random() * 100),
      suspiciousPatterns: Math.floor(Math.random() * 5)
    }
  };
}

// Storage functions for scan history
export function getScanHistory(): ScanResult[] {
  const stored = localStorage.getItem('qr_scan_history');
  return stored ? JSON.parse(stored) : [];
}

export function saveScanResult(result: ScanResult): void {
  const history = getScanHistory();
  const newHistory = [result, ...history.slice(0, 49)]; // Keep last 50 scans
  localStorage.setItem('qr_scan_history', JSON.stringify(newHistory));
}

export function clearScanHistory(): void {
  localStorage.removeItem('qr_scan_history');
}