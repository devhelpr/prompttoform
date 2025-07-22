import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UpdateAccordion } from './UpdateAccordion';
import { FormUpdate } from '../../services/indexeddb';

// Mock the FormUpdate interface
const mockUpdates: FormUpdate[] = [
  {
    id: 'update-1',
    sessionId: 'session-1',
    updatePrompt: 'Add a new field for phone number',
    updatedJson: '{"app":{"title":"Updated Form","pages":[]}}',
    createdAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 'update-2',
    sessionId: 'session-1',
    updatePrompt: 'Change the form title to "Contact Form"',
    updatedJson: '{"app":{"title":"Contact Form","pages":[]}}',
    createdAt: new Date('2024-01-01T11:00:00Z'),
  },
];

describe('UpdateAccordion', () => {
  it('should render updates in reverse chronological order', () => {
    const mockOnLoadUpdate = vi.fn();
    render(
      <UpdateAccordion updates={mockUpdates} onLoadUpdate={mockOnLoadUpdate} />
    );

    // Check that updates are displayed (most recent first)
    expect(screen.getByText('Update #1')).toBeTruthy(); // Most recent
    expect(screen.getByText('Update #2')).toBeTruthy(); // Oldest
  });

  it('should show update prompts when expanded', async () => {
    const mockOnLoadUpdate = vi.fn();
    render(
      <UpdateAccordion updates={mockUpdates} onLoadUpdate={mockOnLoadUpdate} />
    );

    // Click on the first update to expand it
    const firstUpdateButton = screen.getByText('Update #1').closest('button');
    fireEvent.click(firstUpdateButton!);

    // Wait for the content to appear
    await waitFor(() => {
      expect(screen.getByText('Add a new field for phone number')).toBeTruthy();
    });

    // Check that the "Load This Version" button is present
    expect(screen.getByText('Load This Version')).toBeTruthy();
  });

  it('should call onLoadUpdate when "Load This Version" is clicked', async () => {
    const mockOnLoadUpdate = vi.fn();
    render(
      <UpdateAccordion updates={mockUpdates} onLoadUpdate={mockOnLoadUpdate} />
    );

    // Expand the first update (most recent)
    const firstUpdateButton = screen.getByText('Update #1').closest('button');
    fireEvent.click(firstUpdateButton!);

    // Wait for the content to appear and click "Load This Version"
    await waitFor(() => {
      const loadButton = screen.getByText('Load This Version');
      fireEvent.click(loadButton);
    });

    // Verify that onLoadUpdate was called with the correct update (most recent first)
    expect(mockOnLoadUpdate).toHaveBeenCalledWith(mockUpdates[1]); // Update #1 is the most recent
  });

  it('should toggle expansion when clicking on update headers', async () => {
    const mockOnLoadUpdate = vi.fn();
    render(
      <UpdateAccordion updates={mockUpdates} onLoadUpdate={mockOnLoadUpdate} />
    );

    const firstUpdateButton = screen.getByText('Update #1').closest('button');

    // Initially, the full content should not be visible (only truncated in header)
    expect(screen.queryByText('Update Prompt:')).toBeNull();

    // Click to expand
    fireEvent.click(firstUpdateButton!);
    await waitFor(() => {
      expect(screen.getByText('Update Prompt:')).toBeTruthy();
    });

    // Click to collapse
    fireEvent.click(firstUpdateButton!);
    await waitFor(() => {
      expect(screen.queryByText('Update Prompt:')).toBeNull();
    });
  });

  it('should display formatted dates', () => {
    const mockOnLoadUpdate = vi.fn();
    render(
      <UpdateAccordion updates={mockUpdates} onLoadUpdate={mockOnLoadUpdate} />
    );

    // Check that dates are displayed (format may vary by locale, so we check for presence)
    expect(screen.getAllByText(/1\/1\/2024/)).toHaveLength(2);
  });

  it('should truncate long update prompts in the header', () => {
    const longPromptUpdate: FormUpdate = {
      id: 'update-long',
      sessionId: 'session-1',
      updatePrompt:
        'This is a very long update prompt that should be truncated when displayed in the accordion header to prevent the UI from becoming too wide and to maintain a clean layout',
      updatedJson: '{"app":{"title":"Test","pages":[]}}',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    };

    const mockOnLoadUpdate = vi.fn();
    render(
      <UpdateAccordion
        updates={[longPromptUpdate]}
        onLoadUpdate={mockOnLoadUpdate}
      />
    );

    // The truncated text should be visible in the header
    expect(
      screen.getByText(/This is a very long update prompt that s\.\.\./)
    ).toBeTruthy();

    // The full text should be visible when expanded
    const updateButton = screen.getByText('Update #1').closest('button');
    fireEvent.click(updateButton!);

    expect(screen.getByText(longPromptUpdate.updatePrompt)).toBeTruthy();
  });
});
