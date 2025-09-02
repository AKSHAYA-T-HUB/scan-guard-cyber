import { NavLink } from 'react-router-dom';
import { Home, Scan, History, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/scan', icon: Scan, label: 'Scanner' },
  { path: '/history', icon: History, label: 'History' },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border/20 z-50">
      <div className="container max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-300',
                  'hover:bg-primary/10 hover:text-primary',
                  isActive && 'text-primary bg-primary/10 shadow-glow'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-md border-b border-border/20 z-50">
      <div className="container max-w-md mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-cyber shadow-glow">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">QR Shield</h1>
            <p className="text-xs text-muted-foreground">Security Scanner</p>
          </div>
        </div>
      </div>
    </header>
  );
}