// Test setup file for mocking browser APIs that are not available in jsdom
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}
};

// Mock IndexedDB
const mockIndexedDB = {
  open: () => ({
    result: {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      createObjectStore: (): void => {},
      transaction: () => ({
        objectStore: () => ({
          get: () => Promise.resolve(null),
          put: () => Promise.resolve(),
          delete: () => Promise.resolve(),
          getAll: () => Promise.resolve([]),
        }),
      }),
    },
    onsuccess: null,
    onerror: null,
  }),
  deleteDatabase: () => ({
    onsuccess: null,
    onerror: null,
  }),
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  root: Element | null = null;
  rootMargin = '';
  thresholds: readonly number[] = [];
} as typeof IntersectionObserver;

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});
