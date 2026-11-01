import React from 'react';
import AppButton from '../../../components/ui/AppButton';
import { oversDisplay } from '../../../utils/simulatorUtils';
import { buildScorecard } from '../utils/controllerCommonUtils';
import { selectOpponentFieldForDelivery } from '../utils/opponentField';
import { selectLegalOpponentField } from '../utils/fieldingRules';
import { buildSuperOverScorecards } from '../utils/superOverScorecards';
import { useSuperOverController } from '../hooks/controller/useSuperOverController';
import InningsStage from './InningsStage';
import InningsScoreboard from './InningsScoreboard';
import ScoreboardModal from './ScoreboardModal';
import StageShell from './StageShell';

export default function SuperOverStage({
  game,
  ownPlayers,
  opponentPlayers,
  stageCommonProps,
  onMatchPrimaryAction,
  onSaveGame,
  isSavingGame,
  saveMessage,
}) {
  const control = useSuperOverController({ game, ownPlayers, opponentPlayers });
  const [showScorecard, setShowScorecard] = React.useState(false);
  const { state, innings, view, isFirstInnings } = control;
  const battingSide = isFirstInnings ? state.firstSide : state.firstSide === 'own' ? 'opponent' : 'own';
  const teamName = battingSide === 'own' ? game.ownTeam : game.opponentTeam;
  const firstName = state.firstSide === 'own' ? game.ownTeam : game.opponentTeam;
  const secondName = state.firstSide === 'own' ? game.opponentTeam : game.ownTeam;
  const active = ['first', 'second'].includes(state.phase);
  const target = isFirstInnings ? null : state.firstInnings.score + 1;
  const remaining = Math.max(0, 6 - innings.balls);
  const context = {
    ...view.bowlingContext,
    ...view.battingContext,
    score: innings.score,
    wickets: innings.wickets,
    over: oversDisplay(innings.balls),
    oversLimit: 1,
    target,
    ballsRemaining: remaining,
    runsRemaining: target === null ? null : Math.max(0, target - innings.score),
    currentRunRate: innings.balls ? (innings.score * 6 / innings.balls).toFixed(2) : '0.00',
    requiredRunRate: target === null || !remaining ? null : (Math.max(0, target - innings.score) * 6 / remaining).toFixed(2),
    matchCondition: game.matchCondition,
    matchTypeKey: game.matchTypeKey,
    matchType: { over: 1, isSuperOver: true },
    ruleset: game.ruleset,
    opponentFieldPreset: game.ruleset === 'realism'
      ? selectLegalOpponentField({
        inningState: innings,
        matchType: { over: 1, isSuperOver: true },
        matchTypeKey: game.matchTypeKey,
        target,
        battingHand: view.strikerPlayer?.battingHand,
      })
      : selectOpponentFieldForDelivery({
      isFirstInnings,
      inningState: innings,
      matchType: { over: 1 },
      matchTypeKey: game.matchTypeKey,
      firstInningsScore: state.firstInnings.score,
      }),
  };
  const firstView = control.buildView(true);
  const scorecard = {
    currentInnings: buildScorecard(`${teamName} Super Over`, innings, view, oversDisplay(innings.balls)),
    previousInnings: isFirstInnings ? null : buildScorecard(
      `${firstName} Super Over`, state.firstInnings, firstView, oversDisplay(state.firstInnings.balls)
    ),
  };
  const userInvolved = [game.ownTeam, game.opponentTeam].includes(game.tournamentUserTeam);
  const inningsCards = buildSuperOverScorecards({
    state, ownPlayers, opponentPlayers, ownTeam: game.ownTeam, opponentTeam: game.opponentTeam,
  });

  return (
    <StageShell {...stageCommonProps} title={`Super Over ${state.round}`} subtitle="The match was tied. Two wickets or six legal balls complete an innings.">
      {showScorecard ? (
        <ScoreboardModal onClose={() => setShowScorecard(false)}>
          {inningsCards.map((entry, index) => (
            <InningsScoreboard key={`${entry.team}-${index}`} inningsData={entry.scorecard} keyPrefix={`super-${index}`} />
          ))}
        </ScoreboardModal>
      ) : null}
      <AppButton text="Show Scorecard" onClick={() => setShowScorecard(true)} variant="secondary" fullWidth={false} />
      {control.error ? <p role="alert">{control.error}</p> : null}
      {!active ? (
        <div className="sim-scoreboard-panel">
          <p>{firstName}: {state.firstInnings.score}/{state.firstInnings.wickets}</p>
          <p>{secondName}: {state.secondInnings.score}/{state.secondInnings.wickets}</p>
          {typeof onSaveGame === 'function' ? (
            <AppButton text="Save Match" onClick={onSaveGame} disabled={isSavingGame} variant="secondary" fullWidth={false} />
          ) : null}
          {saveMessage ? <p>{saveMessage}</p> : null}
          {state.phase === 'resolved' ? (
            <>
              <p>{state.winnerTeam} won the Super Over.</p>
              <AppButton text="Continue tournament" onClick={onMatchPrimaryAction} fullWidth={false} />
            </>
          ) : (
            <AppButton text={state.firstInnings.score === state.secondInnings.score ? 'Next Super Over' : 'Confirm Super Over result'} onClick={control.advance} fullWidth={false} />
          )}
        </div>
      ) : (
        <InningsStage
          title={`${teamName} Super Over`}
          subtitle={`Over ${oversDisplay(innings.balls)} / 1`}
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
          openerCandidates={view.openerCandidates.filter(({ index }) => !innings.outBatterIndices.includes(index))}
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
      )}
    </StageShell>
  );
}
