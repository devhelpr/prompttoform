import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  errors: number;
}

interface PerformanceMonitorProps {
  className?: string;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitor({
  className = '',
  onMetricsUpdate,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkRequests: 0,
    errors: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [startTime] = useState(performance.now());

  // Measure initial load time
  useEffect(() => {
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      setMetrics((prev) => ({ ...prev, loadTime }));
    };

    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
      return () => window.removeEventListener('load', measureLoadTime);
    }
  }, [startTime]);

  // Monitor memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (
        performance as Performance & {
          memory: { usedJSHeapSize: number; jsHeapSizeLimit: number };
        }
      ).memory;
      const memoryUsage =
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      setMetrics((prev) => ({ ...prev, memoryUsage }));
    }
  }, []);

  // Monitor render performance
  const measureRenderTime = useCallback(() => {
    const renderTime = performance.now() - startTime;
    setMetrics((prev) => ({ ...prev, renderTime }));
  }, [startTime]);

  // Monitor network requests
  useEffect(() => {
    let requestCount = 0;
    let errorCount = 0;

    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      requestCount++;
      setMetrics((prev) => ({ ...prev, networkRequests: requestCount }));

      return originalFetch.apply(this, args).catch((error) => {
        errorCount++;
        setMetrics((prev) => ({ ...prev, errors: errorCount }));
        throw error;
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      measureMemoryUsage();
      measureRenderTime();

      if (onMetricsUpdate) {
        onMetricsUpdate(metrics);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [measureMemoryUsage, measureRenderTime, metrics, onMetricsUpdate]);

  // Global error monitoring
  useEffect(() => {
    const handleError = () => {
      setMetrics((prev) => ({ ...prev, errors: prev.errors + 1 }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const getPerformanceStatus = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'poor':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const loadTimeStatus = getPerformanceStatus(metrics.loadTime, {
    good: 1000,
    warning: 3000,
  });
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, {
    good: 50,
    warning: 80,
  });
  const renderTimeStatus = getPerformanceStatus(metrics.renderTime, {
    good: 100,
    warning: 500,
  });

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed bottom-4 right-4 z-50 p-3 bg-white rounded-full shadow-lg border border-zinc-200 hover:shadow-xl transition-all duration-200 ${className}`}
        title="Performance Monitor"
      >
        <svg
          className="w-5 h-5 text-zinc-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl border border-zinc-200 w-80 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900">
              Performance Monitor
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
                title="Close"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div
            className={`overflow-y-auto transition-all duration-300 ${
              isExpanded ? 'max-h-80' : 'max-h-48'
            }`}
          >
            <div className="p-4 space-y-4">
              {/* Load Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(loadTimeStatus)}
                  <span className="text-sm text-zinc-700">Load Time</span>
                </div>
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    loadTimeStatus
                  )}`}
                >
                  {metrics.loadTime.toFixed(0)}ms
                </span>
              </div>

              {/* Render Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(renderTimeStatus)}
                  <span className="text-sm text-zinc-700">Render Time</span>
                </div>
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    renderTimeStatus
                  )}`}
                >
                  {metrics.renderTime.toFixed(0)}ms
                </span>
              </div>

              {/* Memory Usage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(memoryStatus)}
                  <span className="text-sm text-zinc-700">Memory Usage</span>
                </div>
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    memoryStatus
                  )}`}
                >
                  {metrics.memoryUsage.toFixed(1)}%
                </span>
              </div>

              {/* Network Requests */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <span className="text-sm text-zinc-700">
                    Network Requests
                  </span>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {metrics.networkRequests}
                </span>
              </div>

              {/* Errors */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-zinc-700">Errors</span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    metrics.errors > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {metrics.errors}
                </span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="pt-4 border-t border-zinc-200 space-y-3">
                  <div className="text-xs text-zinc-500">
                    <div>
                      User Agent: {navigator.userAgent.substring(0, 50)}...
                    </div>
                    <div>Platform: {navigator.platform}</div>
                    <div>
                      Connection:{' '}
                      {(
                        navigator as Navigator & {
                          connection?: { effectiveType: string };
                        }
                      ).connection?.effectiveType || 'Unknown'}
                    </div>
                    <div>
                      Memory:{' '}
                      {'memory' in performance
                        ? `${(
                            (
                              performance as Performance & {
                                memory: {
                                  usedJSHeapSize: number;
                                  jsHeapSizeLimit: number;
                                };
                              }
                            ).memory.usedJSHeapSize /
                            1024 /
                            1024
                          ).toFixed(1)}MB / ${(
                            (
                              performance as Performance & {
                                memory: {
                                  usedJSHeapSize: number;
                                  jsHeapSizeLimit: number;
                                };
                              }
                            ).memory.jsHeapSizeLimit /
                            1024 /
                            1024
                          ).toFixed(1)}MB`
                        : 'Not available'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMetrics({
                        loadTime: 0,
                        renderTime: 0,
                        memoryUsage: 0,
                        cpuUsage: 0,
                        networkRequests: 0,
                        errors: 0,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition-colors"
                  >
                    Reset Metrics
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
