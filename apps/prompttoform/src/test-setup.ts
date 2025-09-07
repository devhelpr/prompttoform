// Test setup file for mocking browser APIs that are not available in jsdom
import { vi } from 'vitest';
import '@testing-library/jest-dom';

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

// Mock pdf-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(1),
      getTitle: vi.fn().mockReturnValue('Test Document'),
      getAuthor: vi.fn().mockReturnValue('Test Author'),
      getSubject: vi.fn().mockReturnValue('Test Subject'),
      getCreator: vi.fn().mockReturnValue('Test Creator'),
      getProducer: vi.fn().mockReturnValue('Test Producer'),
      getCreationDate: vi.fn().mockReturnValue(new Date()),
      getModificationDate: vi.fn().mockReturnValue(new Date()),
      getForm: vi.fn().mockReturnValue({
        getFields: vi.fn().mockReturnValue([]),
      }),
    }),
  },
  PDFField: class PDFField {
    getName() {
      return 'testField';
    }
    isRequired() {
      return false;
    }
    isReadOnly() {
      return false;
    }
  },
  PDFTextField: class PDFTextField {
    getName() {
      return 'testTextField';
    }
    isRequired() {
      return false;
    }
    isReadOnly() {
      return false;
    }
    getText() {
      return 'test text';
    }
  },
  PDFCheckBox: class PDFCheckBox {
    getName() {
      return 'testCheckBox';
    }
    isRequired() {
      return false;
    }
    isReadOnly() {
      return false;
    }
    isChecked() {
      return false;
    }
  },
  PDFRadioGroup: class PDFRadioGroup {
    getName() {
      return 'testRadioGroup';
    }
    isRequired() {
      return false;
    }
    isReadOnly() {
      return false;
    }
    getSelected() {
      return null;
    }
    getOptions() {
      return [];
    }
  },
  PDFDropdown: class PDFDropdown {
    getName() {
      return 'testDropdown';
    }
    isRequired() {
      return false;
    }
    isReadOnly() {
      return false;
    }
    getSelected() {
      return null;
    }
    getOptions() {
      return [];
    }
  },
  PDFOptionList: class PDFOptionList {
    getName() {
      return 'testOptionList';
    }
    isRequired() {
      return false;
    }
    isReadOnly() {
      return false;
    }
    getSelected() {
      return null;
    }
    getOptions() {
      return [];
    }
  },
}));

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockReturnValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Test Document Title' },
            { str: 'This is test content' },
          ],
        }),
      }),
    }),
  }),
}));
