import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LiveMatchStages from './LiveMatchStages';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick }) => <button onClick={onClick}>{text}</button>,
}));

jest.mock('./StageShell', () => ({
  __esModule: true,
  default: ({ title, subtitle, rightSlot, children }) => (
    <section data-testid="stage-shell">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {rightSlot}
      {children}
    </section>
  ),
}));

jest.mock('./InningsStage', () => ({
  __esModule: true,
  default: (props) => (
    <div data-testid="innings-stage">
      <button onClick={props.onBowlBall}>Deliver ball</button>
      <button onClick={() => props.onSelectOpener(3)}>Select opener</button>
      <button onClick={() => props.onSelectNextBatter(4)}>Select next batter</button>
      <button onClick={() => props.onSelectBowler(5)}>Select bowler</button>
      {props.showScoreboard ? (
        <button onClick={props.onCloseScoreboard}>Close Scoreboard</button>
      ) : null}
      <span>{props.title}</span>
      <span>{props.subtitle}</span>
    </div>
  ),
}));

jest.mock('./ResultCards', () => ({
  TossResultCard: () => null,
  MatchResultCard: (props) => (
    <div data-testid="match-result-card">
      <span>{props.primaryActionLabel}</span>
      <button onClick={props.onPrimaryAction}>{props.primaryActionLabel}</button>
      <button onClick={() => props.onSelectManOfTheMatch?.({ name: 'MOM' })}>Select MOM</button>
    </div>
  ),
}));

jest.mock('./TeamNameWithFlag', () => ({
  __esModule: true,
  default: ({ teamName }) => <span>{teamName}</span>,
}));

jest.mock('./PlayerNameWithType', () => ({
  __esModule: true,
  default: ({ player }) => <span>{player?.name}</span>,
}));

jest.mock('./CareerSeasonSummaryStage', () => ({
  __esModule: true,
  default: (props) => <button data-testid="career-summary" onClick={() => props.handleStartNextCareerSeason()}>Career summary</button>,
}));

jest.mock('./CareerHistoryStage', () => ({
  __esModule: true,
  default: (props) => <button data-testid="career-history" onClick={() => props.handleBackToCareerSchedule()}>Career history</button>,
}));

const makeProps = (overrides = {}) => ({
  stage: matchStatusEnum.TeamOneBat,
  stageCommonProps: { stageIndex: 1, totalStages: 5 },
  game: {
    firstInnings: { balls: 30, score: 80, wickets: 2, lastEvent: 'Four', needsOpeners: false, openerSelections: [], waitingForNextBatter: false, waitingForNextBowler: false, commentary: [] },
    secondInnings: { balls: 0, score: 0, wickets: 0, lastEvent: '', needsOpeners: false, openerSelections: [], waitingForNextBatter: false, waitingForNextBowler: false, commentary: [] },
    battingIntent: 'normal',
    bowlingIntent: 'normal',
    showScoreboard: false,
    ownTeam: 'Falcons',
    opponentTeam: 'Ravens',
    tournamentUserTeam: 'Falcons',
  },
  matchType: { over: 20 },
  firstInningsTeamName: 'Falcons',
  secondInningsTeamName: 'Ravens',
  firstInningsView: {
    isUserBatting: true,
    isUserBowling: false,
    strikerName: 'One',
    nonStrikerName: 'Two',
    currentBowlerName: 'Three',
    strikerPlayer: { name: 'One' },
    nonStrikerPlayer: { name: 'Two' },
    currentBowlerPlayer: { name: 'Three' },
    openerCandidates: [],
    nextBatterCandidates: [],
    bowlerCandidates: [],
    battingActionOptions: [],
    bowlingActionOptions: [],
    canPlayNextBall: true,
  },
  secondInningsView: {
    isUserBatting: false,
    isUserBowling: true,
    strikerName: '',
    nonStrikerName: '',
    currentBowlerName: '',
    strikerPlayer: null,
    nonStrikerPlayer: null,
    currentBowlerPlayer: null,
    openerCandidates: [],
    nextBatterCandidates: [],
    bowlerCandidates: [],
    battingActionOptions: [],
    bowlingActionOptions: [],
    canPlayNextBall: false,
  },
  setBattingIntent: jest.fn(),
  setBowlingIntent: jest.fn(),
  onSaveGame: jest.fn(),
  isSavingGame: false,
  saveMessage: '',
  processDelivery: jest.fn(),
  handleSelectOpener: jest.fn(),
  handleSelectNextBatter: jest.fn(),
  handleSelectBowler: jest.fn(),
  toggleScoreboard: jest.fn(),
  buildTeamOneScorecard: jest.fn(() => ({ currentInnings: null })),
  buildTeamTwoScorecard: jest.fn(() => ({ currentInnings: null })),
  teamOneFinal: 'Falcons 80/2',
  teamTwoFinal: 'Ravens 0/0',
  resultSummary: 'Falcons win',
  momRecommendations: [],
  onSelectManOfTheMatch: jest.fn(),
  gameMode: 'quick',
  seriesLength: 3,
  seriesCurrentMatch: 1,
  seriesResults: [],
  seriesStanding: { ownWins: 1, opponentWins: 0, ties: 0 },
  seriesTopRunScorers: [],
  seriesTopWicketTakers: [],
  tournamentChampion: 'Falcons',
  tournamentResults: [],
  tournamentTopRunScorers: [],
  tournamentTopWicketTakers: [],
  isCurrentMatchUserInvolved: true,
  autoSimMode: null,
  onMatchPrimaryAction: jest.fn(),
  onSimulateOver: jest.fn(),
  onSimulateMatch: jest.fn(),
  resetMatch: jest.fn(),
  oversDisplay: (balls) => `${Math.floor(balls / 6)}.${balls % 6}`,
  careerTeam: 'Falcons',
  careerSeason: 1,
  careerSeasonLength: 'short',
  careerFormat: 't20',
  careerMatchIndex: 0,
  careerSchedule: [],
  careerStandings: {},
  careerPlayerStats: {},
  careerSeasonHistory: [],
  careerPlayerProfile: { name: 'Player' },
  careerDomesticCountry: 'Country A',
  careerDomesticTeams: [],
  careerOffers: [],
  careerRetired: false,
  careerTopRunScorers: [],
  careerTopWicketTakers: [],
  careerProgressLabel: '',
  handleStartNextCareerSeason: jest.fn(),
  handleEndCareer: jest.fn(),
  handleRetireCareer: jest.fn(),
  handleViewCareerHistory: jest.fn(),
  handleBackToCareerSchedule: jest.fn(),
  ...overrides,
});

