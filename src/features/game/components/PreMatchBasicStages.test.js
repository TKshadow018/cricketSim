import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PreMatchBasicStages from './PreMatchBasicStages';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';

function IntroHarness({ props }) {
  const [saveToDelete, setSaveToDelete] = React.useState(null);
  return (
    <PreMatchBasicStages
      {...props}
      saveToDelete={saveToDelete}
      setSaveToDelete={setSaveToDelete}
    />
  );
}

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{text}</button>
  ),
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

jest.mock('./SelectionGrid', () => ({
  __esModule: true,
  default: ({ items, onSelect, keyOf, renderTitle, renderMeta, renderDescription }) => (
    <div>
      {items.map((item) => (
        <div key={keyOf ? keyOf(item) : item.key || item.name} onClick={() => onSelect(item)}>
          <button>
            {item.renderVisual ? item.renderVisual() : null}
            {renderTitle(item)} {renderMeta ? renderMeta(item) : null}
          </button>
          {renderDescription ? renderDescription(item) : null}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./CareerSetupStage', () => ({
  __esModule: true,
  default: ({ beginCareer }) => <button onClick={() => beginCareer({ name: 'Player' })}>Begin career</button>,
}));

jest.mock('./CareerAuctionStage', () => ({
  __esModule: true,
  default: ({ handleCareerContinueAfterAuction }) => <button onClick={handleCareerContinueAfterAuction}>Continue auction</button>,
}));

jest.mock('./CareerSeasonScheduleStage', () => ({
  __esModule: true,
  default: ({ handleCareerStartNextMatch, handleViewCareerHistory }) => (
    <>
      <button onClick={handleCareerStartNextMatch}>Next career match</button>
      <button onClick={handleViewCareerHistory}>Career history</button>
    </>
  ),
}));

const teams = [
  { id: 'in', name: 'India', image: './flags/india.png', current_ranking: 1 },
  { id: 'au', name: 'Australia', image: './flags/australia.png', current_ranking: 2 },
  { id: 'eng', name: 'England', image: './flags/england.png', current_ranking: 3 },
  { id: 'nz', name: 'New Zealand', image: './flags/nz.png', current_ranking: 4 },
];

const makeProps = (overrides = {}) => ({
  stage: matchStatusEnum.intro,
  stageCommonProps: { stageIndex: 1, totalStages: 12 },
  game: {
    gameMode: 'quick',
    matchTypeKey: 't20',
    seriesLength: 3,
    ownTeam: 'India',
    opponentTeam: 'Australia',
    locationCountry: 'India',
    selectedStadium: 'Ground',
    commentator: 'Voice',
    tossCall: '',
    tossWinner: 'India',
    tossDecision: 'bat',
    firstBattingSide: 'own',
    matchCondition: { weather: 'sunny', pitch: 'sporting', outfield: 'lushGreen' },
  },
  setupBackSlot: <button>Back control</button>,
  countryList: teams,
  stadiumSelectionItems: [{ name: 'Ground', location: 'City', capacity: 1000, pitchType: 'sporting', outfieldType: 'lushGreen' }],
  availableVoices: [],
  matchVisual: {},
  goToNextStage: jest.fn(),
  selectGameMode: jest.fn(),
  selectSeriesLength: jest.fn(),
  tournamentUserTeam: 'India',
  tournamentOpponentTeams: ['Australia', 'England', 'New Zealand'],
  toggleTournamentOpponent: jest.fn(),
  prepareTournamentFixtures: jest.fn(),
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
  onDeleteSavedGame: jest.fn().mockResolvedValue(undefined),
  handleTossCall: jest.fn(),
  handleUserTossDecision: jest.fn(),
  commentatorDisplayName: 'Commentator',
  isUserWinner: false,
  beginCareer: jest.fn(),
  careerTeam: 'India XI',
  careerSeason: 1,
  careerMatchIndex: 0,
  careerSchedule: [],
  careerStandings: {},
  careerPlayerProfile: { name: 'Career Player' },
  careerDomesticCountry: 'India',
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

describe('PreMatchBasicStages', () => {
  test('handles intro, saved-game load, delete confirmation, save states, and back navigation', async () => {
    const saved = {
      id: 'save-1',
      title: 'Saved match',
      updatedAt: { toDate: () => new Date('2025-01-01T00:00:00Z') },
      gameState: { stage: matchStatusEnum.TeamOneBat, ownTeam: 'India', firstInnings: { score: 10, wickets: 1, balls: 6 } },
    };
    const props = makeProps({ savedGames: [saved], saveMessage: 'Saved just now' });
    render(<IntroHarness props={props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Match Setup' }));
    expect(props.goToNextStage).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Load Saved' }));
    expect(props.onLoadSavedGame).toHaveBeenCalledWith(saved);
    fireEvent.click(screen.getByRole('button', { name: 'Delete save' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete save' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });
    await waitFor(() => expect(props.onDeleteSavedGame).toHaveBeenCalledWith(saved));
    fireEvent.click(screen.getByRole('button', { name: 'Delete save' }));
    fireEvent.click(screen.getByRole('dialog').querySelector('button[aria-label="Close"]'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const loading = makeProps({ isSavesLoading: true, savedGames: [] });
    render(<PreMatchBasicStages {...loading} />);
    expect(screen.getByText('Loading saved games...')).toBeInTheDocument();

    render(
      <IntroHarness
        props={makeProps({
          savedGames: [{ id: 'save-fallback', gameState: { stage: matchStatusEnum.intro } }],
        })}
      />
    );
    expect(screen.getByText('Saved Match')).toBeInTheDocument();
    expect(screen.getByText('Recently updated')).toBeInTheDocument();

    const goBack = jest.fn();
    const back = makeProps({
      stage: matchStatusEnum.ChooseOwnTeam,
      setupBackSlot: <button onClick={goBack}>Back</button>,
    });
    render(<PreMatchBasicStages {...back} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(goBack).toHaveBeenCalled();
  });

  test('chooses match type, mode, series length, team, opponent, and location', () => {
    const matchType = makeProps({ stage: matchStatusEnum.ChooseMatchType });
    const { rerender } = render(<PreMatchBasicStages {...matchType} />);
    fireEvent.click(screen.getByRole('button', { name: /T20/ }));
    expect(matchType.setMatchTypeKey).toHaveBeenCalledWith('t20');
    expect(matchType.goToNextStage).toHaveBeenCalled();

    const mode = makeProps({ stage: matchStatusEnum.ChooseGameMode });
    rerender(<PreMatchBasicStages {...mode} />);
    fireEvent.click(screen.getByRole('button', { name: /Quick Match/ }));
    expect(mode.selectGameMode).toHaveBeenCalledWith('quick');
    fireEvent.click(screen.getByRole('button', { name: /Play Series/ }));
    expect(mode.selectGameMode).toHaveBeenCalledWith('series');
    fireEvent.click(screen.getByRole('button', { name: /Tournament/ }));
    expect(mode.selectGameMode).toHaveBeenCalledWith('tournament');
    fireEvent.click(screen.getByRole('button', { name: /Career/ }));
    expect(mode.selectGameMode).toHaveBeenCalledWith('career');
    for (const [gameMode, label] of [
      ['quick', 'Quick Match'],
      ['series', 'Play Series'],
      ['tournament', 'Tournament'],
      ['career', 'Career'],
    ]) {
      rerender(<PreMatchBasicStages {...mode} game={{ ...mode.game, gameMode }} />);
      expect(screen.getByRole('button', { name: new RegExp(label) })).toHaveClass('active');
    }

    const length = makeProps({ stage: matchStatusEnum.ChooseSeriesLength });
    rerender(<PreMatchBasicStages {...length} />);
    fireEvent.click(screen.getByRole('button', { name: /5 Matches/ }));
    expect(length.selectSeriesLength).toHaveBeenCalledWith(5);

    const own = makeProps({ stage: matchStatusEnum.ChooseOwnTeam });
    rerender(<PreMatchBasicStages {...own} />);
    fireEvent.click(screen.getByRole('button', { name: /Australia/ }));
    expect(own.setOwnTeam).toHaveBeenCalledWith('Australia');
    expect(own.speak).toHaveBeenCalledWith('Your team is Australia.');

    const opponent = makeProps({ stage: matchStatusEnum.ChooseOpponent });
    rerender(<PreMatchBasicStages {...opponent} />);
    fireEvent.click(screen.getByRole('button', { name: /England/ }));
    expect(opponent.setOpponentTeam).toHaveBeenCalledWith('England');

    const location = makeProps({ stage: matchStatusEnum.ChooseMatchLocation });
    rerender(<PreMatchBasicStages {...location} />);
    fireEvent.click(screen.getByRole('button', { name: /New Zealand/ }));
    expect(location.setLocationCountry).toHaveBeenCalledWith('New Zealand');
    expect(location.setSelectedStadium).toHaveBeenCalledWith('');
  });

  test('selects tournament opponents and fixtures and rejects invalid team counts', () => {
    const props = makeProps({
      stage: matchStatusEnum.ChooseOpponent,
      game: { ...makeProps().game, gameMode: 'tournament' },
      tournamentOpponentTeams: ['Australia', 'England', 'New Zealand'],
    });
    const { rerender } = render(<PreMatchBasicStages {...props} />);
    const continueButton = screen.getByRole('button', { name: 'Continue to Fixtures' });
    expect(continueButton).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /New Zealand/ }));
    expect(props.toggleTournamentOpponent).toHaveBeenCalledWith('New Zealand');
    const invalid = { ...props, tournamentOpponentTeams: ['Australia'] };
    rerender(<PreMatchBasicStages {...invalid} />);
    expect(screen.getByRole('button', { name: 'Continue to Fixtures' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Fixtures' }));
    expect(props.prepareTournamentFixtures).not.toHaveBeenCalled();

  });

  test('selects stadiums and commentators and supports voice-preview actions', () => {
    const stadium = makeProps({ stage: matchStatusEnum.ChooseStadium });
    const { rerender } = render(<PreMatchBasicStages {...stadium} />);
    fireEvent.click(screen.getByRole('button', { name: /Ground/ }));
    expect(stadium.setSelectedStadium).toHaveBeenCalledWith('Ground');
    expect(stadium.speak).toHaveBeenCalledWith('Stadium selected: Ground.');
    const noCapacity = makeProps({
      stage: matchStatusEnum.ChooseStadium,
      stadiumSelectionItems: [{ name: 'Unknown Ground', location: 'Remote', pitchType: 'dry', outfieldType: 'wetWithDew' }],
    });
    rerender(<PreMatchBasicStages {...noCapacity} />);
    expect(screen.getByText(/Remote • Capacity N\/A/)).toBeInTheDocument();

    const emptyVoices = makeProps({ stage: matchStatusEnum.ChooseCommentator, availableVoices: [] });
    rerender(<PreMatchBasicStages {...emptyVoices} />);
    expect(screen.getByText(/Voice list is still loading/)).toBeInTheDocument();

    const voice = { name: 'Voice One', lang: 'en-IN', default: true };
    const commentator = makeProps({
      stage: matchStatusEnum.ChooseCommentator,
      availableVoices: [voice, { name: 'Voice Two', lang: 'en-US', default: false }],
    });
    rerender(<PreMatchBasicStages {...commentator} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Test sound/ })[0]);
    expect(commentator.setPreferredVoice).toHaveBeenCalledWith('Voice One');
    expect(commentator.setCommentator).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button').find((button) => button.textContent.includes('en-IN')));
    expect(commentator.setCommentator).toHaveBeenCalledWith('Voice One');
    expect(commentator.setPreferredVoice).toHaveBeenCalledWith('Voice One');
  });

  test('routes toss and career setup, auction, and schedule stages', () => {
    const toss = makeProps({ stage: matchStatusEnum.TossTime });
    const { rerender } = render(<PreMatchBasicStages {...toss} />);
    fireEvent.click(screen.getByAltText('crown').closest('button'));
    expect(toss.handleTossCall).toHaveBeenCalledWith('crown');

    const tossResult = makeProps({ stage: matchStatusEnum.TossResult, isUserWinner: true });
    rerender(<PreMatchBasicStages {...tossResult} />);
    fireEvent.click(screen.getByAltText('bat').closest('button'));
    expect(tossResult.handleUserTossDecision).toHaveBeenCalledWith('bat');

    const career = makeProps({ stage: matchStatusEnum.CareerSetup });
    rerender(<PreMatchBasicStages {...career} />);
    fireEvent.click(screen.getByRole('button', { name: 'Begin career' }));
    expect(career.beginCareer).toHaveBeenCalled();
    const auction = makeProps({ stage: matchStatusEnum.CareerAuction });
    rerender(<PreMatchBasicStages {...auction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue auction' }));
    expect(auction.handleCareerContinueAfterAuction).toHaveBeenCalled();
    const schedule = makeProps({ stage: matchStatusEnum.CareerSeasonSchedule });
    rerender(<PreMatchBasicStages {...schedule} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next career match' }));
    fireEvent.click(screen.getByRole('button', { name: 'Career history' }));
    expect(schedule.handleCareerStartNextMatch).toHaveBeenCalled();
    expect(schedule.handleViewCareerHistory).toHaveBeenCalled();
  });

  test('uses static intro motion when reduced motion is preferred', () => {
    const motionHook = jest.spyOn(require('framer-motion'), 'useReducedMotion').mockReturnValue(true);
    render(<PreMatchBasicStages {...makeProps({ stage: matchStatusEnum.intro })} />);
    expect(document.querySelector('.sim-pulse-dot')).toBeInTheDocument();
    motionHook.mockRestore();
  });
});
