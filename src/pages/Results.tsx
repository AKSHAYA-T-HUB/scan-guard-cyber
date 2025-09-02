import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScanResult } from '@/lib/api';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Shield,
  Globe,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const result = location.state?.scanResult as ScanResult;
    if (result) {
      setScanResult(result);
    } else {
      // If no result in state, redirect to scanner
      navigate('/scan');
    }
  }, [location.state, navigate]);

  if (!scanResult) {
    return <div>Loading...</div>;
  }

  const getRiskIcon = () => {
    switch (scanResult.riskLevel) {
      case 'safe':
        return <CheckCircle className="w-6 h-6 text-safe" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      case 'danger':
        return <XCircle className="w-6 h-6 text-danger" />;
      default:
        return <Shield className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getRiskColor = () => {
    switch (scanResult.riskLevel) {
      case 'safe':
        return 'border-safe/20 bg-safe/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'danger':
        return 'border-danger/20 bg-danger/5';
      default:
        return 'border-muted/20 bg-muted/5';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scanResult.content);
      toast({
        title: "Copied to clipboard",
        description: "QR code content has been copied.",
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const openLink = () => {
    if (scanResult.type === 'upi') {
      // Open UPI app
      window.open(scanResult.content, '_blank');
    } else if (scanResult.type === 'url') {
      // Open URL (with caution warning)
      if (scanResult.riskLevel === 'danger') {
        const confirmed = window.confirm(
          'This URL has been flagged as potentially dangerous. Are you sure you want to proceed?'
        );
        if (!confirmed) return;
      }
      window.open(scanResult.content, '_blank');
    }
  };

  const getRiskScore = () => {
    switch (scanResult.riskLevel) {
      case 'safe':
        return 85;
      case 'warning':
        return 45;
      case 'danger':
        return 15;
      default:
        return 50;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 pt-20 pb-24">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Scan Results</h1>
            <p className="text-sm text-muted-foreground">Security Analysis Complete</p>
          </div>
        </div>

        {/* Risk Assessment Card */}
        <Card className={`mb-6 ${getRiskColor()} border-2`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getRiskIcon()}
              <div>
                <CardTitle className="text-lg">{scanResult.verdict}</CardTitle>
                <CardDescription>Risk Level: {scanResult.riskLevel.toUpperCase()}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Risk Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Security Score</span>
                  <span>{getRiskScore()}%</span>
                </div>
                <Progress 
                  value={getRiskScore()} 
                  className="h-3"
                />
              </div>

              {/* Content Preview */}
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Scanned Content:</p>
                <p className="text-sm font-mono break-all">
                  {scanResult.content.length > 100 
                    ? `${scanResult.content.substring(0, 100)}...` 
                    : scanResult.content
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                {(scanResult.type === 'url' || scanResult.type === 'upi') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openLink}
                    className={scanResult.riskLevel === 'danger' ? 'border-danger/30' : ''}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Details */}
        <Card className="mb-6 bg-gradient-glass border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanResult.reasons.map((reason, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <p className="text-sm">{reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Stats */}
        {scanResult.analysisStats && (
          <Card className="mb-6 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Technical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {scanResult.analysisStats.domainAge && (
                  <div className="text-center">
                    <Globe className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Domain Age</p>
                    <p className="text-sm font-medium">{scanResult.analysisStats.domainAge} days</p>
                  </div>
                )}
                {scanResult.analysisStats.sslExpiry && (
                  <div className="text-center">
                    <Shield className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">SSL Expiry</p>
                    <p className="text-sm font-medium">{scanResult.analysisStats.sslExpiry} days</p>
                  </div>
                )}
                {scanResult.analysisStats.virusTotalScore !== undefined && (
                  <div className="text-center">
                    <CheckCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">VirusTotal</p>
                    <p className="text-sm font-medium">{scanResult.analysisStats.virusTotalScore}/100</p>
                  </div>
                )}
                {scanResult.analysisStats.suspiciousPatterns !== undefined && (
                  <div className="text-center">
                    <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Threats</p>
                    <p className="text-sm font-medium">{scanResult.analysisStats.suspiciousPatterns} found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Scanned: {new Date(scanResult.timestamp).toLocaleString()}</span>
              </div>
              <Badge variant="outline">{scanResult.type.toUpperCase()}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link to="/scan" className="block">
            <Button variant="cyber" size="lg" className="w-full">
              Scan Another QR Code
            </Button>
          </Link>
          <Link to="/history" className="block">
            <Button variant="outline" size="lg" className="w-full">
              View Scan History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}