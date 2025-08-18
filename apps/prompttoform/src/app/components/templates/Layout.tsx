import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-full min-h-0 bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-8 md:p-12">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 backdrop-blur-sm animate-fade-in">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-center mb-16">
              <img
                src="/logo.png"
                alt="PromptToForm Logo"
                className="mx-auto h-16 sm:h-20 mb-8 mt-8"
              />
              <p className="text-zinc-600">
                Generate and edit a Form with natural language prompts
              </p>
              <p className="text-zinc-400 mt-2">
                Prompt → Form → Preview → Deploy
              </p>
            </div>

            {children}
          </div>
          <div className="mt-8 px-6 py-6 sm:px-8 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500">
              <span>Prompt based Form generator</span>
              <span>•</span>
              {/* <a
                href="/vanilla"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Vanilla JS Implementation
              </a> */}
              <span>Currently supporting Form Schema v0.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
