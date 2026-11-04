import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { makeController, mockController, prepareSimulatorTest, setMockController } from "./CricketSimulatorTestSupport";
import CricketSimulator from "./CricketSimulator";

describe("CricketSimulator stage routing", () => {
  beforeEach(prepareSimulatorTest);

test('routes setup and live-match stages and displays saving state for the active game mode', () => {
    setMockController(makeController({ gameMode: 'single' }));
    const { rerender } = render(<CricketSimulator />);
    expect(screen.getByTestId('pre-match')).toHaveAttribute('data-stage', '19');
    expect(screen.queryByRole('button', { name: 'Search Players Worldwide' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Advance Setup' }));
    expect(mockController.goToNextStage).toHaveBeenCalled();

    setMockController(makeController({
      game: { stage: 11 },
      gameMode: 'series',
      isGlobalSaving: true,
    }));
    rerender(<CricketSimulator />);
    expect(screen.getByTestId('live-match')).toHaveAttribute('data-stage', '11');
    expect(screen.getByText('T20 Series')).toBeInTheDocument();
    expect(screen.getByText('Saving match...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Match Primary Action' }));
    expect(mockController.matchPrimaryAction).toHaveBeenCalled();

    setMockController(makeController({ game: { stage: 12 }, gameMode: 'tournament' }));
    rerender(<CricketSimulator />);
    expect(screen.getByText('T20 Tournament')).toBeInTheDocument();
    expect(screen.queryByText('Saving match...')).not.toBeInTheDocument();

    setMockController(makeController({ game: { stage: 22 }, gameMode: 'career' }));
    rerender(<CricketSimulator />);
    expect(screen.getByText('Career — T20')).toBeInTheDocument();
    expect(screen.getByText('Match 1 of 8')).toBeInTheDocument();

    setMockController(makeController({
      game: { stage: 13, selectedStadium: '' },
      gameMode: 'quick',
    }));
    rerender(<CricketSimulator />);
    expect(screen.getByText('T20 Match')).toBeInTheDocument();
    expect(screen.getByText('Venue: India')).toBeInTheDocument();
    expect(screen.getByText('Match 1 of 3')).toBeInTheDocument();
  });
});
