import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ThemeToggle', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {component}
      </ThemeProvider>
    );
  };

  it('renders theme toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('opens dropdown menu when clicked', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('has sun and moon icons with proper transition classes', () => {
    renderWithTheme(<ThemeToggle />);
    
    const sunIcon = screen.getByRole('button').querySelector('svg');
    expect(sunIcon).toHaveClass('transition-all');
  });

  it('shows screen reader text', () => {
    renderWithTheme(<ThemeToggle />);
    
    expect(screen.getByText('Toggle theme')).toHaveClass('sr-only');
  });
});