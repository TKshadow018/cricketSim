import React from 'react';
import { motion } from 'framer-motion';
import AppButton from '../../../components/ui/AppButton';

export function TossResultCard({
  winner,
  decision,
  commentator,
  isUserWinner,
  onUserDecision,
}) {
  const isBat = decision === 'bat';
  const remainingForUser = isBat ? 'bowl' : 'bat';

  return (
    <div className="sim-result-block">
      <h3>{winner} won the toss</h3>
      <p>Decision: {decision.toUpperCase()}</p>
      <p>Commentator: {commentator}</p>

      {isUserWinner ? (
        <>
          <p>You won the toss. Choose what your team does first.</p>
          <div className="sim-choice-icons sim-choice-buttons">
            <button onClick={() => onUserDecision('bat')} className={isBat ? 'active' : 'faded'}>
              <img src="/asset/img/icon/cricket-bat.png" alt="bat" />
            </button>
            <button onClick={() => onUserDecision('bowl')} className={isBat ? 'faded' : 'active'}>
              <img src="/asset/img/icon/cricket-ball.png" alt="ball" />
            </button>
          </div>
        </>
      ) : (
        <>
          <p>Waiting for opponent decision...</p>
          <div className="sim-choice-icons sim-choice-buttons">
            <button
              disabled={isBat}
              onClick={() => onUserDecision('bat')}
              className={isBat ? 'active locked' : 'faded selectable'}
            >
              <img src="/asset/img/icon/cricket-bat.png" alt="bat" />
            </button>
            <button
              disabled={!isBat}
              onClick={() => onUserDecision('bowl')}
              className={isBat ? 'faded selectable' : 'active locked'}
            >
              <img src="/asset/img/icon/cricket-ball.png" alt="ball" />
            </button>
          </div>
          <p>Opponent chose to {decision} first. Click your only available option to continue: {remainingForUser}.</p>
        </>
      )}
    </div>
  );
}

export function MatchResultCard({
  teamOneLine,
  teamTwoLine,
  teamOneOvers,
  teamTwoOvers,
  summary,
  onNewMatch,
  showScoreboard,
  scorecard,
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
    <div className="sim-final-grid">
      <div className="sim-final-card">
        <h4>{teamOneLine}</h4>
        <p>Overs: {teamOneOvers}</p>
      </div>
      <div className="sim-final-card">
        <h4>{teamTwoLine}</h4>
        <p>Overs: {teamTwoOvers}</p>
      </div>
      <motion.h3
        className="sim-winner-line"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        {summary}
      </motion.h3>
      {showScoreboard ? (
        <div className="sim-scoreboard-panel">
          <h4>Full Scoreboard</h4>
          {renderInningsScoreboard(scorecard?.currentInnings, 'current')}
          {scorecard?.previousInnings ? renderInningsScoreboard(scorecard.previousInnings, 'previous') : null}
        </div>
      ) : null}
      <AppButton text="Play New Match" onClick={onNewMatch} />
    </div>
  );
}
