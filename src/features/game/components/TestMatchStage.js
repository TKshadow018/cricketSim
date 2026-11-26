import React from 'react';
import AppButton from '../../../components/ui/AppButton';
import { oversDisplay } from '../../../utils/simulatorUtils';
import { buildScorecard } from '../utils/controllerCommonUtils';
import { selectLegalOpponentField } from '../utils/fieldingRules';
import { buildTestInningsScorecards } from '../utils/testScorecards';
import { useTestMatchController } from '../hooks/controller/useTestMatchController';
import InningsStage from './InningsStage';
import InningsScoreboard from './InningsScoreboard';
import ScoreboardModal from './ScoreboardModal';
import StageShell from './StageShell';

export default function TestMatchStage({
  game,
  ownPlayers,
  opponentPlayers,
  stageCommonProps,
  onMatchPrimaryAction,
  onSaveGame,
  isSavingGame,
  saveMessage,
  momRecommendations = [],
  onSelectManOfTheMatch,
}) {
  const control = useTestMatchController({ game, ownPlayers, opponentPlayers });
  const [showScorecard, setShowScorecard] = React.useState(false);
  const { state, innings, view } = control;
  const teamName = state.currentSide === 'own' ? game.ownTeam : game.opponentTeam;
  const totalBalls = control.completedBalls + (state.phase === 'batting' ? innings.balls : 0);
  const day = Math.min(state.days, Math.floor(totalBalls / (state.oversPerDay * 6)) + 1);
  const context = {
    ...view.bowlingContext,
    ...view.battingContext,
    score: innings.score,
    wickets: innings.wickets,
    over: oversDisplay(innings.balls),
    target: state.target,
    ballsRemaining: Math.max(0, state.totalBalls - totalBalls),
    runsRemaining: state.target === null ? null : Math.max(0, state.target - innings.score),
    matchCondition: game.matchCondition,
    matchTypeKey: game.matchTypeKey,
    matchType: { over: state.oversPerDay, unlimitedBowling: true },
    ruleset: game.ruleset,
    opponentFieldPreset: selectLegalOpponentField({
      inningState: innings,
      matchType: { over: state.oversPerDay, unlimitedBowling: true },
      matchTypeKey: game.matchTypeKey,
      target: state.target,
      battingHand: view.strikerPlayer?.battingHand,
    }),
  };
  const scorecard = {
    currentInnings: buildScorecard(`${teamName} Innings`, innings, view, oversDisplay(innings.balls)),
    previousInnings: null,
  };
  const userInvolved = [game.ownTeam, game.opponentTeam].includes(control.userTeamName);
  const inningsCards = buildTestInningsScorecards({
    state, ownPlayers, opponentPlayers, ownTeam: game.ownTeam, opponentTeam: game.opponentTeam, includeCurrent: true,
  });

  return (
    <StageShell {...stageCommonProps} title="Test Match" subtitle={`Day ${day} of ${state.days} · ${oversDisplay(totalBalls)} overs played`}>
      {showScorecard ? (
        <ScoreboardModal onClose={() => setShowScorecard(false)}>
          {inningsCards.map((entry, index) => (
            <InningsScoreboard key={`${entry.team}-${index}`} inningsData={entry.scorecard} keyPrefix={`test-${index}`} />
          ))}
        </ScoreboardModal>
      ) : null}
      <AppButton text="Show Scorecard" onClick={() => setShowScorecard(true)} variant="secondary" fullWidth={false} />
      <div className="sim-scoreboard-panel">
        {state.innings.map((entry, index) => (
          <p key={`${entry.side}-${index}`}>
            {entry.side === 'own' ? game.ownTeam : game.opponentTeam}: {entry.innings.score}/{entry.innings.wickets}
            {' '}({oversDisplay(entry.innings.balls)} overs){entry.reason === 'declared' ? ' declared' : ''}
          </p>
        ))}
      </div>
      {state.phase === 'followOnChoice' ? (
        <div className="sim-scoreboard-panel">
          <p>First-innings lead: {state.followOnLead} runs. Enforce the follow-on?</p>
          <AppButton text="Enforce follow-on" onClick={() => control.followOn(true)} fullWidth={false} />
          <AppButton text="Bat again" onClick={() => control.followOn(false)} variant="secondary" fullWidth={false} />
        </div>
      ) : state.phase === 'result' ? (
        <div className="sim-scoreboard-panel">
          <p>{control.resultSummary}</p>
          {momRecommendations.length ? (
            <section aria-label="Player of the match suggestions">
              <p>Suggested player of the match (estimated)</p>
              {momRecommendations.slice(0, 3).map((player) => (
                <button key={`${player.team}-${player.playerId || player.name}`} type="button" onClick={() => onSelectManOfTheMatch?.(player)}>
                  {player.name} · {player.team} · {player.points} points
                </button>
              ))}
            </section>
          ) : null}
          {typeof onSaveGame === 'function' ? (
            <AppButton text="Save Match" onClick={onSaveGame} disabled={isSavingGame} variant="secondary" fullWidth={false} />
          ) : null}
          {saveMessage ? <p>{saveMessage}</p> : null}
          <AppButton text={game.gameMode === 'tournament' ? 'Continue tournament' : game.gameMode === 'career' ? 'Back to Schedule' : 'Continue'} onClick={onMatchPrimaryAction} fullWidth={false} />
        </div>
      ) : (
        <>
          {teamName === control.userTeamName ? (
            <AppButton text="Declare innings" onClick={control.declare} variant="secondary" fullWidth={false} />
          ) : null}
          <InningsStage
            title={`${teamName} Innings`}
            subtitle={`${oversDisplay(innings.balls)} overs`}
            score={innings.score}
            wickets={innings.wickets}
            lastEvent={innings.lastEvent}
            isUserBatting={view.isUserBatting}
            isUserBowling={view.isUserBowling}
            strikerName={view.strikerName}
            nonStrikerName={view.nonStrikerName}
            currentBowlerName={view.currentBowlerName}
            strikerPlayer={view.strikerPlayer}
            nonStrikerPlayer={view.nonStrikerPlayer}
            currentBowlerPlayer={view.currentBowlerPlayer}
            needsOpeners={innings.needsOpeners}
            openerSelections={innings.openerSelections}
            openerCandidates={view.openerCandidates}
            onSelectOpener={control.selectOpener}
            waitingForNextBatter={innings.waitingForNextBatter}
            nextBatterCandidates={view.nextBatterCandidates}
            onSelectNextBatter={control.selectNextBatter}
            waitingForNextBowler={innings.waitingForNextBowler}
            bowlerCandidates={view.bowlerCandidates}
            onSelectBowler={control.selectBowler}
            battingActions={view.battingActionOptions}
            bowlingActions={view.bowlingActionOptions}
            battingIntent={game.battingIntent}
            battingTactics={game.battingTactics}
            battingContext={context}
            bowlingIntent={game.bowlingIntent}
            bowlingTactics={game.bowlingTactics}
            bowlingContext={context}
            onBattingIntent={control.setBattingIntent}
            onBattingTacticsChange={control.setBattingTactics}
            onBowlingIntent={control.setBowlingIntent}
            onBowlingTacticsChange={control.setBowlingTactics}
            onBowlBall={control.deliver}
            onSaveGame={onSaveGame}
            isSavingGame={isSavingGame}
            saveMessage={saveMessage}
            canPlayNextBall={view.canPlayNextBall}
            showSimulationActions={!userInvolved}
            onSimulateOver={control.startAutoSimulation}
            onSimulateMatch={control.startAutoSimulation}
            isAutoSimulating={control.autoSimulating}
            showScoreboard={false}
            scorecard={scorecard}
            commentary={innings.commentary}
          />
        </>
      )}
    </StageShell>
  );
}
