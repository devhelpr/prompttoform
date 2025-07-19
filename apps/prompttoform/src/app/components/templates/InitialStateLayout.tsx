import { ReactNode } from 'react';
import { ResponsiveNavbar } from './ResponsiveNavbar';

interface InitialStateLayoutProps {
  children: ReactNode;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  onImportJsonClick: () => void;
}

export function InitialStateLayout({
  children,
  onSettingsClick,
  onHistoryClick,
  onImportJsonClick,
}: InitialStateLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <div className="flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <ResponsiveNavbar
          onSettingsClick={onSettingsClick}
          onHistoryClick={onHistoryClick}
          onImportJsonClick={onImportJsonClick}
        />

        {/* Main content area */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="w-full max-w-4xl">
            {/* Header section */}
            <div className="text-center mb-12">
              <img
                src="/logo.png"
                alt="PromptToForm Logo"
                className="mx-auto h-16 sm:h-20 mb-8"
              />
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
                Generate Forms with AI
              </h1>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Transform your ideas into structured forms using natural
                language. Describe what you need, and we'll create it for you.
              </p>
            </div>

            {/* Centered content */}
            <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 backdrop-blur-sm animate-fade-in">
              <div className="px-6 py-8 sm:px-8 sm:py-10">{children}</div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500">
                <span>Prompt based Form generator</span>
                <span className="hidden sm:inline">•</span>
                <span>Currently supporting Form Schema v0.1</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
