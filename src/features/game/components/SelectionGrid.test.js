import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SelectionGrid from './SelectionGrid';

describe('SelectionGrid', () => {
  test('renders card selection and secondary actions as separate buttons', () => {
    const onSelect = jest.fn();
    const item = { key: 'voice', name: 'Sample Voice' };

    render(
      <SelectionGrid
        items={[item]}
        selectedKey=""
        onSelect={onSelect}
        keyOf={(choice) => choice.key}
        renderTitle={(choice) => choice.name}
        renderDescription={() => <small>Speech synthesis commentator</small>}
        renderAction={() => <button type="button">Test sound</button>}
      />
    );

    const selectButton = screen.getByRole('button', { name: /Sample Voice/ });
    const actionButton = screen.getByRole('button', { name: 'Test sound' });

    expect(document.querySelector('button button')).toBeNull();
    fireEvent.click(actionButton);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(selectButton);
    expect(onSelect).toHaveBeenCalledWith(item);
  });
});
