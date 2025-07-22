import { useState } from 'react';
import { FormUpdate } from '../../services/indexeddb';

interface UpdateAccordionProps {
  updates: FormUpdate[];
  onLoadUpdate: (update: FormUpdate) => Promise<void>;
}

export function UpdateAccordion({
  updates,
  onLoadUpdate,
}: UpdateAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (updateId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(updateId)) {
      newExpanded.delete(updateId);
    } else {
      newExpanded.add(updateId);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const truncateText = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-2">
      {updates.map((update, index) => (
        <div
          key={update.id}
          className="border border-zinc-200 rounded-md overflow-hidden"
        >
          <button
            onClick={() => toggleItem(update.id)}
            className="w-full px-4 py-3 text-left bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-zinc-600">
                Update #{updates.length - index}
              </span>
              <span className="text-sm text-zinc-500">
                {formatDate(update.createdAt)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-500">
                {truncateText(update.updatePrompt, 40)}
              </span>
              <svg
                className={`w-4 h-4 text-zinc-500 transition-transform ${
                  expandedItems.has(update.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {expandedItems.has(update.id) && (
            <div className="px-4 py-3 bg-white border-t border-zinc-200">
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-zinc-900 mb-1">
                    Update Prompt:
                  </h5>
                  <p className="text-sm text-zinc-700 bg-zinc-50 p-2 rounded">
                    {update.updatePrompt}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => onLoadUpdate(update)}
                    className="inline-flex items-center px-3 py-1 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Load This Version
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
