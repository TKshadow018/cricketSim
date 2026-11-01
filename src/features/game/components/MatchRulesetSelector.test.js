import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MatchRulesetSelector from './MatchRulesetSelector';

test('exposes and changes both match rulesets using accessible radio controls', () => {
  const onChange = jest.fn();
  const { rerender } = render(<MatchRulesetSelector value="arcade" onChange={onChange} />);
  expect(screen.getByRole('radio', { name: /arcade/i })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: /realism/i }));
  expect(onChange).toHaveBeenCalledWith('realism');
  rerender(<MatchRulesetSelector value="realism" onChange={onChange} />);
  expect(screen.getByRole('radio', { name: /realism/i })).toBeChecked();
});
