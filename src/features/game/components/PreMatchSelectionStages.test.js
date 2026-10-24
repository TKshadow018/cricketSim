import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PreMatchSelectionStages from './PreMatchSelectionStages';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{text}</button>
  ),
}));

const players = [
  { id: 1, name: 'Keeper One', playerType: 'wicketkeeper', isWicketKeeper: true, abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 65, paceAbility: 20, spinAbility: 30 },
  { id: 2, name: 'Player Two', playerType: 'batsman', abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 58, paceAbility: 10, spinAbility: 15 },
];

const makeProps = (overrides = {}) => ({
  stage: matchStatusEnum.SetupTournamentFixtures,
  stageCommonProps: { stageIndex: 1, totalStages: 10 },
  setupBackSlot: <button>Back</button>,
  tournamentMatches: [
    { id: 'R1-M1', round: 1, teamA: 'Falcons', teamB: 'Ravens', date: '2025-01-01' },
    { id: 'R2-M1', round: 2, teamA: 'Falcons', teamB: 'Hawks', date: '' },
  ],
  tournamentUserTeam: 'Falcons',
  tournamentOpponentTeams: ['Ravens', 'Hawks', 'Owls'],
  randomizeTournamentFixtures: jest.fn(),
  confirmTournamentFixtures: jest.fn(),
  updateTournamentFixture: jest.fn(),
  ownSelectedXIIds: [1, 2],
  opponentSelectedXIIds: [1],
  ownAvailablePool: [{ ...players[1], id: 3, name: 'Available Player' }],
  opponentAvailablePool: [{ ...players[0], id: 4, name: 'Opponent Reserve' }],
  ownSelectedXIPlayers: players,
  opponentSelectedXIPlayers: [players[0]],
  ownTeamRoles: { captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 },
  opponentTeamRoles: { captainId: 1, viceCaptainId: null, wicketKeeperId: 1 },
  setOwnRole: jest.fn(),
  setOpponentRole: jest.fn(),
  ownXIReady: true,
  opponentXIReady: true,
  ownRolesReady: true,
  opponentRolesReady: true,
  moveOwnPlayerToXI: jest.fn(),
  removeOwnPlayerFromXI: jest.fn(),
  moveOpponentPlayerToXI: jest.fn(),
  removeOpponentPlayerFromXI: jest.fn(),
  autoPickOwnXI: jest.fn(),
  autoPickOpponentXI: jest.fn(),
  openCustomModal: jest.fn(),
  startMatchWithSelectedXI: jest.fn(),
  goToNextStage: jest.fn(),
  onDropToAvailable: jest.fn(),
  onDropToSelected: jest.fn(),
  onDragStart: jest.fn(),
  onDragEnd: jest.fn(),
  customPlayerModal: { open: false },
  updateCustomField: jest.fn(),
  closeCustomModal: jest.fn(),
  submitCustomPlayer: jest.fn(),
  ...overrides,
});

