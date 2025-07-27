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

  describe('prefixId prop', () => {
    it('should prefix field IDs when prefixId is provided', () => {
      render(<FormRenderer formJson={singlePageForm} prefixId="my-form" />);

      const input = screen.getByLabelText(/Name/);
      expect(input).toHaveAttribute('id', 'my-form-name');
    });

    it('should not prefix field IDs when prefixId is not provided', () => {
      render(<FormRenderer formJson={singlePageForm} />);

      const input = screen.getByLabelText(/Name/);
      expect(input).toHaveAttribute('id', 'name');
    });

    it('should prefix field IDs for all field types', () => {
      const formWithMultipleFields: FormDefinition = {
        app: {
          title: 'Multiple Field Types',
          pages: [
            {
              id: 'page1',
              title: 'Page 1',
              route: '/page1',
              components: [
                {
                  type: 'input',
                  id: 'text-field',
                  label: 'Text Field',
                },
                {
                  type: 'textarea',
                  id: 'textarea-field',
                  label: 'Textarea Field',
                },
                {
                  type: 'select',
                  id: 'select-field',
                  label: 'Select Field',
                  props: {
                    options: [
                      { label: 'Option 1', value: '1' },
                      { label: 'Option 2', value: '2' },
                    ],
                  },
                },
                {
                  type: 'date',
                  id: 'date-field',
                  label: 'Date Field',
                },
                {
                  type: 'radio',
                  id: 'radio-field',
                  label: 'Radio Field',
                  props: {
                    options: [
                      { label: 'Option 1', value: '1' },
                      { label: 'Option 2', value: '2' },
                    ],
                  },
                },
                {
                  type: 'checkbox',
                  id: 'checkbox-field',
                  label: 'Checkbox Field',
                },
              ],
            },
          ],
        },
      };

      render(
        <FormRenderer formJson={formWithMultipleFields} prefixId="test" />
      );

      expect(screen.getByLabelText(/Text Field/)).toHaveAttribute(
        'id',
        'test-text-field'
      );
      expect(screen.getByLabelText(/Textarea Field/)).toHaveAttribute(
        'id',
        'test-textarea-field'
      );
      expect(screen.getByLabelText(/Select Field/)).toHaveAttribute(
        'id',
        'test-select-field'
      );
      expect(screen.getByLabelText(/Date Field/)).toHaveAttribute(
        'id',
        'test-date-field'
      );
      expect(screen.getByLabelText(/Option 1/)).toHaveAttribute(
        'id',
        'test-radio-field-0'
      );
      expect(screen.getByLabelText(/Checkbox Field/)).toHaveAttribute(
        'id',
        'test-checkbox-field'
      );
    });

    it('should prefix section field IDs', () => {
      const formWithSection: FormDefinition = {
        app: {
          title: 'Form with Section',
          pages: [
            {
              id: 'page1',
              title: 'Page 1',
              route: '/page1',
              components: [
                {
                  type: 'section',
                  id: 'my-section',
                  label: 'My Section',
                  children: [
                    {
                      type: 'input',
                      id: 'nested-field',
                      label: 'Nested Field',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      render(
        <FormRenderer formJson={formWithSection} prefixId="section-test" />
      );

      const nestedInput = screen.getByLabelText(/Nested Field/);
      expect(nestedInput).toHaveAttribute(
        'id',
        'section-test-section-test-my-section.nested-field'
      );
    });

    it('should work with disabled state', () => {
      render(
        <FormRenderer
          formJson={singlePageForm}
          prefixId="disabled-form"
          disabled={true}
        />
      );

      const input = screen.getByLabelText(/Name/);
      expect(input).toHaveAttribute('id', 'disabled-form-name');
      expect(input).toBeDisabled();
    });
  });
});
