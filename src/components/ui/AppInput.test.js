import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AppInput from './AppInput';

test('renders labeled input attributes, forwards native props, and displays validation errors', () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <AppInput
      id="email"
      name="email"
      label="Email"
      value=""
      onChange={onChange}
      placeholder="coach@example.com"
      autoComplete="email"
      data-testid="email-field"
    />
  );
  const input = screen.getByLabelText('Email');
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveAttribute('name', 'email');
  expect(input).toHaveAttribute('placeholder', 'coach@example.com');
  expect(input).toHaveAttribute('autocomplete', 'email');
  expect(input).toHaveAttribute('data-testid', 'email-field');
  fireEvent.change(input, { target: { value: 'coach@example.com' } });
  expect(onChange).toHaveBeenCalled();

  rerender(
    <AppInput
      id="email"
      label="Email"
      type="email"
      value="invalid"
      onChange={onChange}
      error="Enter a valid email"
      disabled
      variant="compact"
      className="extra"
    />
  );
  expect(screen.getByLabelText('Email')).toBeDisabled();
  expect(screen.getByLabelText('Email')).toHaveClass('app-input-compact', 'app-input-error', 'extra');
  expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
});
