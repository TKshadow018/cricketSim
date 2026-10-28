import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BattingTargetMap from './BattingTargetMap';
import { BATTING_TARGETS } from '../utils/battingTactics';

describe('BattingTargetMap', () => {
  test('keeps straight at the bottom with field sectors on the correct sides', () => {
    render(<BattingTargetMap target="straight" onTargetChange={jest.fn()} />);

    expect(screen.getByTestId('batting-target-map-artwork'))
      .toHaveAttribute('transform', 'matrix(1 0 0 -1 0 176)');
  });

  test('marks sectors and lets users select them with clicks and keyboard', () => {
    const onTargetChange = jest.fn();
    render(<BattingTargetMap target="cover" onTargetChange={onTargetChange} />);

    expect(screen.getByRole('group', { name: 'Choose a scoring sector on the batting target map' }))
      .toBeInTheDocument();
    const sectors = BATTING_TARGETS.map(({ key }) =>
      screen.getByTestId(`batting-target-sector-${key}`)
    );

    expect(sectors).toHaveLength(BATTING_TARGETS.length);
    expect(sectors).toHaveLength(9);
    expect(screen.getByTestId('batting-target-sector-cover')).toHaveClass('active');
    expect(screen.getByTestId('batting-target-sector-straight')).not.toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Select Cover scoring lane' }))
      .toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Select Midwicket scoring lane' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select Fine leg scoring lane' }), {
      key: 'Enter',
    });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select Third man scoring lane' }), {
      key: ' ',
    });

    expect(onTargetChange).toHaveBeenNthCalledWith(1, 'midWicket');
    expect(onTargetChange).toHaveBeenNthCalledWith(2, 'fineLeg');
    expect(onTargetChange).toHaveBeenNthCalledWith(3, 'thirdMan');
  });

  test('maps saved broad-side targets to their closest detailed sector', () => {
    render(<BattingTargetMap target="leg" onTargetChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Select Midwicket scoring lane' }))
      .toHaveAttribute('aria-pressed', 'true');
  });
});
