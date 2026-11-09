export type RiskLevel = 'safe' | 'warning' | 'danger';
export type ScanType = 'url' | 'upi' | 'text';

export interface ScanResult {
  id: string;
  content: string;
  type: ScanType;
  riskLevel: RiskLevel;
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

const HISTORY_KEY = 'qr_scan_history';
const HISTORY_LIMIT = 50;
const SCAN_ENDPOINT = import.meta.env.VITE_SCAN_API_URL?.trim() || '/scan';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function riskLevelFrom(value: unknown, record: Record<string, unknown>): RiskLevel {
  const safeFlag = firstValue(record, ['is_safe', 'safe', 'isSafe']);
  if (typeof safeFlag === 'boolean') return safeFlag ? 'safe' : 'danger';

  const label = String(value ?? '').trim().toLowerCase();
  if (/safe|clean|low risk|benign|trusted/.test(label)) return 'safe';
  if (/suspicious|warning|medium|moderate|uncertain/.test(label)) return 'warning';
  if (/risk|danger|malicious|phish|unsafe|high|critical/.test(label)) return 'danger';
  throw new Error('The security service response did not include a recognizable risk verdict.');
}

function normalizeReasons(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item;
      const record = asRecord(item);
      return String(record?.reason ?? record?.message ?? record?.name ?? 'Security check completed');
    });
  }
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function normalizeStats(value: unknown): ScanResult['analysisStats'] {
  const record = asRecord(value);
  if (!record) return undefined;

  const stats = {
    domainAge: asNumber(firstValue(record, ['domainAge', 'domain_age', 'domain_age_days'])),
    sslExpiry: asNumber(firstValue(record, ['sslExpiry', 'ssl_expiry', 'ssl_expiry_days', 'ssl_days_remaining'])),
    virusTotalScore: asNumber(firstValue(record, ['virusTotalScore', 'virustotal_score', 'virus_total_score'])),
    suspiciousPatterns: asNumber(firstValue(record, ['suspiciousPatterns', 'suspicious_patterns', 'threat_count'])),
  };
  return Object.values(stats).some((item) => item !== undefined) ? stats : undefined;
}

function resultFromResponse(payload: unknown, content: string): ScanResult {
  const root = asRecord(payload);
  if (!root) throw new Error('The security service returned an unreadable response.');

  const data = asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.analysis) ?? root;
  const rawLevel = firstValue(data, ['riskLevel', 'risk_level', 'risk', 'verdict', 'status', 'classification']);
  const riskLevel = riskLevelFrom(rawLevel, data);
  const type: ScanType = content.trim().toLowerCase().startsWith('upi://')
    ? 'upi'
    : /^https?:\/\//i.test(content.trim()) ? 'url' : 'text';
  const reasons = normalizeReasons(firstValue(data, ['reasons', 'findings', 'checks', 'details']));

  return {
    id: crypto.randomUUID(),
    content,
    type,
    riskLevel,
    verdict: String(firstValue(data, ['verdict', 'message', 'summary']) ?? (
      riskLevel === 'safe' ? 'Safe' : riskLevel === 'warning' ? 'Suspicious' : 'Risky'
    )),
    reasons: reasons.length ? reasons : ['No additional details were provided by the security service.'],
    timestamp: new Date().toISOString(),
    analysisStats: normalizeStats(firstValue(data, ['analysisStats', 'analysis_stats', 'stats', 'metadata'])),
  };
}

export async function analyzeScan(content: string): Promise<ScanResult> {
  const response = await fetch(SCAN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`The security service returned an error (${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The security service response was not valid JSON.');
  }

  return resultFromResponse(payload, content);
}

export function makePaymentResult(content: string): ScanResult {
  return {
    id: crypto.randomUUID(),
    content,
    type: 'upi',
    riskLevel: 'safe',
    verdict: '✅ Safe Payment QR',
    reasons: ['UPI payment link detected. Confirm the recipient and amount in your payment app before paying.'],
    timestamp: new Date().toISOString(),
  };
}

export function getScanHistory(): ScanResult[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed as ScanResult[] : [];
  } catch {
    return [];
  }
}

export function saveScanResult(result: ScanResult): void {
  try {
    const history = getScanHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([result, ...history].slice(0, HISTORY_LIMIT)));
  } catch {
    // Scanning and results remain available if browser storage is disabled.
  }
}

export function clearScanHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}