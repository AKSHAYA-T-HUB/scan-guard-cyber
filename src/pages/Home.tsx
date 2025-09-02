import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Shield, History, Zap } from 'lucide-react';
import heroImage from '@/assets/qr-scanner-hero.jpg';

const features = [
  {
    icon: Scan,
    title: 'QR Code Scanner',
    description: 'Scan QR codes with advanced security analysis'
  },
  {
    icon: Shield,
    title: 'Threat Detection',
    description: 'Real-time protection against malicious links'
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get security verdicts in seconds'
  },
  {
    icon: History,
    title: 'Scan History',
    description: 'Track and review your previous scans'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 pt-20 pb-24">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="relative flex items-center justify-center w-32 h-32 mx-auto mb-6 rounded-3xl overflow-hidden bg-gradient-cyber shadow-glow-strong">
            <img 
              src={heroImage} 
              alt="QR Shield Scanner Interface"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-cyber/30" />
            <Shield className="absolute w-12 h-12 text-primary-foreground z-10" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            QR Shield Scanner
          </h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Advanced cybersecurity QR scanner that protects you from malicious links, 
            phishing attempts, and unsafe payment codes.
          </p>

          <Link to="/scan">
            <Button variant="cyber" size="xl" className="w-full mb-4">
              <Scan className="w-6 h-6" />
              Start Scanning
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {features.map(({ icon: Icon, title, description }, index) => (
            <Card key={index} className="bg-gradient-glass border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link to="/history" className="block">
            <Button variant="glass" size="lg" className="w-full justify-start">
              <History className="w-5 h-5" />
              View Scan History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}