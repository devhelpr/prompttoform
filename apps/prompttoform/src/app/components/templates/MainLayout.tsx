import { ReactNode } from 'react';
import { ResponsiveNavbar } from './ResponsiveNavbar';

interface MainLayoutProps {
  children: ReactNode;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  onImportJsonClick: () => void;
  onFormFlowClick?: () => void;
  showFormFlowButton?: boolean;
}

export function MainLayout({
  children,
  onSettingsClick,
  onHistoryClick,
  onImportJsonClick,
  onFormFlowClick,
  showFormFlowButton = false,
}: MainLayoutProps) {
  return (
    <div className="h-full min-h-0 bg-gradient-to-br from-zinc-50 to-zinc-100">
      <div className="grid grid-rows-[auto_1fr] h-full min-h-0">
        {/* Top Navigation Bar */}
        <ResponsiveNavbar
          onSettingsClick={onSettingsClick}
          onHistoryClick={onHistoryClick}
          onImportJsonClick={onImportJsonClick}
          onFormFlowClick={onFormFlowClick}
          showFormFlowButton={showFormFlowButton}
        />

        {/* Main Content Area */}
        <main className="grid grid-rows-[1fr] h-full min-h-0">{children}</main>
      </div>
    </div>
  );
}
