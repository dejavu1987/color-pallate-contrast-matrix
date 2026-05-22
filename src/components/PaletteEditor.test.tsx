import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaletteEditor } from './PaletteEditor';
import { createColor } from '../lib/palette';

describe('PaletteEditor', () => {
  it('renders one row per color', () => {
    const palette = [createColor('#ffffff'), createColor('#000000')];
    render(<PaletteEditor palette={palette} onChange={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(palette.length * 2); // hex + label per row
  });

  it('appends a color when "Add color" is clicked', async () => {
    const palette = [createColor('#ffffff')];
    const onChange = vi.fn();
    render(<PaletteEditor palette={palette} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /add color/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(2);
  });

  it('removes a color when the row remove button is clicked', () => {
    const c1 = createColor('#ffffff');
    const c2 = createColor('#000000');
    const onChange = vi.fn();
    render(<PaletteEditor palette={[c1, c2]} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(c2.id);
  });

  it('updates label when typing into the label input', async () => {
    const c1 = createColor('#ffffff');
    const onChange = vi.fn();
    render(<PaletteEditor palette={[c1]} onChange={onChange} />);
    const labelInput = screen.getByPlaceholderText(/label/i);
    await userEvent.type(labelInput, 'A');
    expect(onChange).toHaveBeenCalled();
    const lastCallPalette = onChange.mock.calls.at(-1)![0];
    expect(lastCallPalette[0].label).toBe('A');
  });

  it('updates hex when typing a valid hex into the hex input', async () => {
    const c1 = createColor('#ffffff');
    const onChange = vi.fn();
    render(<PaletteEditor palette={[c1]} onChange={onChange} />);
    const hexInput = screen.getByDisplayValue('#ffffff');
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, '#000000');
    const lastCallPalette = onChange.mock.calls.at(-1)![0];
    expect(lastCallPalette[0].hex).toBe('#000000');
  });
});
