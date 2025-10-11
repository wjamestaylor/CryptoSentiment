import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Label } from '@/components/ui/label';

describe('Label Component', () => {
  it('should render label with text', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should render as label element', () => {
    render(<Label data-testid="test-label">Form Label</Label>);
    const label = screen.getByTestId('test-label');
    expect(label.tagName).toBe('LABEL');
  });

  it('should apply default classes', () => {
    render(<Label data-testid="test-label">Styled Label</Label>);
    const label = screen.getByTestId('test-label');
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none');
  });

  it('should merge custom className with default classes', () => {
    render(
      <Label className="custom-class text-red-500" data-testid="test-label">
        Custom Label
      </Label>
    );
    const label = screen.getByTestId('test-label');
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none', 'custom-class', 'text-red-500');
  });

  it('should forward all props to the underlying element', () => {
    render(
      <Label
        htmlFor="test-input"
        data-testid="test-label"
        aria-label="Test ARIA Label"
      >
        Input Label
      </Label>
    );
    const label = screen.getByTestId('test-label');
    expect(label).toHaveAttribute('for', 'test-input');
    expect(label).toHaveAttribute('aria-label', 'Test ARIA Label');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current?.textContent).toBe('Ref Label');
  });

  it('should work with form association', () => {
    render(
      <div>
        <Label htmlFor="email-input" data-testid="email-label">
          Email Address
        </Label>
        <input id="email-input" type="email" />
      </div>
    );
    
    const label = screen.getByTestId('email-label');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'email-input');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('should handle peer-disabled state classes', () => {
    render(
      <div>
        <Label data-testid="test-label" htmlFor="disabled-input">
          Disabled Field
        </Label>
        <input id="disabled-input" disabled />
      </div>
    );
    
    const label = screen.getByTestId('test-label');
    // The peer-disabled classes are applied via CSS when the peer is disabled
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('should render children correctly', () => {
    render(
      <Label data-testid="test-label">
        <span>Required</span>
        <span className="text-red-500">*</span>
      </Label>
    );
    
    const label = screen.getByTestId('test-label');
    expect(label).toContainHTML('<span>Required</span><span class="text-red-500">*</span>');
  });

  it('should handle empty content', () => {
    render(<Label data-testid="empty-label" />);
    const label = screen.getByTestId('empty-label');
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('');
  });
});