import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import App from './app';

describe('App', () => {
  beforeEach(() => {
    // Mock dialog API
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    // Mock IndexedDB
    global.indexedDB = {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
    } as any;
  });
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getAllByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(
      getAllByText(new RegExp('Create a Form', 'gi')).length > 0
    ).toBeTruthy();
  });
});
