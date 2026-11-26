import React from 'react';
import AppButton from '../../../components/ui/AppButton';
import { battingAction } from '../../../gameData/actionType';
import PlayerNameWithType from './PlayerNameWithType';
import ScoreboardModal from './ScoreboardModal';
import InningsScoreboard from './InningsScoreboard';
import BattingTacticsPanel from './BattingTacticsPanel';
import BowlingTacticsPanel from './BowlingTacticsPanel';

const splitCommentaryLine = (line = '') => {
  const match = line.match(/^(\d+\.\d+)\s+(.*)$/);
  if (!match) {
    return { ball: '', text: line };
  }

  return { ball: match[1], text: match[2] };
};

function InningsStage({
  title,
  subtitle,
  score,
  wickets,
  lastEvent,
  isUserBatting,
  isUserBowling,
  strikerName,
  nonStrikerName,
  currentBowlerName,
  strikerPlayer,
  nonStrikerPlayer,
  currentBowlerPlayer,
  needsOpeners,
  openerSelections,
  openerCandidates,
  onSelectOpener,
  waitingForNextBatter,
  nextBatterCandidates,
  onSelectNextBatter,
  waitingForNextBowler,
  bowlerCandidates,
  onSelectBowler,
  battingActions,
  bowlingActions,
  battingIntent,
  battingTactics,
  battingContext,
  bowlingIntent,
  bowlingTactics,
  bowlingContext,
  onBattingIntent,
  onBattingTacticsChange,
  onBowlingIntent,
  onBowlingTacticsChange,
  onBowlBall,
  onSaveGame,
  isSavingGame,
  saveMessage,
  canPlayNextBall,
  showSimulationActions,
  onSimulateOver,
  onSimulateMatch,
  isAutoSimulating,
  showScoreboard,
  scorecard,
  commentary,
  onCloseScoreboard,
}) {
  const safeOnBattingIntent = typeof onBattingIntent === 'function' ? onBattingIntent : () => {};
  const safeOnBattingTacticsChange =
    typeof onBattingTacticsChange === 'function' ? onBattingTacticsChange : () => {};
  const safeOnBowlingIntent = typeof onBowlingIntent === 'function' ? onBowlingIntent : () => {};
  const safeOnBowlingTacticsChange =
    typeof onBowlingTacticsChange === 'function' ? onBowlingTacticsChange : () => {};
  const showBowlingCockpit = Boolean(
    isUserBowling && bowlingTactics && !waitingForNextBowler && !waitingForNextBatter
  );
  const showBattingCockpit = Boolean(
    isUserBatting && battingTactics && !needsOpeners && !waitingForNextBatter
  );

  return (
    <>
      {showScoreboard ? (
        <ScoreboardModal onClose={onCloseScoreboard}>
          <InningsScoreboard inningsData={scorecard.currentInnings} keyPrefix="current" />
          <InningsScoreboard inningsData={scorecard.previousInnings} keyPrefix="previous" />
        </ScoreboardModal>
      ) : null}
      <div className="sim-score-row">
        <h3>{title}</h3>
        <div className="sim-score-pill">{score}/{wickets}</div>
      </div>
      <p className="sim-subtitle">{subtitle}</p>
      <div className={`sim-innings-layout ${showBowlingCockpit ? 'sim-innings-layout--bowling' : ''} ${showBattingCockpit ? 'sim-innings-layout--batting' : ''}`}>
        <div className='sim-match-action-layout'>
          <p className="sim-event-line">{lastEvent}</p>

          {strikerName || nonStrikerName || currentBowlerName ? (
            (isUserBowling && bowlingTactics) || (isUserBatting && battingTactics) ? null : (
            <div className="sim-player-strip">
              {strikerName ? <p>Striker: <PlayerNameWithType player={strikerPlayer} name={strikerName} /></p> : null}
              {nonStrikerName ? <p>Non-Striker: <PlayerNameWithType player={nonStrikerPlayer} name={nonStrikerName} /></p> : null}
              {currentBowlerName ? <p>Bowler: <PlayerNameWithType player={currentBowlerPlayer} name={currentBowlerName} /></p> : null}
            </div>
            )
          ) : null}

          {isUserBatting && !needsOpeners && !waitingForNextBowler && !waitingForNextBatter ? (
            battingTactics ? (
              <BattingTacticsPanel
                tactics={battingTactics}
                context={battingContext}
                actions={battingActions}
                intent={battingIntent}
                onTacticsChange={safeOnBattingTacticsChange}
                onIntentChange={safeOnBattingIntent}
              />
            ) : (
              <>
                <p className="sim-section-title">Batting Intent</p>
                <div className="sim-intent-grid">
                  {battingActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      aria-pressed={battingIntent === action.key}
                      aria-label={action.reason ? `${action.label}. ${action.reason}` : undefined}
                      className={`sim-intent-btn ${battingIntent === action.key ? 'active' : ''} ${action.disabled ? 'disabled' : ''}`}
                      onClick={() => safeOnBattingIntent(action.key)}
                      disabled={action.disabled}
                      title={action.reason || ''}
                    >
                      <span>{action.label}</span>
                      {action.reason ? <small>{action.reason}</small> : null}
                    </button>
                  ))}
                </div>
              </>
            )
          ) : null}

          {isUserBowling && !waitingForNextBowler && !waitingForNextBatter ? (
            bowlingTactics ? (
              <BowlingTacticsPanel
                tactics={bowlingTactics}
                context={bowlingContext}
                onTacticsChange={safeOnBowlingTacticsChange}
              />
            ) : (
            <>
              <p className="sim-section-title">Bowling Intent</p>
              <div className="sim-intent-grid">
                {bowlingActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    aria-pressed={bowlingIntent === action.key}
                    aria-label={action.reason ? `${action.label}. ${action.reason}` : undefined}
                    className={`sim-intent-btn ${bowlingIntent === action.key ? 'active' : ''} ${action.disabled ? 'disabled' : ''}`}
                    onClick={() => safeOnBowlingIntent(action.key)}
                    disabled={action.disabled}
                    title={action.reason || ''}
                  >
                    <span>{action.label}</span>
                    {action.reason ? <small>{action.reason}</small> : null}
                  </button>
                ))}
              </div>
            </>
            )
          ) : null}

          {needsOpeners ? (
            <>
              <p className="sim-section-title">Choose Openers</p>
              <div className="sim-player-pick-grid">
                {openerCandidates.map((player) => (
                  <button
                    key={player.index}
                    type="button"
                    className={`sim-player-pick-btn ${openerSelections.includes(player.index) ? 'active' : ''}`}
                    aria-pressed={openerSelections.includes(player.index)}
                    onClick={() => onSelectOpener(player.index)}
                  >
                    <PlayerNameWithType player={player.player} name={player.name} />
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {waitingForNextBatter ? (
            <>
              <p className="sim-section-title">Choose Next Batsman</p>
              <div className="sim-player-pick-grid">
                {nextBatterCandidates.map((player) => (
                  <button
                    key={player.index}
                    type="button"
                    className={`sim-player-pick-btn ${player.disabled ? 'disabled' : ''}`}
                    onClick={() => onSelectNextBatter(player.index)}
                    disabled={player.disabled}
                    title={player.reason || ''}
                  >
                    <PlayerNameWithType player={player.player} name={player.name} />
                    {player.reason ? <small>{player.reason}</small> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {waitingForNextBowler ? (
            <>
              <p className="sim-section-title">Choose Next Bowler</p>
              <div className="sim-player-pick-grid">
                {bowlerCandidates.map((player) => (
                  <button
                    key={player.index}
                    type="button"
                    className={`sim-player-pick-btn ${player.disabled ? 'disabled' : ''}`}
                    onClick={() => onSelectBowler(player.index)}
                    disabled={player.disabled}
                    title={player.reason || ''}
                  >
                    <PlayerNameWithType player={player.player} name={player.name} />
                    {player.reason ? <small>{player.reason}</small> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="sim-innings-action">
            <AppButton
              text={
                isAutoSimulating
                  ? 'Simulating...'
                  : isUserBowling && bowlingTactics?.specialDeliveryArmed
                    ? 'Play Special Delivery'
                    : isUserBatting && battingIntent === battingAction.superShot
                      ? 'Play Super Shot'
                      : isUserBatting && battingContext?.freeHitArmed
                        ? 'Play Free Hit'
                        : 'Play Next Ball'
              }
              onClick={onBowlBall}
              fullWidth={false}
              disabled={!canPlayNextBall || isAutoSimulating}
            />
            {showSimulationActions ? (
              <>
                <AppButton
                  text="Simulate Over"
                  onClick={onSimulateOver}
                  variant="secondary"
                  fullWidth={false}
                  disabled={!canPlayNextBall || isAutoSimulating}
                />
                <AppButton
                  text="Simulate Full Match"
                  onClick={onSimulateMatch}
                  variant="secondary"
                  fullWidth={false}
                  disabled={!canPlayNextBall || isAutoSimulating}
                />
              </>
            ) : null}
            <AppButton
              text={isSavingGame ? 'Saving...' : 'Save Game'}
              onClick={onSaveGame}
              variant="secondary"
              fullWidth={false}
              disabled={isSavingGame}
            />
            {saveMessage ? <small>{saveMessage}</small> : null}
          </div>
        </div>

        <ul className="sim-commentary-feed" aria-label="Match commentary" aria-live="polite">
          {!commentary.length ? (
            <li className="sim-commentary-empty">
              Commentary will appear after the first delivery.
            </li>
          ) : commentary.map((line, index) => {
            const item = splitCommentaryLine(line);
            return (
              <li key={`${line}-${index}`}>
                {item.ball ? <span className="sim-ball-tag">{item.ball}</span> : null}
                <span className="sim-commentary-text">{item.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default InningsStage;
