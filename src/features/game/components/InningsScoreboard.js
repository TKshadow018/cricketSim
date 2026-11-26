import React from 'react';
import PlayerNameWithType from './PlayerNameWithType';

export default function InningsScoreboard({ inningsData, keyPrefix = 'innings' }) {
  if (!inningsData) return null;

  return (
    <div className="sim-scoreboard-block">
      <p className="sim-section-title">{inningsData.title}</p>
      <p>{inningsData.line} ({inningsData.overs})</p>
      {inningsData.extras ? (
        <p>Extras: {inningsData.extras.total} (wd {inningsData.extras.wides}, nb {inningsData.extras.noBalls},
          {' '}b {inningsData.extras.byes}, lb {inningsData.extras.legByes})</p>
      ) : null}
      <div className="sim-scoreboard-table-wrap">
        <p className="sim-section-title">Batting</p>
        <table className="sim-scoreboard-table">
          <thead><tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>SR</th><th>Dismissal</th></tr></thead>
          <tbody>
            {inningsData.battingRows.map((row) => (
              <tr key={`${keyPrefix}-bat-${row.name}`} className={row.isNotOut ? 'sim-scoreboard-row-notout' : ''}>
                <td><PlayerNameWithType player={row} /></td>
                <td>{row.runs}</td><td>{row.balls}</td><td>{row.strikeRate}</td><td>{row.dismissal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="sim-section-title">Bowling</p>
        <table className="sim-scoreboard-table">
          <thead><tr><th>Bowler</th><th>Overs</th><th>Runs</th><th>Economy</th><th>Avg/Wk</th><th>Wkts</th></tr></thead>
          <tbody>
            {inningsData.bowlingRows.map((row) => (
              <tr key={`${keyPrefix}-bowl-${row.name}`} className={row.isCurrent ? 'sim-scoreboard-row-current' : ''}>
                <td><PlayerNameWithType player={row} /></td>
                <td>{row.overs}</td><td>{row.runsConceded}</td><td>{row.economy}</td><td>{row.avgPerWicket}</td><td>{row.wickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
