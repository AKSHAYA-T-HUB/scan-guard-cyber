import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getScanHistory, clearScanHistory, ScanResult } from '@/lib/api';
import { 
  History as HistoryIcon, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Calendar,
  ExternalLink,
  Scan
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function History() {
  const { toast } = useToast();
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const history = getScanHistory();
    setScanHistory(history);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all scan history?')) {
      clearScanHistory();
      setScanHistory([]);
      toast({
        title: "History cleared",
        description: "All scan history has been removed.",
      });
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle className="w-4 h-4 text-safe" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-danger" />;
      default:
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'danger':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 pt-20 pb-24">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Scan History</h1>
            <p className="text-sm text-muted-foreground">
              {scanHistory.length} scans recorded
            </p>
          </div>
          {scanHistory.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* History List */}
        {scanHistory.length === 0 ? (
          <div className="text-center py-12">
            <Card className="bg-gradient-glass border-primary/10">
              <CardContent className="pt-8 pb-8">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scans Yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Your scan history will appear here after you scan your first QR code.
                </p>
                <Link to="/scan">
                  <Button variant="cyber" size="lg">
                    <Scan className="w-5 h-5" />
                    Start Scanning
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            {scanHistory.map((scan) => (
              <Card 
                key={scan.id} 
                className="bg-gradient-glass border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-glass cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Risk Icon */}
                    <div className="mt-1">
                      {getRiskIcon(scan.riskLevel)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={getRiskBadgeVariant(scan.riskLevel)}
                          className="text-xs"
                        >
                          {scan.riskLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {scan.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm font-medium mb-1">
                        {scan.verdict}
                      </p>
                      
                      <p className="text-xs text-muted-foreground font-mono mb-2">
                        {truncateContent(scan.content)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(scan.timestamp)}</span>
                        </div>
                        
                        {(scan.type === 'url' || scan.type === 'upi') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (scan.riskLevel === 'danger') {
                                const confirmed = window.confirm(
                                  'This URL has been flagged as potentially dangerous. Are you sure you want to proceed?'
                                );
                                if (!confirmed) return;
                              }
                              window.open(scan.content, '_blank');
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Card */}
        {scanHistory.length > 0 && (
          <Card className="mt-6 bg-muted/30 border-muted">
            <CardHeader>
              <CardTitle className="text-base">Security Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-bold ${scanHistory.filter(s => s.riskLevel === 'safe').length > 0 ? 'text-safe' : 'text-muted-foreground'}`}>
                    {scanHistory.filter(s => s.riskLevel === 'safe').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Safe</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${scanHistory.filter(s => s.riskLevel === 'warning').length > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {scanHistory.filter(s => s.riskLevel === 'warning').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Warning</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${scanHistory.filter(s => s.riskLevel === 'danger').length > 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                    {scanHistory.filter(s => s.riskLevel === 'danger').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Danger</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}