import React from 'react';
import AppButton from '../../../components/ui/AppButton';

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
  bowlingIntent,
  onBattingIntent,
  onBowlingIntent,
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
}) {
  const renderInningsScoreboard = (inningsData, keyPrefix) => {
    if (!inningsData) {
      return null;
    }

    return (
      <div className="sim-scoreboard-block">
        <p className="sim-section-title">{inningsData.title}</p>
        <p>{inningsData.line} ({inningsData.overs})</p>

        <div className="sim-scoreboard-table-wrap">
          <p className="sim-section-title">Batting</p>
          <table className="sim-scoreboard-table">
            <thead>
              <tr>
                <th>Batsman</th>
                <th>Runs</th>
                <th>Balls</th>
                <th>SR</th>
                <th>Dismissal</th>
              </tr>
            </thead>
            <tbody>
              {inningsData.battingRows.map((row) => (
                <tr key={`${keyPrefix}-bat-${row.name}`} className={row.isNotOut ? 'sim-scoreboard-row-notout' : ''}>
                  <td>{row.name}</td>
                  <td>{row.runs}</td>
                  <td>{row.balls}</td>
                  <td>{row.strikeRate}</td>
                  <td>{row.dismissal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="sim-section-title">Bowling</p>
          <table className="sim-scoreboard-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th>Overs</th>
                <th>Runs</th>
                <th>Economy</th>
                <th>Avg/Wk</th>
                <th>Wkts</th>
              </tr>
            </thead>
            <tbody>
              {inningsData.bowlingRows.map((row) => (
                <tr key={`${keyPrefix}-bowl-${row.name}`} className={row.isCurrent ? 'sim-scoreboard-row-current' : ''}>
                  <td>{row.name}</td>
                  <td>{row.overs}</td>
                  <td>{row.runsConceded}</td>
                  <td>{row.economy}</td>
                  <td>{row.avgPerWicket}</td>
                  <td>{row.wickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {showScoreboard ? (
            <div className="sim-scoreboard-panel">
              <h4>Full Scoreboard</h4>
              {renderInningsScoreboard(scorecard.currentInnings, 'current')}
              {scorecard.previousInnings ? renderInningsScoreboard(scorecard.previousInnings, 'previous') : null}
            </div>
          ) : null}
      <div className="sim-score-row">
        <h3>{title}</h3>
        <div className="sim-score-pill">{score}/{wickets}</div>
      </div>
      <p className="sim-subtitle">{subtitle}</p>
      <div className="sim-innings-layout">
        <div className='sim-match-action-layout'>
          <p className="sim-event-line">{lastEvent}</p>

          {strikerName || nonStrikerName || currentBowlerName ? (
            <div className="sim-player-strip">
              {strikerName ? <p>Striker: {strikerName}</p> : null}
              {nonStrikerName ? <p>Non-Striker: {nonStrikerName}</p> : null}
              {currentBowlerName ? <p>Bowler: {currentBowlerName}</p> : null}
            </div>
          ) : null}

          {isUserBatting && !needsOpeners && !waitingForNextBowler && !waitingForNextBatter ? (
            <>
              <p className="sim-section-title">Batting Intent</p>
              <div className="sim-intent-grid">
                {battingActions.map((action) => (
                  <button
                    key={action.key}
                    className={`sim-intent-btn ${battingIntent === action.key ? 'active' : ''} ${action.disabled ? 'disabled' : ''}`}
                    onClick={() => onBattingIntent(action.key)}
                    disabled={action.disabled}
                    title={action.reason || ''}
                  >
                    <span>{action.label}</span>
                    {action.reason ? <small>{action.reason}</small> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {isUserBowling && !waitingForNextBowler && !waitingForNextBatter ? (
            <>
              <p className="sim-section-title">Bowling Intent</p>
              <div className="sim-intent-grid">
                {bowlingActions.map((action) => (
                  <button
                    key={action.key}
                    className={`sim-intent-btn ${bowlingIntent === action.key ? 'active' : ''} ${action.disabled ? 'disabled' : ''}`}
                    onClick={() => onBowlingIntent(action.key)}
                    disabled={action.disabled}
                    title={action.reason || ''}
                  >
                    <span>{action.label}</span>
                    {action.reason ? <small>{action.reason}</small> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {needsOpeners ? (
            <>
              <p className="sim-section-title">Choose Openers</p>
              <div className="sim-player-pick-grid">
                {openerCandidates.map((player) => (
                  <button
                    key={player.index}
                    className={`sim-player-pick-btn ${openerSelections.includes(player.index) ? 'active' : ''}`}
                    onClick={() => onSelectOpener(player.index)}
                  >
                    {player.name}
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
                    className={`sim-player-pick-btn ${player.disabled ? 'disabled' : ''}`}
                    onClick={() => onSelectNextBatter(player.index)}
                    disabled={player.disabled}
                    title={player.reason || ''}
                  >
                    <span>{player.name}</span>
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
                    className={`sim-player-pick-btn ${player.disabled ? 'disabled' : ''}`}
                    onClick={() => onSelectBowler(player.index)}
                    disabled={player.disabled}
                    title={player.reason || ''}
                  >
                    <span>{player.name}</span>
                    {player.reason ? <small>{player.reason}</small> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="sim-innings-action">
            <AppButton
              text={isAutoSimulating ? 'Simulating...' : 'Play Next Ball'}
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

        <ul className="sim-commentary-feed">
          {commentary.map((line, index) => {
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
