import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <div className="text-center py-8">
        <img
          src="/logo.png"
          alt="PromptToForm Logo"
          className="mx-auto h-16 sm:h-20 mb-4"
        />
        <p className="text-zinc-600">
          Generate/edit Form/UI JSON files for your projects using prompts
        </p>
        <p className="text-sm text-zinc-500 mt-2">
          Currently supporting Form specification v0.1
        </p>
      </div>

      {children}

      <div className="mt-8 px-6 py-6 sm:px-8 border-t border-zinc-100 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-500">
          <span>Prompt based Form generator</span>
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
  );
}
