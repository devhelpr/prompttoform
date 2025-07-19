import { ReactNode } from 'react';
import { ResponsiveNavbar } from './ResponsiveNavbar';

interface MainLayoutProps {
  children: ReactNode;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
}

export function MainLayout({
  children,
  onSettingsClick,
  onHistoryClick,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <div className="flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <ResponsiveNavbar
          onSettingsClick={onSettingsClick}
          onHistoryClick={onHistoryClick}
        />

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