describe('LiveMatchStages', () => {
  test('routes both innings stages and passes delivery, opener, scoreboard, and simulation actions', () => {
    const first = makeProps();
    const { rerender } = render(<LiveMatchStages {...first} />);
    expect(screen.getByText('Falcons Innings')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deliver ball' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select opener' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select next batter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select bowler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show Scoreboard' }));
    expect(first.processDelivery).toHaveBeenCalledWith(true);
    expect(first.handleSelectOpener).toHaveBeenCalledWith(true, 3);
    expect(first.handleSelectNextBatter).toHaveBeenCalledWith(true, 4);
    expect(first.handleSelectBowler).toHaveBeenCalledWith(true, 5);
    expect(first.toggleScoreboard).toHaveBeenCalled();
    expect(first.buildTeamOneScorecard).toHaveBeenCalled();

    rerender(<LiveMatchStages {...first} game={{ ...first.game, showScoreboard: true }} />);
    expect(screen.getByRole('button', { name: 'Hide Scoreboard' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close Scoreboard' }));
    expect(first.toggleScoreboard).toHaveBeenCalled();

    const second = makeProps({
      stage: matchStatusEnum.TeamTwoBat,
      game: { ...first.game, showScoreboard: true },
    });
    rerender(<LiveMatchStages {...second} />);
    expect(screen.getByText('Ravens Chase')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deliver ball' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select opener' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select next batter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select bowler' }));
    expect(second.processDelivery).toHaveBeenCalledWith(false);
    expect(second.handleSelectNextBatter).toHaveBeenCalledWith(false, 4);
    expect(second.handleSelectBowler).toHaveBeenCalledWith(false, 5);
    expect(second.handleSelectOpener).toHaveBeenCalledWith(false, 3);
    expect(second.buildTeamTwoScorecard).toHaveBeenCalled();
    rerender(<LiveMatchStages {...second} game={{ ...second.game, showScoreboard: false }} />);
    expect(screen.getByRole('button', { name: 'Show Scoreboard' })).toBeInTheDocument();
  });

  test('labels match-result actions by match mode and wires scoreboard and MOM behavior', () => {
    const quick = makeProps({
      stage: matchStatusEnum.MatchEnd,
      game: { ...makeProps().game, showScoreboard: true },
    });
    const { rerender } = render(<LiveMatchStages {...quick} />);
    expect(screen.getByRole('button', { name: 'Play New Match' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide Scoreboard' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select MOM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play New Match' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide Scoreboard' }));
    expect(quick.onSelectManOfTheMatch).toHaveBeenCalledWith({ name: 'MOM' });
    expect(quick.onMatchPrimaryAction).toHaveBeenCalled();
    expect(quick.buildTeamTwoScorecard).toHaveBeenCalled();

    rerender(<LiveMatchStages {...makeProps({ stage: matchStatusEnum.MatchEnd, gameMode: 'series', seriesCurrentMatch: 2 })} />);
    expect(screen.getByRole('button', { name: 'Start Match 3' })).toBeInTheDocument();
    rerender(<LiveMatchStages {...makeProps({ stage: matchStatusEnum.MatchEnd, gameMode: 'series', seriesCurrentMatch: 3 })} />);
    expect(screen.getByRole('button', { name: 'View Series Summary' })).toBeInTheDocument();
    rerender(<LiveMatchStages {...makeProps({ stage: matchStatusEnum.MatchEnd, gameMode: 'tournament' })} />);
    expect(screen.getByRole('button', { name: 'Next Knockout Match' })).toBeInTheDocument();
    rerender(<LiveMatchStages {...makeProps({ stage: matchStatusEnum.MatchEnd, gameMode: 'career' })} />);
    expect(screen.getByRole('button', { name: 'Back to Schedule' })).toBeInTheDocument();
  });

  test('renders series summary tables and starts a fresh match', () => {
    const props = makeProps({
      stage: matchStatusEnum.SeriesSummary,
      seriesResults: [{ matchNumber: 1, winnerTeam: 'Falcons', summary: 'Won by 5 runs' }],
      seriesTopRunScorers: [{ key: 'runs', name: 'Batter', team: 'Falcons', runs: 55, balls: 40, battingAverage: 55, strikeRate: 137 }],
      seriesTopWicketTakers: [{ key: 'wickets', name: 'Bowler', team: 'Ravens', overs: '4.0', runsConceded: 25, wickets: 3, bowlingAverage: 8.3, economy: 6.25 }],
    });
    render(<LiveMatchStages {...props} />);
    expect(screen.getByText('Series Summary')).toBeInTheDocument();
    expect(screen.getByText('Won by 5 runs')).toBeInTheDocument();
    expect(screen.getByText('Batter')).toBeInTheDocument();
    expect(screen.getByText('Bowler')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Fresh Match' }));
    expect(props.resetMatch).toHaveBeenCalled();
  });

  test('renders tournament champion results for user and opponent winners', () => {
    const props = makeProps({
      stage: matchStatusEnum.TournamentChampion,
      tournamentResults: [{ id: 'final', round: 2, matchNumber: 1, winnerTeam: 'Falcons', summary: 'Won final' }],
      tournamentTopRunScorers: [{ key: 'runs', name: 'Batter', team: 'Falcons', runs: 40, balls: 20, battingAverage: 40, strikeRate: 200 }],
      tournamentTopWicketTakers: [{ key: 'wickets', name: 'Bowler', team: 'Ravens', overs: '4.0', runsConceded: 20, wickets: 2, bowlingAverage: 10, economy: 5 }],
    });
    const { rerender } = render(<LiveMatchStages {...props} />);
    expect(screen.getByText(/Congratulations! Falcons wins the tournament/)).toBeInTheDocument();
    expect(screen.getByText('Won final')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Fresh Match' }));
    expect(props.resetMatch).toHaveBeenCalled();
    rerender(<LiveMatchStages {...props} tournamentChampion="Ravens" tournamentResults={null} />);
    expect(screen.getByText(/Ravens wins the tournament/)).toBeInTheDocument();
  });

  test('routes career summary and history screens to their respective actions', () => {
    const summary = makeProps({ stage: matchStatusEnum.CareerSeasonSummary });
    const { rerender } = render(<LiveMatchStages {...summary} />);
    fireEvent.click(screen.getByTestId('career-summary'));
    expect(summary.handleStartNextCareerSeason).toHaveBeenCalled();
    const history = makeProps({ stage: matchStatusEnum.CareerHistory });
    rerender(<LiveMatchStages {...history} />);
    fireEvent.click(screen.getByTestId('career-history'));
    expect(history.handleBackToCareerSchedule).toHaveBeenCalled();
  });
});
