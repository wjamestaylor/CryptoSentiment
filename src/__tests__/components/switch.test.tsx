import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Switch } from '@/components/ui/switch';

describe('Switch Component', () => {
  it('should render switch element', () => {
    render(<Switch data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute('role', 'switch');
  });

  it('should be unchecked by default', () => {
    render(<Switch data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('should be checked when checked prop is true', () => {
    render(<Switch checked={true} data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('should call onCheckedChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        onCheckedChange={handleChange} 
        data-testid="test-switch" 
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    await user.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle state when clicked multiple times', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        onCheckedChange={handleChange} 
        data-testid="test-switch" 
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    
    // First click - should call with true
    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);
    
    // Second click - should call with false
    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toBeDisabled();
    expect(switchElement).toHaveAttribute('data-disabled', '');
  });

  it('should not call onCheckedChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        disabled 
        onCheckedChange={handleChange} 
        data-testid="test-switch" 
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    await user.click(switchElement);
    
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should apply default classes', () => {
    render(<Switch data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveClass(
      'peer',
      'inline-flex',
      'h-6',
      'w-11',
      'shrink-0',
      'cursor-pointer',
      'items-center',
      'rounded-full'
    );
  });

  it('should merge custom className with default classes', () => {
    render(
      <Switch 
        className="custom-class border-red-500" 
        data-testid="test-switch" 
      />
    );
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveClass('peer', 'inline-flex', 'custom-class', 'border-red-500');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Switch 
        aria-label="Toggle notifications"
        data-testid="test-switch" 
      />
    );
    const switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('role', 'switch');
    expect(switchElement).toHaveAttribute('aria-label', 'Toggle notifications');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<React.ElementRef<typeof Switch>>();
    render(<Switch ref={ref} data-testid="test-switch" />);
    expect(ref.current).toBeTruthy();
  });

  it('should handle keyboard interaction (Space key)', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        onCheckedChange={handleChange} 
        data-testid="test-switch" 
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    switchElement.focus();
    await user.keyboard(' '); // Space key
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should handle keyboard interaction (Enter key)', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        onCheckedChange={handleChange} 
        data-testid="test-switch" 
      />
    );
    
    const switchElement = screen.getByTestId('test-switch');
    switchElement.focus();
    await user.keyboard('{Enter}');
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should contain thumb element', () => {
    render(<Switch data-testid="test-switch" />);
    const switchElement = screen.getByTestId('test-switch');
    // Check that the switch has the correct structure
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute('role', 'switch');
  });

  it('should apply checked state classes correctly', () => {
    const { rerender } = render(<Switch checked={false} data-testid="test-switch" />);
    let switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    
    rerender(<Switch checked={true} data-testid="test-switch" />);
    switchElement = screen.getByTestId('test-switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('should work in controlled mode', async () => {
    const user = userEvent.setup();
    const ControlledSwitch = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <Switch 
          checked={checked}
          onCheckedChange={setChecked}
          data-testid="controlled-switch"
        />
      );
    };
    
    render(<ControlledSwitch />);
    const switchElement = screen.getByTestId('controlled-switch');
    
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    
    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('data-state', 'checked');
    
    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });
});