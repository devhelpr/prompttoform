import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 sm:p-8 md:p-12">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 backdrop-blur-sm animate-fade-in">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
                PromptToForm
              </h1>
              <p className="text-zinc-600">
                Generate/edit Form/UI JSON files for your projects using prompts
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Currently supporting Form specification v0.1
              </p>
            </div>

            {children}
          </div>
          <div className="mt-8 px-6 py-6 sm:px-8 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500">
              <span>Form generator based PoC</span>
              <span>•</span>
              <a
                href="/vanilla"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Vanilla JS Implementation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
