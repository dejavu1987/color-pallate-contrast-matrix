import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatrixCell } from './MatrixCell';
import { verdict } from '../lib/contrast';

describe('MatrixCell', () => {
  it('renders the ratio to 2 decimals', () => {
    render(<MatrixCell bg="#ffffff" fg="#000000" v={verdict(21)} onClick={() => {}} />);
    expect(screen.getByText('21.00')).toBeInTheDocument();
  });

  it('uses background and foreground colors via inline style', () => {
    render(<MatrixCell bg="#ffffff" fg="#000000" v={verdict(21)} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ backgroundColor: '#ffffff', color: '#000000' });
  });

  it('renders an aria-label describing the combination', () => {
    render(<MatrixCell bg="#ffffff" fg="#000000" v={verdict(21)} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toMatch(/#ffffff/);
    expect(btn.getAttribute('aria-label')).toMatch(/#000000/);
    expect(btn.getAttribute('aria-label')).toMatch(/21\.00/);
  });

  it('mutes the cell when bg and fg are equal (diagonal)', () => {
    render(<MatrixCell bg="#808080" fg="#808080" v={verdict(1)} onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-diagonal', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<MatrixCell bg="#fff" fg="#000" v={verdict(21)} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
