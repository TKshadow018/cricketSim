import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PreMatchStages from './PreMatchStages';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick }) => <button onClick={onClick}>{text}</button>,
}));

jest.mock('./PreMatchBasicStages', () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="basic-stage">
      <span>{props.commentatorDisplayName}</span>
      {props.setupBackSlot}
      <button onClick={props.setSaveToDelete}>Set delete state</button>
    </div>
  ),
}));

jest.mock('./PreMatchSelectionStages', () => ({
  __esModule: true,
  default: (props) => {
    const ReactActual = jest.requireActual('react');
    const makeEvent = (value = '') => {
      const preventDefault = jest.fn();
      return {
        preventDefault,
        dataTransfer: {
          effectAllowed: '',
          dropEffect: '',
          getData: () => value,
          setData: jest.fn(),
        },
      };
    };
    return ReactActual.createElement(
      'div',
      { 'data-testid': 'selection-stage' },
      ReactActual.createElement('span', null, props.customPlayerModal.open ? 'Modal open' : 'Modal closed'),
      ReactActual.createElement('button', {
        onClick: () => props.onDragStart(makeEvent(), 'own', 'selected', 1),
      }, 'Drag selected own'),
      ReactActual.createElement('button', {
        onClick: () => props.onDragStart({}, 'own', 'selected', 7),
      }, 'Drag without data transfer'),
      ReactActual.createElement('button', {
        onClick: () => props.onDragStart(makeEvent(), 'own', 'available', 2),
      }, 'Drag available own'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToAvailable('own', makeEvent()),
      }, 'Drop to available'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToSelected('own', makeEvent()),
      }, 'Drop to selected fallback'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToSelected('own', makeEvent('not-json')),
      }, 'Drop invalid JSON'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToSelected('own', makeEvent(JSON.stringify({}))),
      }, 'Drop incomplete payload'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToAvailable('own', makeEvent()),
      }, 'Drop available without payload'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToSelected('own', makeEvent(JSON.stringify({ teamKey: 'opponent', sourceList: 'available', playerId: 3 }))),
      }, 'Drop different team'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToSelected('own', makeEvent(JSON.stringify({ teamKey: 'own', sourceList: 'selected', playerId: 4 }))),
      }, 'Drop wrong source'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToSelected('opponent', makeEvent(JSON.stringify({ teamKey: 'opponent', sourceList: 'available', playerId: 5 }))),
      }, 'Drop opponent player'),
      ReactActual.createElement('button', {
        onClick: () => props.moveOwnPlayerInBattingOrder('own-1', -1),
      }, 'Move own player in batting order'),
      ReactActual.createElement('button', {
        onClick: () => props.moveOpponentPlayerInBattingOrder('opponent-1', 1),
      }, 'Move opponent player in batting order'),
      ReactActual.createElement('button', {
        onClick: () => props.onDropToAvailable('opponent', makeEvent(JSON.stringify({ teamKey: 'opponent', sourceList: 'selected', playerId: 6 }))),
      }, 'Remove opponent player'),
      ReactActual.createElement('button', { onClick: props.onDragEnd }, 'End drag'),
      ReactActual.createElement('button', { onClick: () => props.openCustomModal('own') }, 'Open custom player'),
      ReactActual.createElement('button', { onClick: () => props.updateCustomField('name', '  Custom Player  ') }, 'Set custom name'),
      ReactActual.createElement('button', { onClick: () => props.updateCustomField('abilityToPlayPaceBall', '120') }, 'Set high ability'),
      ReactActual.createElement('button', { onClick: () => props.updateCustomField('abilityToPlaySpinBall', '-2') }, 'Set low ability'),
      ReactActual.createElement('button', { onClick: () => props.updateCustomField('battingAggresion', 'invalid') }, 'Set invalid ability'),
      ReactActual.createElement('button', { onClick: () => props.updateCustomField('isWicketKeeper', true) }, 'Set keeper'),
      ReactActual.createElement('button', { onClick: props.submitCustomPlayer }, 'Submit custom player'),
      ReactActual.createElement('button', { onClick: props.closeCustomModal }, 'Close custom player')
    );
  },
}));

