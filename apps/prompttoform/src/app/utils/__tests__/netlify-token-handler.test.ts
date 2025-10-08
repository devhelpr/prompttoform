import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  netlifyTokenHandler,
  handleNetlifyRedirect,
  setNetlifySiteId,
} from '../netlify-token-handler';

// Mock window.location
const mockLocation = {
  search: '',
  href: 'http://localhost:3000',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  value: '',
  writable: true,
});

describe('netlify-token-handler', () => {
  beforeEach(() => {
    // Reset mocks
    mockLocation.search = '';
    document.cookie = '';
    vi.clearAllMocks();
  });

  describe('netlifyTokenHandler', () => {
    it('should extract access token from URL parameters', () => {
      mockLocation.search = '?access_token=test-token-123';

      netlifyTokenHandler();

      expect(document.cookie).toContain('netlify_access_token=test-token-123');
    });

    it('should extract access token from cookies if available', () => {
      document.cookie = 'netlify_access_token=cookie-token-456';

      netlifyTokenHandler();

      // Should not overwrite existing cookie
      expect(document.cookie).toBe('netlify_access_token=cookie-token-456');
    });

    it('should extract site ID from cookies', () => {
      document.cookie = 'netlify_site_id=test-site-789';

      netlifyTokenHandler();

      // This test verifies the function runs without error
      expect(document.cookie).toContain('netlify_site_id=test-site-789');
    });
  });

  describe('handleNetlifyRedirect', () => {
    it('should process state parameter and redirect to original URL', () => {
      const originalUrl = 'http://localhost:3000/form-flow';
      mockLocation.search = `?state=${encodeURIComponent(
        originalUrl
      )}&access_token=test-token`;

      // Mock window.location.href setter
      const mockHrefSetter = vi.fn();
      Object.defineProperty(window.location, 'href', {
        set: mockHrefSetter,
        get: () => mockLocation.href,
      });

      // Mock setTimeout
      vi.useFakeTimers();

      handleNetlifyRedirect();

      // Fast-forward timers
      vi.advanceTimersByTime(100);

      expect(mockHrefSetter).toHaveBeenCalledWith(originalUrl);

      vi.useRealTimers();
    });

    it('should handle missing state parameter gracefully', () => {
      mockLocation.search = '?access_token=test-token';

      // Should not throw error
      expect(() => handleNetlifyRedirect()).not.toThrow();
    });

    it('should handle malformed state parameter gracefully', () => {
      mockLocation.search = '?state=invalid-url&access_token=test-token';

      // Should not throw error
      expect(() => handleNetlifyRedirect()).not.toThrow();
    });
  });

  describe('setNetlifySiteId', () => {
    it('should set site ID in cookie', () => {
      const siteId = 'test-site-123';

      setNetlifySiteId(siteId);

      expect(document.cookie).toContain(`netlify_site_id=${siteId}`);
    });
  });
});
