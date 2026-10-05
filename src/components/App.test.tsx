import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('renders the title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Contrast Matrix/i })).toBeInTheDocument();
  });

  it('starts with a default palette of at least 2 colors and renders the matrix', () => {
    render(<App />);
    const cells = screen.getAllByLabelText(/contrast ratio/i);
    expect(cells.length).toBeGreaterThanOrEqual(4); // 2x2 minimum
  });

  it('opens the detail drawer when a matrix cell is clicked', () => {
    render(<App />);
    const cells = screen.getAllByLabelText(/contrast ratio/i);
    fireEvent.click(cells[0]);
    expect(screen.getByRole('dialog', { name: /contrast details/i })).toBeInTheDocument();
  });

  it('hydrates palette from URL hash when present on mount', () => {
    window.history.replaceState(null, '', '/#p=ff0000,00ff00');
    render(<App />);
    const cells = screen.getAllByLabelText(/contrast ratio/i);
    expect(cells).toHaveLength(4);
  });
});
