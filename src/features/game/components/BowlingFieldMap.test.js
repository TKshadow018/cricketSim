import React from 'react';
import { render, screen } from '@testing-library/react';
import BowlingFieldMap from './BowlingFieldMap';
import { fieldPositionImage, fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';

describe('BowlingFieldMap', () => {
  test.each(fieldSettingList)('renders the $label setting over the cricket field image', (setting) => {
    render(<BowlingFieldMap preset={setting.key} />);

    expect(screen.getByRole('img', { name: new RegExp(`${setting.label} layout`) }))
      .toBeInTheDocument();
    expect(screen.getByTestId('cricket-field-artwork'))
      .toHaveAttribute('href', fieldPositionImage.src);
    expect(screen.getByTestId('field-position-markers').children).toHaveLength(setting.positions.length);

    setting.positions.forEach((positionKey) => {
      const position = fieldPositionList.find(({ key }) => key === positionKey);
      const marker = screen.getByTestId(`field-position-${positionKey}`);
      expect(marker).toHaveAttribute('cx', String(position.x));
      expect(marker).toHaveAttribute('cy', String(position.y));
      expect(marker.querySelector('title')).toHaveTextContent(position.name);
    });
  });

  test('falls back to the balanced field when a preset is unknown', () => {
    render(<BowlingFieldMap preset="unknown" />);

    expect(screen.getByRole('img', { name: /Balanced field layout/ })).toBeInTheDocument();
  });
});
