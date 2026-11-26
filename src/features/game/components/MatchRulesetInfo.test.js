import React from 'react';
import { render, screen } from '@testing-library/react';
import MatchRulesetInfo from './MatchRulesetInfo';

test('describes the unified match rules without offering separate modes', () => {
  render(<MatchRulesetInfo />);
  expect(screen.getByText('Unified Match Rules')).toBeInTheDocument();
  expect(screen.getByText(/Realistic engine and field regulations with Super Shots, Special Deliveries, and skill\/captain bonuses/)).toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
});
