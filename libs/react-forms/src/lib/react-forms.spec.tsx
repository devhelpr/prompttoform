import { render } from '@testing-library/react';

import ReactForms from './react-forms';

describe('ReactForms', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ReactForms />);
    expect(baseElement).toBeTruthy();
  });
});
