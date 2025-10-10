import { Input } from '@/components/ui/input';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Input Component', () => {
  it('renders input with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
  });

  it('handles disabled state', () => {
    render(<Input disabled data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
  });

  it('handles different input types', () => {
    render(<Input type="email" data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} data-testid="input" />);
    
    expect(ref.current).toBeTruthy();
  });
});