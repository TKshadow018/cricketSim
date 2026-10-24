import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import PreMatchSelectionStages from './PreMatchSelectionStages';

const createProps = (selectedCount = 11) => {
  const selectedPlayers = Array.from({ length: selectedCount }, (_, index) => ({
    id: index + 1,
    name: `Player ${index + 1}`,
    playerType: 'batsman',
    isWicketKeeper: index === 0,
    abilityToPlayPaceBall: 75,
    abilityToPlaySpinBall: 70,
    paceAbility: 10,
    spinAbility: 10,
  }));

  return {
    stage: matchStatusEnum.ChooseOwnPlayingXI,
    requireBowlingQuota: true,
    stageCommonProps: { stageIndex: 1, totalStages: 2, className: '' },
    setupBackSlot: null,
    tournamentMatches: [],
    tournamentUserTeam: '',
    tournamentOpponentTeams: [],
    ownSelectedXIIds: selectedPlayers.map((player) => player.id),
    opponentSelectedXIIds: [],
    ownBattingOrderIds: selectedPlayers.map((player) => player.id).reverse(),
    opponentBattingOrderIds: [],
    ownAvailablePool: [],
    opponentAvailablePool: [],
    ownSelectedXIPlayers: selectedPlayers,
    opponentSelectedXIPlayers: [],
    ownTeamRoles: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    opponentTeamRoles: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    ownXIReady: selectedCount === 11,
    opponentXIReady: false,
    ownRolesReady: false,
    opponentRolesReady: false,
    autoPositionError: '',
    customPlayerModal: { open: false },
    autoPositionOwnXI: jest.fn(),
    autoPositionOpponentXI: jest.fn(),
    openCustomModal: jest.fn(),
    moveOwnPlayerToXI: jest.fn(),
    removeOwnPlayerFromXI: jest.fn(),
    moveOpponentPlayerToXI: jest.fn(),
    removeOpponentPlayerFromXI: jest.fn(),
    setOwnRole: jest.fn(),
    setOpponentRole: jest.fn(),
    autoPickOwnXI: jest.fn(),
    autoPickOpponentXI: jest.fn(),
    startMatchWithSelectedXI: jest.fn(),
    goToNextStage: jest.fn(),
    onDropToAvailable: jest.fn(),
    onDropToSelected: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    updateCustomField: jest.fn(),
    closeCustomModal: jest.fn(),
    submitCustomPlayer: jest.fn(),
  };
};

describe('PreMatchSelectionStages batting-order action', () => {
  test('keeps auto-position disabled until all 11 players are selected', () => {
    const { rerender } = render(<PreMatchSelectionStages {...createProps(10)} />);
    expect(screen.getByRole('button', { name: 'Auto Select Batting Order' })).toBeDisabled();

    rerender(<PreMatchSelectionStages {...createProps(11)} />);
    expect(screen.getByRole('button', { name: 'Auto Select Batting Order' })).toBeEnabled();
  });

  test('runs the auto-position action and shows assigned batting slots', () => {
    const props = createProps(11);
    render(<PreMatchSelectionStages {...props} />);

    const autoPositionButton = screen.getByRole('button', { name: 'Auto Select Batting Order' });
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(autoPositionButton.compareDocumentPosition(continueButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(autoPositionButton);

    expect(props.autoPositionOwnXI).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Batting position 11/)).toBeInTheDocument();
  });

  test('explains the selection requirements next to the disabled Continue button', () => {
    const props = createProps(10);
    render(<PreMatchSelectionStages {...props} />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.getByText(/Select exactly 11 players \(10\/11 selected\)/)).toBeInTheDocument();
  });

  test('explains missing team roles next to Continue when the XI is complete', () => {
    const props = createProps(11);
    props.ownTeamRoles = { captainId: null, viceCaptainId: null, wicketKeeperId: null };
    render(<PreMatchSelectionStages {...props} />);

    expect(screen.getByText(/Choose a captain\. Choose a different vice captain\. Choose a wicketkeeper\./)).toBeInTheDocument();
  });

  test('requires at least five qualifying bowling-role players before Continue', () => {
    const props = createProps(11);
    props.ownSelectedXIPlayers = props.ownSelectedXIPlayers.map((player, index) =>
      index >= 1 && index <= 4
        ? {
            ...player,
            playerType: undefined,
            abilityToPlayPaceBall: 40,
            abilityToPlaySpinBall: 40,
            paceAbility: 61,
          }
        : player
    );
    props.ownTeamRoles = {
      captainId: 2,
      viceCaptainId: 3,
      wicketKeeperId: 1,
    };
    render(<PreMatchSelectionStages {...props} />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.getByText(/Select at least 5 bowling-role players \(4\/5 selected\)/)).toBeInTheDocument();
  });
});
