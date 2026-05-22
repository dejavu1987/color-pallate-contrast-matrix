import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContrastMatrix } from './ContrastMatrix';
import { createColor } from '../lib/palette';

describe('ContrastMatrix', () => {
  it('renders N×N cells for a palette of N colors', () => {
    const palette = [createColor('#ffffff'), createColor('#000000'), createColor('#1e88e5')];
    render(<ContrastMatrix palette={palette} onCellClick={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(9);
  });

  it('shows hex/label headers along the top and left', () => {
    const palette = [createColor('#ffffff', 'Surface'), createColor('#000000', 'Ink')];
    render(<ContrastMatrix palette={palette} onCellClick={() => {}} />);
    // Headers appear twice each (once row, once column).
    expect(screen.getAllByText('Surface')).toHaveLength(2);
    expect(screen.getAllByText('Ink')).toHaveLength(2);
  });

  it('calls onCellClick with (rowColor, colColor) when a cell is clicked', () => {
    const palette = [createColor('#ffffff'), createColor('#000000')];
    const onCellClick = vi.fn();
    render(<ContrastMatrix palette={palette} onCellClick={onCellClick} />);
    const cells = screen.getAllByRole('button');
    cells[1].click();
    expect(onCellClick).toHaveBeenCalledTimes(1);
    const call = onCellClick.mock.calls[0];
    expect(call[0].hex).toBe('#ffffff'); // row 0
    expect(call[1].hex).toBe('#000000'); // col 1
  });

  it('renders nothing visible if palette is empty', () => {
    render(<ContrastMatrix palette={[]} onCellClick={() => {}} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