describe('PreMatchSelectionStages', () => {
  test('edits first-round fixtures and triggers randomize and confirm actions', () => {
    const props = makeProps();
    render(<PreMatchSelectionStages {...props} />);
    expect(screen.getByText('Teams: Falcons • Ravens • Hawks • Owls')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Team A'), { target: { value: 'Ravens' } });
    fireEvent.change(screen.getByLabelText('Team B'), { target: { value: 'Hawks' } });
    fireEvent.change(screen.getByLabelText('Match Date'), { target: { value: '2025-02-01' } });
    expect(props.updateTournamentFixture.mock.calls).toEqual([
      ['R1-M1', 'teamA', 'Ravens'],
      ['R1-M1', 'teamB', 'Hawks'],
      ['R1-M1', 'date', '2025-02-01'],
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Randomize Fixtures' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Fixtures' }));
    expect(props.randomizeTournamentFixtures).toHaveBeenCalled();
    expect(props.confirmTournamentFixtures).toHaveBeenCalled();
    expect(screen.getByText('R1-M1')).toBeInTheDocument();
    expect(screen.queryByText('R2-M1')).not.toBeInTheDocument();
  });

  test('accepts missing tournament matches and blank fixture dates', () => {
    const emptyProps = makeProps({ tournamentMatches: null });
    const { rerender } = render(<PreMatchSelectionStages {...emptyProps} />);
    expect(screen.queryByText('R1-M1')).not.toBeInTheDocument();

    const blankDateProps = makeProps({
      tournamentMatches: [{ id: 'R1-M2', round: 1, teamA: '', teamB: '', date: '' }],
    });
    rerender(<PreMatchSelectionStages {...blankDateProps} />);
    expect(screen.getByLabelText('Match Date')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Match Date'), { target: { value: '2025-03-01' } });
    expect(blankDateProps.updateTournamentFixture).toHaveBeenCalledWith('R1-M2', 'date', '2025-03-01');
  });

  test('supports own and opponent XI management, role constraints, and readiness gates', () => {
    const props = makeProps({ stage: matchStatusEnum.ChooseOwnPlayingXI });
    const { rerender } = render(<PreMatchSelectionStages {...props} />);
    expect(screen.getByText('Selected: 2 / 11 · 9 more to select')).toBeInTheDocument();
    const availableButton = screen.getByRole('button', { name: /Available Player/ });
    const columns = document.querySelectorAll('.sim-xi-column');
    const dataTransfer = { dropEffect: 'none' };
    fireEvent.dragStart(availableButton, { dataTransfer });
    fireEvent.dragEnd(availableButton);
    fireEvent.dragOver(columns[0], { dataTransfer });
    expect(dataTransfer.dropEffect).toBe('move');
    fireEvent.drop(columns[0], { dataTransfer });
    expect(props.onDragStart).toHaveBeenCalledWith(expect.objectContaining({ dataTransfer }), 'own', 'available', 3);
    expect(props.onDragEnd).toHaveBeenCalled();
    expect(props.onDropToAvailable).toHaveBeenCalledWith('own', expect.objectContaining({ dataTransfer }));

    fireEvent.dragOver(columns[1]);
    fireEvent.dragOver(columns[1], { dataTransfer });
    fireEvent.drop(columns[1]);
    expect(props.onDropToSelected).toHaveBeenCalledWith('own', expect.any(Object));
    fireEvent.click(availableButton);
    const selectedButtons = document.querySelectorAll('.sim-xi-column')[1].querySelectorAll('.sim-player-pick-btn');
    fireEvent.dragStart(selectedButtons[1], { dataTransfer });
    fireEvent.click(selectedButtons[1]);
    expect(props.onDragStart).toHaveBeenCalledWith(expect.objectContaining({ dataTransfer }), 'own', 'selected', 2);
    fireEvent.click(screen.getByRole('button', { name: 'Auto Pick 11' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Custom Player' }));
    expect(props.moveOwnPlayerToXI).toHaveBeenCalledWith(3);
    expect(props.removeOwnPlayerFromXI).toHaveBeenCalledWith(2);
    expect(props.autoPickOwnXI).toHaveBeenCalled();
    expect(props.openCustomModal).toHaveBeenCalledWith('own');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();

    const rolePickers = document.querySelectorAll('.sim-role-picker');
    const captainOptions = rolePickers[0].querySelectorAll('button');
    const viceCaptainOptions = rolePickers[1].querySelectorAll('button');
    expect(captainOptions[1]).toBeDisabled();
    expect(viceCaptainOptions[0]).toBeDisabled();
    fireEvent.click(captainOptions[0]);
    fireEvent.click(viceCaptainOptions[1]);
    fireEvent.click(rolePickers[2].querySelector('button'));
    expect(props.setOwnRole).toHaveBeenCalledWith('captainId', 1);
    expect(props.setOwnRole).toHaveBeenCalledWith('viceCaptainId', 2);
    expect(props.setOwnRole).toHaveBeenCalledWith('wicketKeeperId', 1);

    const notReady = makeProps({
      stage: matchStatusEnum.ChooseOwnPlayingXI,
      ownXIReady: false,
      ownRolesReady: false,
    });
    rerender(<PreMatchSelectionStages {...notReady} />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    const opponent = makeProps({ stage: matchStatusEnum.ChooseOpponentPlayingXI });
    rerender(<PreMatchSelectionStages {...opponent} />);
    const opponentAvailable = screen.getByRole('button', { name: /Opponent Reserve/ });
    fireEvent.dragStart(opponentAvailable, { dataTransfer });
    expect(opponent.onDragStart).toHaveBeenCalledWith(expect.objectContaining({ dataTransfer }), 'opponent', 'available', 4);
    fireEvent.click(screen.getByRole('button', { name: 'Auto Pick 11' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Custom Player' }));
    expect(opponent.autoPickOpponentXI).toHaveBeenCalled();
    expect(opponent.openCustomModal).toHaveBeenCalledWith('opponent');
    expect(screen.getByRole('button', { name: 'Start Match' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Start Match' }));
    expect(opponent.startMatchWithSelectedXI).toHaveBeenCalled();
  });

  test('renders and edits the custom-player modal, including close and create paths', () => {
    const props = makeProps({
      stage: matchStatusEnum.ChooseOwnPlayingXI,
      customPlayerModal: {
        open: true,
        teamKey: 'own',
        name: 'New Player',
        abilityToPlayPaceBall: 65,
        abilityToPlaySpinBall: 60,
        battingAggresion: 55,
        spinAbility: 30,
        paceAbility: 40,
        isWicketKeeper: false,
      },
    });
    render(<PreMatchSelectionStages {...props} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Created' } });
    fireEvent.change(screen.getByLabelText('Ability vs Pace'), { target: { value: '75' } });
    fireEvent.change(screen.getByLabelText('Ability vs Spin'), { target: { value: '76' } });
    fireEvent.change(screen.getByLabelText('Batting Aggression'), { target: { value: '77' } });
    fireEvent.change(screen.getByLabelText('Spin Ability'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('Pace Ability'), { target: { value: '46' } });
    fireEvent.click(screen.getByLabelText('Is Wicketkeeper'));
    expect(props.updateCustomField.mock.calls).toEqual([
      ['name', 'Created'],
      ['abilityToPlayPaceBall', '75'],
      ['abilityToPlaySpinBall', '76'],
      ['battingAggresion', '77'],
      ['spinAbility', '45'],
      ['paceAbility', '46'],
      ['isWicketKeeper', true],
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(props.submitCustomPlayer).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(props.closeCustomModal).toHaveBeenCalledTimes(2);
  });

  test('renders a complete XI, disabled available players, and missing stat defaults', () => {
    const sparsePlayer = {
      id: 9,
      name: 'Sparse Keeper',
      isWicketKeeper: true,
      abilityToPlayPaceBall: 0,
      abilityToPlaySpinBall: 0,
      paceAbility: 0,
      spinAbility: 0,
    };
    const props = makeProps({
      stage: matchStatusEnum.ChooseOwnPlayingXI,
      ownSelectedXIIds: Array.from({ length: 11 }, (_, index) => index + 1),
      ownSelectedXIPlayers: [sparsePlayer],
      ownAvailablePool: [sparsePlayer],
      ownTeamRoles: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    });
    render(<PreMatchSelectionStages {...props} />);

    expect(screen.getByText('Selected: 11 / 11 · XI complete')).toBeInTheDocument();
    expect(screen.getAllByText('BP 0')).toHaveLength(2);
    expect(screen.getAllByText('BS 0')).toHaveLength(2);
    expect(screen.getAllByText('P 0')).toHaveLength(2);
    expect(screen.getAllByText('S 0')).toHaveLength(2);
    expect(document.querySelector('.sim-xi-column .sim-player-pick-btn')).toBeDisabled();
    expect(document.querySelector('.sim-role-picker:last-child .sim-role-option-btn')).not.toHaveClass('active');
    const column = document.querySelector('.sim-xi-column');
    fireEvent.dragOver(column, { dataTransfer: null });
  });
});