const makeProps = (overrides = {}) => ({
  stage: matchStatusEnum.ChooseMatchType,
  stageCommonProps: { stageIndex: 2, totalStages: 9 },
  game: { commentator: 'Voice One' },
  countryList: [],
  venueStadiums: [{ name: 'Ground', pitchType: 'sporting', outfieldType: 'lushGreen' }],
  availableVoices: [{ name: 'Voice One', lang: 'en-IN' }],
  matchVisual: {},
  goToNextStage: jest.fn(),
  goToPreviousStage: jest.fn(),
  selectGameMode: jest.fn(),
  selectSeriesLength: jest.fn(),
  tournamentUserTeam: 'Falcons',
  tournamentOpponentTeams: [],
  tournamentMatches: [],
  toggleTournamentOpponent: jest.fn(),
  prepareTournamentFixtures: jest.fn(),
  confirmTournamentFixtures: jest.fn(),
  randomizeTournamentFixtures: jest.fn(),
  updateTournamentFixture: jest.fn(),
  setMatchTypeKey: jest.fn(),
  setOwnTeam: jest.fn(),
  setOpponentTeam: jest.fn(),
  setLocationCountry: jest.fn(),
  setSelectedStadium: jest.fn(),
  setCommentator: jest.fn(),
  setPreferredVoice: jest.fn(),
  speak: jest.fn(),
  savedGames: [],
  isSavesLoading: false,
  saveMessage: '',
  onLoadSavedGame: jest.fn(),
  onDeleteSavedGame: jest.fn(),
  handleTossCall: jest.fn(),
  handleUserTossDecision: jest.fn(),
  isUserWinner: false,
  ownAvailablePool: [],
  opponentAvailablePool: [],
  ownSelectedXIIds: [],
  opponentSelectedXIIds: [],
  ownSelectedXIPlayers: [],
  opponentSelectedXIPlayers: [],
  ownTeamRoles: {},
  opponentTeamRoles: {},
  ownXIReady: false,
  opponentXIReady: false,
  ownRolesReady: false,
  opponentRolesReady: false,
  moveOwnPlayerToXI: jest.fn(),
  removeOwnPlayerFromXI: jest.fn(),
  moveOwnPlayerInBattingOrder: jest.fn(),
  moveOpponentPlayerToXI: jest.fn(),
  removeOpponentPlayerFromXI: jest.fn(),
  moveOpponentPlayerInBattingOrder: jest.fn(),
  setOwnRole: jest.fn(),
  setOpponentRole: jest.fn(),
  createCustomPlayer: jest.fn(),
  autoPickOwnXI: jest.fn(),
  autoPickOpponentXI: jest.fn(),
  startMatchWithSelectedXI: jest.fn(),
  beginCareer: jest.fn(),
  careerTeam: '',
  careerSeason: 1,
  careerMatchIndex: 0,
  careerSchedule: [],
  careerStandings: {},
  careerPlayerProfile: null,
  careerDomesticCountry: '',
  careerDomesticTeams: [],
  careerGlobalPlayerPool: [],
  careerAuctionSummary: null,
  careerOffers: [],
  careerRetired: false,
  handleCareerContinueAfterAuction: jest.fn(),
  handleCareerStartNextMatch: jest.fn(),
  handleViewCareerHistory: jest.fn(),
  ...overrides,
});

describe('PreMatchStages', () => {
  test('passes batting-order controls through to the XI selection stages', () => {
    const props = makeProps({ stage: matchStatusEnum.ChooseOwnPlayingXI });
    render(<PreMatchStages {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move own player in batting order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move opponent player in batting order' }));

    expect(props.moveOwnPlayerInBattingOrder).toHaveBeenCalledWith('own-1', -1);
    expect(props.moveOpponentPlayerInBattingOrder).toHaveBeenCalledWith('opponent-1', 1);
  });

  test('shows setup back controls only on supported stages and passes the resolved commentator', () => {
    const props = makeProps();
    const { rerender } = render(<PreMatchStages {...props} />);
    expect(screen.getByTestId('basic-stage').textContent).toMatch(/[A-Z][a-z]+ [A-Z][a-z]+/);
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByTestId('selection-stage')).toBeInTheDocument();

    rerender(<PreMatchStages {...props} stage={matchStatusEnum.intro} />);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    rerender(<PreMatchStages {...props} stage={matchStatusEnum.SetupTournamentFixtures} />);
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    rerender(<PreMatchStages {...props} stage={matchStatusEnum.TeamOneBat} />);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    rerender(<PreMatchStages {...props} availableVoices={[]} />);
    expect(screen.getByTestId('basic-stage').querySelector('span')).toHaveTextContent(/\S/);
  });

  test('routes drag-and-drop events to the matching team and handles malformed payloads safely', () => {
    const props = makeProps();
    render(<PreMatchStages {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Drag without data transfer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drag selected own' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop to available' }));
    expect(props.removeOwnPlayerFromXI).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Drag available own' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop to selected fallback' }));
    expect(props.moveOwnPlayerToXI).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: 'End drag' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop invalid JSON' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop incomplete payload' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop available without payload' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop different team' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drop wrong source' }));
    expect(props.moveOwnPlayerToXI).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Drop opponent player' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove opponent player' }));
    expect(props.moveOpponentPlayerToXI).toHaveBeenCalledWith(5);
    expect(props.removeOpponentPlayerFromXI).toHaveBeenCalledWith(6);
  });

  test('validates, clamps, and submits custom-player details from its modal state', () => {
    const props = makeProps();
    render(<PreMatchStages {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open custom player' }));
    expect(screen.getByText('Modal open')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit custom player' }));
    expect(props.createCustomPlayer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Set custom name' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set high ability' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set low ability' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set invalid ability' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set keeper' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit custom player' }));
    expect(props.createCustomPlayer).toHaveBeenCalledWith('own', {
      name: 'Custom Player',
      abilityToPlayPaceBall: 99,
      abilityToPlaySpinBall: 0,
      battingAggresion: 0,
      spinAbility: 20,
      paceAbility: 20,
      isWicketKeeper: true,
    });
    expect(screen.getByText('Modal closed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open custom player' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close custom player' }));
    expect(screen.getByText('Modal closed')).toBeInTheDocument();
  });
});
