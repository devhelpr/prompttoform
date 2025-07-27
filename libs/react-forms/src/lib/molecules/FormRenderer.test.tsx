import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormRenderer } from './FormRenderer';
import { FormDefinition } from '../interfaces/form-interfaces';

// Mock form data for testing
const singlePageForm: FormDefinition = {
  app: {
    title: 'Single Page Form',
    pages: [
      {
        id: 'page1',
        title: 'Page 1',
        route: '/page1',
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Name',
            validation: { required: true },
          },
        ],
      },
    ],
  },
};

const multiPageForm: FormDefinition = {
  app: {
    title: 'Multi Page Form',
    pages: [
      {
        id: 'page1',
        title: 'Page 1',
        route: '/page1',
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Name',
            validation: { required: true },
          },
        ],
      },
      {
        id: 'page2',
        title: 'Page 2',
        route: '/page2',
        components: [
          {
            type: 'input',
            id: 'email',
            label: 'Email',
            validation: { required: true },
          },
        ],
      },
    ],
  },
};

describe('FormRenderer', () => {
  describe('disabled prop', () => {
    it('should disable form fields when disabled is true', () => {
      render(<FormRenderer formJson={singlePageForm} disabled={true} />);

      const input = screen.getByLabelText(/Name/);
      expect(input).toBeDisabled();
    });

    it('should not disable form fields when disabled is false', () => {
      render(<FormRenderer formJson={singlePageForm} disabled={false} />);

      const input = screen.getByLabelText(/Name/);
      expect(input).not.toBeDisabled();
    });

    it('should not disable form fields when disabled is not provided', () => {
      render(<FormRenderer formJson={singlePageForm} />);

      const input = screen.getByLabelText(/Name/);
      expect(input).not.toBeDisabled();
    });

    it('should hide next/prev buttons when disabled is true', () => {
      render(<FormRenderer formJson={multiPageForm} disabled={true} />);

      expect(screen.queryByText('Next')).not.toBeInTheDocument();
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('should show next/prev buttons when disabled is false', () => {
      render(<FormRenderer formJson={multiPageForm} disabled={false} />);

      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });

  describe('step indicator', () => {
    it('should not render step indicator for single page form', () => {
      render(<FormRenderer formJson={singlePageForm} />);

      expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('should render step indicator for multi page form', () => {
      render(<FormRenderer formJson={multiPageForm} />);

      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    });

    it('should not render step indicator for form with no pages', () => {
      const noPagesForm: FormDefinition = {
        app: {
          title: 'No Pages Form',
          pages: [],
        },
      };

      render(<FormRenderer formJson={noPagesForm} />);

      expect(screen.queryByText(/Step \d+ of \d+/)).not.toBeInTheDocument();
    });
  });

  describe('form title and info', () => {
    it('should show page count info when not disabled and multiple pages', () => {
      render(<FormRenderer formJson={multiPageForm} disabled={false} />);

      expect(
        screen.getByText('This application has 2 pages')
      ).toBeInTheDocument();
    });

    it('should not show page count info when disabled', () => {
      render(<FormRenderer formJson={multiPageForm} disabled={true} />);

      expect(
        screen.queryByText('This application has 2 pages')
      ).not.toBeInTheDocument();
    });
  });
});
