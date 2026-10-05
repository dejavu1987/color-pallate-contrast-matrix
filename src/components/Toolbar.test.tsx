import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import { createColor } from '../lib/palette';

describe('Toolbar', () => {
  it('renders Share, CSV, PNG, and Clear buttons', () => {
    render(
      <Toolbar
        palette={[createColor('#fff'), createColor('#000')]}
        matrixRef={{ current: null }}
        onClear={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onClear (after confirm) when Clear is clicked', () => {
    const onClear = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <Toolbar palette={[]} matrixRef={{ current: null }} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClear if confirm is cancelled', () => {
    const onClear = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <Toolbar palette={[]} matrixRef={{ current: null }} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).not.toHaveBeenCalled();
  });
});
