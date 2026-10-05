import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellDetailDrawer } from './CellDetailDrawer';
import { createColor } from '../lib/palette';

describe('CellDetailDrawer', () => {
  it('shows nothing when selection is null', () => {
    const { container } = render(<CellDetailDrawer selection={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the ratio for a selection', () => {
    const row = createColor('#000000', 'Ink');
    const col = createColor('#ffffff', 'Surface');
    render(
      <CellDetailDrawer
        selection={{ row, col }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/21\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Ink/)).toBeInTheDocument();
    expect(screen.getByText(/Surface/)).toBeInTheDocument();
  });

  it('closes on ESC key', () => {
    const onClose = vi.fn();
    const row = createColor('#000000');
    const col = createColor('#ffffff');
    render(<CellDetailDrawer selection={{ row, col }} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    const row = createColor('#000000');
    const col = createColor('#ffffff');
    render(<CellDetailDrawer selection={{ row, col }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
