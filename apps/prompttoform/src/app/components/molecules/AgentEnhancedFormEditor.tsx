import React, { useState, useEffect } from 'react';
import { AgentService } from '@devhelpr/agent-framework';
import { QualityReport, QualitySuggestion } from '@devhelpr/agent-framework';

interface AgentEnhancedFormEditorProps {
  agentService: AgentService;
  initialFormJson?: Record<string, unknown>;
  onFormUpdate?: (formJson: Record<string, unknown>) => void;
  className?: string;
}

export function AgentEnhancedFormEditor({
  agentService,
  initialFormJson,
  onFormUpdate,
  className = '',
}: AgentEnhancedFormEditorProps) {
  const [formJson, setFormJson] = useState<Record<string, unknown>>(
    initialFormJson || {}
  );
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<QualitySuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const analyzeFormQuality = React.useCallback(
    async (formData: Record<string, unknown>) => {
      if (!formData || Object.keys(formData).length === 0) return;

      setIsAnalyzing(true);
      try {
        // Create a task to analyze form quality
        const task = {
          id: `quality-analysis-${Date.now()}`,
          type: 'standard' as const,
          prompt:
            'Analyze the quality of this form and provide improvement suggestions',
          context: {
            sessionId: 'form-editor',
            formJson: formData,
            userPreferences: {
              accessibilityLevel: 'AA' as const,
            },
          },
          parameters: {
            analysisType: 'quality-assessment',
          },
        };

        const result = await agentService.executeTask(task);

        if (result.success && result.data?.qualityReport) {
          setQualityReport(result.data.qualityReport);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Failed to analyze form quality:', error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [agentService]
  );

  useEffect(() => {
    if (initialFormJson) {
      setFormJson(initialFormJson);
      analyzeFormQuality(initialFormJson);
    }
  }, [initialFormJson, analyzeFormQuality]);

  const applySuggestion = async (suggestion: QualitySuggestion) => {
    if (!formJson) return;

    try {
      // Create a task to apply the suggestion
      const task = {
        id: `apply-suggestion-${Date.now()}`,
        type: 'standard' as const,
        prompt: `Apply this improvement suggestion to the form: ${suggestion.message}`,
        context: {
          sessionId: 'form-editor',
          formJson: formJson,
          suggestion: suggestion,
        },
        parameters: {
          action: 'apply-suggestion',
          suggestionType: suggestion.type,
        },
      };

      const result = await agentService.executeTask(task);

      if (result.success && result.data?.formJson) {
        const updatedForm = result.data.formJson as Record<string, unknown>;
        setFormJson(updatedForm);
        onFormUpdate?.(updatedForm);

        // Re-analyze the form after applying the suggestion
        await analyzeFormQuality(updatedForm);
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accessibility':
        return '♿';
      case 'ux':
        return '🎨';
      case 'performance':
        return '⚡';
      case 'validation':
        return '✅';
      case 'structure':
        return '🏗️';
      default:
        return '💡';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Form Quality Overview */}
      {qualityReport && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Form Quality Analysis
            </h3>
            <button
              onClick={() => analyzeFormQuality(formJson)}
              disabled={isAnalyzing}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          </div>

          {/* Overall Score */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(qualityReport.overallScore)}/100
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      qualityReport.overallScore >= 80
                        ? 'bg-green-500'
                        : qualityReport.overallScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${qualityReport.overallScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { key: 'accessibility', label: 'Accessibility' },
              { key: 'ux', label: 'User Experience' },
              { key: 'performance', label: 'Performance' },
              { key: 'validation', label: 'Validation' },
              { key: 'structure', label: 'Structure' },
            ].map(({ key, label }) => {
              const metric = qualityReport[key as keyof QualityReport] as
                | { score?: number }
                | undefined;
              const score = metric?.score || 0;
              return (
                <div key={key} className="text-center">
                  <div
                    className={`text-lg font-semibold ${getQualityScoreColor(
                      score
                    )}`}
                  >
                    {Math.round(score)}
                  </div>
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {qualityReport.recommendations &&
            qualityReport.recommendations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {qualityReport.recommendations.map(
                    (recommendation, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        {recommendation}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Improvement Suggestions */}
      {qualityReport?.suggestions && qualityReport.suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Improvement Suggestions ({qualityReport.suggestions.length})
            </h3>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          </div>

          {showSuggestions && (
            <div className="space-y-3">
              {qualityReport.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    selectedSuggestion === suggestion
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">
                          {getTypeIcon(suggestion.type)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                            suggestion.priority
                          )}`}
                        >
                          {suggestion.priority.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {suggestion.type}
                        </span>
                      </div>

                      <p className="text-sm text-gray-900 mb-2">
                        {suggestion.message}
                      </p>

                      <div className="text-xs text-gray-600">
                        <div className="font-medium">Fix:</div>
                        <div>{suggestion.fix}</div>
                      </div>

                      <div className="text-xs text-gray-600 mt-1">
                        <div className="font-medium">Impact:</div>
                        <div>{suggestion.impact}</div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() =>
                          setSelectedSuggestion(
                            selectedSuggestion === suggestion
                              ? null
                              : suggestion
                          )
                        }
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        {selectedSuggestion === suggestion ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form JSON Editor */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form JSON</h3>
        <textarea
          value={JSON.stringify(formJson, null, 2)}
          onChange={(e) => {
            try {
              const newFormJson = JSON.parse(e.target.value);
              setFormJson(newFormJson);
              onFormUpdate?.(newFormJson);
            } catch {
              // Invalid JSON, but keep the text for editing
            }
          }}
          className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
          placeholder="Enter form JSON here..."
        />
        <div className="mt-2 flex space-x-2">
          <button
            onClick={() => analyzeFormQuality(formJson)}
            disabled={isAnalyzing}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Quality'}
          </button>
          <button
            onClick={() => {
              try {
                const formatted = JSON.stringify(
                  JSON.parse(JSON.stringify(formJson)),
                  null,
                  2
                );
                setFormJson(JSON.parse(formatted) as Record<string, unknown>);
              } catch {
                console.error('Failed to format JSON');
              }
            }}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Format JSON
          </button>
        </div>
      </div>
    </div>
  );
}
