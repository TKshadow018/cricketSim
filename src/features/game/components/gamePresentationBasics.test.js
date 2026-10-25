import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SelectionGrid from './SelectionGrid';
import FlagTeamGrid from './FlagTeamGrid';
import PlayerNameWithType, { resolvePlayerTypeKey } from './PlayerNameWithType';
import TeamNameWithFlag, { getTeamFlagPath } from './TeamNameWithFlag';
import TeamNameWithLogo from './TeamNameWithLogo';
import StageShell from './StageShell';
import TossStage from './TossStage';
import CareerPlayerProfileModal from './CareerPlayerProfileModal';
import { TossResultCard, MatchResultCard } from './ResultCards';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, ...props }) => <button onClick={onClick} {...props}>{text}</button>,
}));

describe('pre-match selection and team presentation components', () => {
  test('renders selection-grid content and dispatches selection for each card', () => {
    const onSelect = jest.fn();
    const items = [
      { id: 'one', title: 'One', meta: 'Details', description: 'Description', badge: 'Selected', visualClassName: 'team' },
      { id: 'two', title: 'Two', meta: <span>Custom meta</span>, description: <small>Custom description</small> },
    ];
    render(
      <SelectionGrid
        items={items}
        selectedKey="one"
        onSelect={onSelect}
        keyOf={(item) => item.id}
        renderTitle={(item) => item.title}
        renderMeta={(item) => item.meta}
        renderDescription={(item) => item.description}
      />
    );
    expect(screen.getByRole('button', { name: /One Details Description Selected/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Two Custom meta Custom description/ })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: /One Details/ }));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  test('renders optional selection visuals without metadata when reduced motion is preferred', () => {
    const motionHook = jest.spyOn(require('framer-motion'), 'useReducedMotion').mockReturnValue(true);
    const items = [
      { id: 'visual', renderVisual: () => <span>Team badge</span>, visualClassName: 'custom-visual', badge: 'New' },
      { id: 'plain' },
    ];

    render(
      <SelectionGrid
        items={items}
        selectedKey=""
        onSelect={jest.fn()}
        keyOf={(item) => item.id}
        renderTitle={(item) => item.id}
      />
    );

    expect(screen.getByText('Team badge').parentElement).toHaveClass('sim-choice-visual', 'custom-visual');
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'plain' })).toHaveAttribute('aria-pressed', 'false');
    motionHook.mockRestore();
  });

  test('marks disabled flag teams and only allows selecting enabled teams', () => {
    const onSelect = jest.fn();
    render(
      <FlagTeamGrid
        teams={[
          { id: 'a', name: 'Falcons', image: './flags/falcons.png', current_ranking: 1 },
          { id: 'b', name: 'Ravens', image: '/flags/ravens.png', current_ranking: 2 },
        ]}
        selectedName="Falcons"
        disabledName="Ravens"
        onSelect={onSelect}
      />
    );
    expect(screen.getByRole('button', { name: /Falcons Rank #1/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByAltText('Falcons')).toHaveAttribute('src', '/flags/falcons.png');
    const disabled = screen.getByRole('button', { name: /Ravens Rank #2/ });
    expect(disabled).toHaveClass('disabled');
    fireEvent.click(disabled);
    fireEvent.click(screen.getByRole('button', { name: /Falcons Rank #1/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Falcons' }));
  });

  test('uses an empty image path and disables hover motion when requested', () => {
    const motionHook = jest.spyOn(require('framer-motion'), 'useReducedMotion').mockReturnValue(true);
    render(
      <FlagTeamGrid
        teams={[{ id: 'c', name: 'Owls', current_ranking: 3 }]}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByAltText('Owls')).toHaveAttribute('src', '');
    motionHook.mockRestore();
  });

  test('resolves player-type text and ability fallbacks and renders team identities', () => {
    expect(resolvePlayerTypeKey({ isWicketKeeper: true, paceAbility: 100 })).toBe('wicketkeeper');
    expect(resolvePlayerTypeKey({ playerType: 'pace allrounder' })).toBe('paceAllrounder');
    expect(resolvePlayerTypeKey({ playerType: 'spin allrounder' })).toBe('spinAllrounder');
    expect(resolvePlayerTypeKey({ playerType: 'bowler pacer' })).toBe('pacer');
    expect(resolvePlayerTypeKey({ playerType: 'spiner' })).toBe('spinner');
    expect(resolvePlayerTypeKey({ playerType: 'bowler spinner' })).toBe('spinner');
    expect(resolvePlayerTypeKey({ playerType: 'allrounder spin' })).toBe('spinAllrounder');
    expect(resolvePlayerTypeKey({ playerType: 'allrounder' })).toBe('paceAllrounder');
    expect(resolvePlayerTypeKey({ playerType: 'batsman' })).toBe('batsman');
    expect(resolvePlayerTypeKey({ playerType: 'unknown' })).toBe('batsman');
    expect(resolvePlayerTypeKey()).toBe('batsman');
    expect(resolvePlayerTypeKey({ playerType: 'bowler' })).toBe('pacer');
    expect(resolvePlayerTypeKey({ abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60, paceAbility: 58, spinAbility: 55 })).toBe('paceAllrounder');
    expect(resolvePlayerTypeKey({ abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60, paceAbility: 55, spinAbility: 58 })).toBe('spinAllrounder');
    expect(resolvePlayerTypeKey({ abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60, paceAbility: 40, spinAbility: 55 })).toBe('spinAllrounder');
    expect(resolvePlayerTypeKey({ abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60, paceAbility: 40, spinAbility: 40 })).toBe('batsman');
    expect(resolvePlayerTypeKey({ paceAbility: 55, spinAbility: 30 })).toBe('pacer');
    expect(resolvePlayerTypeKey({ paceAbility: 55, spinAbility: 60 })).toBe('spinner');
    expect(resolvePlayerTypeKey({ paceAbility: 30, spinAbility: 55 })).toBe('spinner');
    expect(resolvePlayerTypeKey({})).toBe('batsman');

    const { rerender } = render(<PlayerNameWithType player={{ name: 'A', playerType: 'pacer' }} />);
    expect(screen.getByAltText('pacer')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    rerender(<PlayerNameWithType name="Named" player={{ playerType: 'wicketkeeper' }} className="outer" textClassName="text" iconClassName="icon" />);
    expect(screen.getByAltText('wicketkeeper')).toHaveClass('icon');
    expect(screen.getByText('Named')).toHaveClass('sim-player-name-text', 'text');
    rerender(<PlayerNameWithType />);
    expect(screen.getByText('-')).toBeInTheDocument();

    render(<TeamNameWithLogo teamName="Royal Falcons" size={40} className="custom" />);
    expect(screen.getByTitle('Royal Falcons logo')).toHaveTextContent('RF');
    expect(screen.getByTitle('Royal Falcons logo')).toHaveStyle({ width: '40px', height: '40px' });
    render(<TeamNameWithLogo teamName="Falcons" />);
    expect(screen.getByTitle('Falcons logo')).toHaveTextContent('FA');
    render(<TeamNameWithLogo teamName="   " />);
    expect(document.querySelectorAll('.sim-team-logo-mark')[2]).toHaveTextContent('TM');
    render(<TeamNameWithLogo />);
    expect(screen.getByTitle('Team logo')).toHaveTextContent('TE');
  });

  test('uses country flags when available and supports empty team labels', () => {
    expect(getTeamFlagPath('India')).toMatch(/^\//);
    expect(getTeamFlagPath('Not a country')).toBe('');
    expect(getTeamFlagPath()).toBe('');
    const { rerender } = render(<TeamNameWithFlag teamName="" />);
    expect(document.querySelector('.sim-team-logo-name')).not.toBeInTheDocument();
    rerender(<TeamNameWithFlag teamName="" showDashForEmpty />);
    expect(screen.getByText('-')).toBeInTheDocument();
    rerender(<TeamNameWithFlag teamName="India" className="team-label" />);
    expect(screen.getByText('India').parentElement).toHaveClass('team-label');
  });

  test('handles country records without usable names or flag metadata', () => {
    jest.doMock('../../../gameData/countries', () => ({
      countries: {
        missingName: {},
        emptyName: { name: '' },
        noImage: { name: 'No Image' },
      },
    }));
    jest.isolateModules(() => {
      const { getTeamFlagPath: getMockedTeamFlagPath } = require('./TeamNameWithFlag');
      expect(getMockedTeamFlagPath()).toBe('');
      expect(getMockedTeamFlagPath('No Image')).toBe('');
    });
    jest.dontMock('../../../gameData/countries');

    jest.doMock('../../../gameData/countries', () => ({ countries: null }));
    jest.isolateModules(() => {
      const { getTeamFlagPath: getEmptyTeamFlagPath } = require('./TeamNameWithFlag');
      expect(getEmptyTeamFlagPath('India')).toBe('');
    });
    jest.dontMock('../../../gameData/countries');
  });
});

describe('match presentation components', () => {
  test('renders stage shell title variants and toss conditions with both toss actions', () => {
    const { rerender } = render(
      <StageShell stageIndex={2} totalStages={5} title="Select Match" subtitle="Prepare" className="custom" dark>
        <span>Stage content</span>
      </StageShell>
    );
    expect(screen.getByText('Stage 2 / 5')).toBeInTheDocument();
    expect(document.querySelector('.sim-wave-title')).toHaveTextContent('Select Match');
    expect(screen.getByText('Stage content')).toBeInTheDocument();
    expect(document.querySelector('.sim-stage-dark.custom')).toBeInTheDocument();
    rerender(
      <StageShell stageIndex={1} totalStages={1} title="Ignored" titleNode={<strong>Custom title</strong>} subtitle="">
        Child
      </StageShell>
    );
    expect(screen.getByText('Custom title')).toBeInTheDocument();

    const motionHook = jest.spyOn(require('framer-motion'), 'useReducedMotion').mockReturnValue(true);
    render(<StageShell stageIndex={3} totalStages={5} title="Animated stage" subtitle="Continue" />);
    expect(screen.getByText('Animated stage')).toBeInTheDocument();
    motionHook.mockRestore();

    const onChooseCall = jest.fn();
    const { rerender: rerenderToss } = render(
      <TossStage
        onChooseCall={onChooseCall}
        matchCondition={{ weather: 'sunny', pitch: 'sporting', outfield: 'lushGreen' }}
        selectedCall="crown"
      />
    );
    expect(screen.getByText('Sunny')).toBeInTheDocument();
    expect(screen.getByText('Sporting')).toBeInTheDocument();
    expect(screen.getByText('Lush Green')).toBeInTheDocument();
    fireEvent.click(screen.getByAltText('crown').closest('button'));
    fireEvent.click(screen.getByAltText('money').closest('button'));
    expect(onChooseCall.mock.calls).toEqual([['crown'], ['dollar']]);
    rerenderToss(
      <TossStage
        onChooseCall={onChooseCall}
        matchCondition={{ weather: 'unknown', pitch: 'unknown_pitch', outfield: 'unknownOutfield' }}
        selectedCall="dollar"
      />
    );
    expect(screen.getByAltText('weather')).toHaveAttribute('src', '/asset/img/icon/conditions/weather-512.svg');
    expect(screen.getByText('Unknown Pitch')).toBeInTheDocument();
  });

  test('shows toss winner choices based on who won and the opponent decision', () => {
    const onUserDecision = jest.fn();
    const { rerender } = render(
      <TossResultCard winner="India" decision="bat" commentator="Voice" isUserWinner onUserDecision={onUserDecision} />
    );
    expect(screen.getByText('You won the toss. Choose what your team does first.')).toBeInTheDocument();
    fireEvent.click(screen.getByAltText('bat').closest('button'));
    fireEvent.click(screen.getByAltText('ball').closest('button'));
    expect(onUserDecision.mock.calls).toEqual([['bat'], ['bowl']]);
    rerender(<TossResultCard winner="England" decision="bat" commentator="Voice" isUserWinner={false} onUserDecision={onUserDecision} />);
    expect(screen.getByText(/Opponent chose to bat first/)).toBeInTheDocument();
    expect(screen.getByAltText('bat').closest('button')).toBeDisabled();
    expect(screen.getByAltText('ball').closest('button')).not.toBeDisabled();
    fireEvent.click(screen.getByAltText('ball').closest('button'));
    expect(onUserDecision).toHaveBeenLastCalledWith('bowl');

    rerender(<TossResultCard winner="England" decision="bowl" commentator="Voice" isUserWinner={false} onUserDecision={onUserDecision} />);
    expect(screen.getByText(/Opponent chose to bowl first/)).toBeInTheDocument();
    fireEvent.click(screen.getByAltText('bat').closest('button'));
    expect(onUserDecision).toHaveBeenLastCalledWith('bat');

    rerender(<TossResultCard winner="India" decision="bowl" commentator="Voice" isUserWinner onUserDecision={onUserDecision} />);
    fireEvent.click(screen.getByAltText('ball').closest('button'));
    expect(onUserDecision).toHaveBeenLastCalledWith('bowl');
  });

  test('uses static toss motion and empty labels when conditions are missing', () => {
    const motionHook = jest.spyOn(require('framer-motion'), 'useReducedMotion').mockReturnValue(true);
    render(<TossStage onChooseCall={jest.fn()} matchCondition={{}} selectedCall="dollar" />);

    expect(document.querySelector('.sim-toss-title')).toHaveTextContent('TOSS TIME');
    expect(screen.getByAltText('weather')).toHaveAttribute('src', '/asset/img/icon/conditions/weather-512.svg');
    expect(screen.getByAltText('crown').closest('button')).not.toHaveClass('active');
    expect(screen.getByAltText('money').closest('button')).toHaveClass('active');
    motionHook.mockRestore();
  });

  test('renders scorecards, MOM recommendations, and result actions', () => {
    const onSelectManOfTheMatch = jest.fn();
    const onPrimaryAction = jest.fn();
    const recommendations = [
      { rank: 1, team: 'India', name: 'Top Player', playerType: 'batsman', runs: 50, balls: 30, strikeRate: 166, oversBowled: '2.0', runsConceded: 10, wickets: 2, points: 100, recommended: true, notOut: true, notes: ['Match-winning innings'] },
      { rank: 2, team: 'England', name: 'Second Player', runs: 20, balls: 20, strikeRate: 100, oversBowled: '1.0', runsConceded: 12, wickets: 1, points: 50, notes: [] },
    ];
    const innings = {
      title: 'India Innings',
      line: '150/4',
      overs: '20.0',
      battingRows: [{ name: 'Batter', playerType: 'batsman', runs: 50, balls: 30, strikeRate: 166, dismissal: 'not out', isNotOut: true }],
      bowlingRows: [{ name: 'Bowler', playerType: 'pacer', overs: '4.0', runsConceded: 25, economy: 6.25, avgPerWicket: 12.5, wickets: 2, isCurrent: true }],
    };
    const { rerender } = render(
      <MatchResultCard
        teamOneName="India"
        teamTwoName="England"
        teamOneScore={150}
        teamOneWickets={4}
        teamTwoScore={140}
        teamTwoWickets={8}
        teamOneOvers="20.0"
        teamTwoOvers="20.0"
        summary="India won"
        momRecommendations={recommendations}
        onSelectManOfTheMatch={onSelectManOfTheMatch}
        onPrimaryAction={onPrimaryAction}
        showScoreboard
        scorecard={{ currentInnings: innings, previousInnings: { ...innings, title: 'England Innings' } }}
      />
    );
    expect(screen.getByText('150/4')).toBeInTheDocument();
    expect(screen.getByText('Man of the Match Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Full Scoreboard')).toBeInTheDocument();
    expect(screen.getAllByText('India Innings')).toHaveLength(1);
    expect(screen.getByText('England Innings')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select Top Player as Man of the Match' }));
    expect(onSelectManOfTheMatch).toHaveBeenCalledWith(recommendations[0]);
    expect(screen.queryByText('Man of the Match Suggestions')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play New Match' }));
    expect(onPrimaryAction).toHaveBeenCalled();

    rerender(
      <MatchResultCard
        teamOneLine="India 1"
        teamTwoLine="England 2"
        summary="A new result"
        momRecommendations={recommendations}
        onSelectManOfTheMatch={onSelectManOfTheMatch}
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel="Continue"
        autoSelectTopMomOnPrimaryAction
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSelectManOfTheMatch).toHaveBeenLastCalledWith(recommendations[0]);
    expect(onPrimaryAction).toHaveBeenCalledTimes(2);
    expect(screen.getByText('India 1')).toBeInTheDocument();
    expect(screen.getByText('England 2')).toBeInTheDocument();
  });

  test('handles missing scoreboard data and sparse MOM recommendations', () => {
    const motionHook = jest.spyOn(require('framer-motion'), 'useReducedMotion').mockReturnValue(true);
    const onSelectManOfTheMatch = jest.fn();
    const onPrimaryAction = jest.fn();
    const { rerender } = render(
      <MatchResultCard
        teamOneLine="Falcons 1"
        teamTwoLine="Ravens 2"
        summary="No scorecard"
        momRecommendations={null}
        onSelectManOfTheMatch={onSelectManOfTheMatch}
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel="Continue"
        showScoreboard
        scorecard={{ currentInnings: null, previousInnings: null }}
      />
    );

    expect(screen.getByText('Falcons 1')).toBeInTheDocument();
    expect(screen.getByText('Ravens 2')).toBeInTheDocument();
    expect(screen.queryByText('Man of the Match Suggestions')).not.toBeInTheDocument();
    expect(document.querySelector('.sim-scoreboard-block')).not.toBeInTheDocument();

    rerender(
      <MatchResultCard
        teamOneLine="Falcons 1"
        teamTwoLine="Ravens 2"
        summary="No scorecard"
        momRecommendations={new Array(1)}
        onSelectManOfTheMatch={onSelectManOfTheMatch}
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel="Continue"
        autoSelectTopMomOnPrimaryAction
        showScoreboard
        scorecard={{
          currentInnings: {
            title: 'Empty innings',
            line: '0/0',
            overs: '0.0',
            battingRows: [{ name: 'Out batter', isNotOut: false }],
            bowlingRows: [{ name: 'Idle bowler', isCurrent: false }],
          },
          previousInnings: null,
        }}
      />
    );
    expect(screen.getByText('Empty innings')).toBeInTheDocument();
    expect(document.querySelector('.sim-scoreboard-row-notout')).not.toBeInTheDocument();
    expect(document.querySelector('.sim-scoreboard-row-current')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSelectManOfTheMatch).not.toHaveBeenCalled();
    expect(onPrimaryAction).toHaveBeenCalled();
    motionHook.mockRestore();
  });

  test('shows player profiles only while open and clamps ability values', () => {
    const onClose = jest.fn();
    const player = {
      name: 'Profile Player',
      playerType: 'batsman',
      team: 'India',
      fitness: 120,
      morale: -5,
      abilityToPlayPaceBall: 130,
      abilityToPlaySpinBall: 45,
      paceAbility: 0,
      spinAbility: 50,
      battingAggresion: 25,
      matches: 10,
      runs: 250,
      balls: 180,
      battingAverage: 25,
      strikeRate: 138,
      wickets: 8,
      overs: '15.0',
      runsConceded: 90,
      economy: 6,
      bowlingAverage: 11.25,
      age: 22,
      country: 'India',
      city: 'Delhi',
      job: 'Player',
      email: 'player@example.com',
      phone: '123',
    };
    const { rerender } = render(<CareerPlayerProfileModal isOpen={false} player={player} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<CareerPlayerProfileModal isOpen title="Profile" player={player} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profile', level: 4 })).toBeInTheDocument();
    expect(document.querySelector('.sim-ability-fill')).toHaveStyle({ width: '100%' });
    expect(screen.queryByText('Free Agent')).not.toBeInTheDocument();
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<CareerPlayerProfileModal isOpen player={{ name: 'Fallback Player' }} onClose={onClose} />);
    expect(document.querySelector('.sim-career-player-subtitle')).toHaveTextContent('Free Agent');
    expect(document.querySelectorAll('.sim-career-player-card')[3]).toHaveTextContent('Unknown');
  });
});
