import React from "react";
import AppButton from "../../../components/ui/AppButton";
import PlayerNameWithType from "./PlayerNameWithType";
import { CAREER_FORMATS, formatCareerMatchLabel } from "../utils/controllerCareerScheduleUtils";
import GlobalPlayerSearchModal from "./GlobalPlayerSearchModal";

function CareerAnalyticsModals({ analytics, state }) {
  const {
    domesticTeamsForSelectedFormat,
    selectedDomesticTeamStats,
    openCareerPlayerProfile,
    leagueTableRowsForSelectedCountry,
    leaguePlayerStatsByFormat,
    availableLeagueCountries,
  } = analytics;
  const {
    showDomesticStats,
    setShowDomesticStats,
    domesticStatsFormatTab,
    setDomesticStatsFormatTab,
    domesticStatsTeamTab,
    setDomesticStatsTeamTab,
    showLeagueTable,
    setShowLeagueTable,
    showLeaguePlayerStats,
    setShowLeaguePlayerStats,
    leagueTableFormatTab,
    setLeagueTableFormatTab,
    leaguePlayerFormatTab,
    setLeaguePlayerFormatTab,
    selectedLeagueCountry,
    setSelectedLeagueCountry,
  } = state;

  return (
    <>
{showDomesticStats ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="Domestic team season statistics">
          <div className="sim-confirm-modal sim-career-stats-modal">
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowDomesticStats(false)}
            >
              ×
            </button>
            <h4>Domestic Teams - Current Season Player Statistics</h4>
            <div className="sim-career-format-tabs" role="tablist" aria-label="Domestic player stats format tabs">
              {CAREER_FORMATS.map((format) => (
                <button
                  key={`domestic-player-tab-${format}`}
                  type="button"
                  className={`sim-career-format-tab ${domesticStatsFormatTab === format ? 'active' : ''}`}
                  role="tab"
                  aria-selected={domesticStatsFormatTab === format}
                  onClick={() => setDomesticStatsFormatTab(format)}
                >
                  {formatCareerMatchLabel(format)}
                </button>
              ))}
            </div>
            <div className="sim-career-format-tabs" role="tablist" aria-label="Domestic teams tabs">
              {domesticTeamsForSelectedFormat.map((entry) => (
                <button
                  key={`domestic-team-tab-${domesticStatsFormatTab}-${entry.teamName}`}
                  type="button"
                  className={`sim-career-format-tab ${domesticStatsTeamTab === entry.teamName ? 'active' : ''}`}
                  role="tab"
                  aria-selected={domesticStatsTeamTab === entry.teamName}
                  onClick={() => setDomesticStatsTeamTab(entry.teamName)}
                >
                  {entry.teamName}
                </button>
              ))}
            </div>
            <div className="sim-career-stats-scroll">
              {selectedDomesticTeamStats ? (
                <div key={selectedDomesticTeamStats.teamName} className="sim-scoreboard-panel">
                  <h4 className="sim-section-title">{selectedDomesticTeamStats.teamName}</h4>

                  <h4 className="sim-section-title">Batting</h4>
                  <table className="sim-scoreboard-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Mat</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>Outs</th>
                        <th>Avg</th>
                        <th>SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedDomesticTeamStats.rows]
                        .sort((left, right) => right.runs - left.runs || left.outs - right.outs || left.name.localeCompare(right.name))
                        .map((player) => (
                        <tr key={`${selectedDomesticTeamStats.teamName}-${player.id}`}>
                          <td>
                            <button
                              type="button"
                              className="sim-player-link-btn"
                              onClick={() => openCareerPlayerProfile(player, selectedDomesticTeamStats.teamName)}
                            >
                              <PlayerNameWithType player={player} />
                            </button>
                          </td>
                          <td>{player.matches}</td>
                          <td>{player.runs}</td>
                          <td>{player.balls}</td>
                          <td>{player.outs}</td>
                          <td>{player.battingAverage}</td>
                          <td>{player.strikeRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4 className="sim-section-title">Bowling</h4>
                  <table className="sim-scoreboard-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Mat</th>
                        <th>Overs</th>
                        <th>Balls</th>
                        <th>Runs</th>
                        <th>Wkts</th>
                        <th>Econ</th>
                        <th>Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedDomesticTeamStats.rows]
                        .sort(
                          (left, right) =>
                            right.wickets - left.wickets ||
                            Number(left.economy) - Number(right.economy) ||
                            left.name.localeCompare(right.name)
                        )
                        .map((player) => (
                        <tr key={`${selectedDomesticTeamStats.teamName}-${player.id}-bowl`}>
                          <td>
                            <button
                              type="button"
                              className="sim-player-link-btn"
                              onClick={() => openCareerPlayerProfile(player, selectedDomesticTeamStats.teamName)}
                            >
                              <PlayerNameWithType player={player} />
                            </button>
                          </td>
                          <td>{player.matches}</td>
                          <td>{player.overs}</td>
                          <td>{player.ballsBowled}</td>
                          <td>{player.runsConceded}</td>
                          <td>{player.wickets}</td>
                          <td>{player.economy}</td>
                          <td>{player.bowlingAverage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No team data available for this format yet.</p>
              )}
            </div>
            <div className="sim-save-row-actions">
              <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowDomesticStats(false)} />
            </div>
          </div>
        </div>
      ) : null}
{showLeagueTable ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="League table by format">
          <div className="sim-confirm-modal sim-career-stats-modal">
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowLeagueTable(false)}
            >
              ×
            </button>
            <h4>League Table</h4>
            <div className="sim-career-inline-fields">
              <label htmlFor="league-table-country-select">Country</label>
              <select
                id="league-table-country-select"
                className="sim-career-input"
                value={selectedLeagueCountry}
                onChange={(event) => setSelectedLeagueCountry(event.target.value)}
              >
                <option value="">Select country</option>
                {availableLeagueCountries.map((country) => (
                  <option key={`league-table-country-${country}`} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="sim-career-format-tabs" role="tablist" aria-label="League table format tabs">
              {CAREER_FORMATS.map((format) => (
                <button
                  key={`league-table-tab-${format}`}
                  type="button"
                  className={`sim-career-format-tab ${leagueTableFormatTab === format ? 'active' : ''}`}
                  role="tab"
                  aria-selected={leagueTableFormatTab === format}
                  onClick={() => setLeagueTableFormatTab(format)}
                >
                  {formatCareerMatchLabel(format)}
                </button>
              ))}
            </div>
            <div className="sim-career-stats-scroll">
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">{formatCareerMatchLabel(leagueTableFormatTab)} Standings ({selectedLeagueCountry || 'N/A'})</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>T</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueTableRowsForSelectedCountry.map((row, index) => (
                      <tr key={`league-table-${leagueTableFormatTab}-${row.team}`}>
                        <td>{index + 1}</td>
                        <td>{row.team}</td>
                        <td>{row.played}</td>
                        <td>{row.wins}</td>
                        <td>{row.losses}</td>
                        <td>{row.ties}</td>
                        <td><strong>{row.points}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sim-save-row-actions">
              <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowLeagueTable(false)} />
            </div>
          </div>
        </div>
      ) : null}
{showLeaguePlayerStats ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="League player statistics by format">
          <div className="sim-confirm-modal sim-career-stats-modal">
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowLeaguePlayerStats(false)}
            >
              ×
            </button>
            <h4>League Player Statistics</h4>
            <div className="sim-career-inline-fields">
              <label htmlFor="league-player-country-select">Country</label>
              <select
                id="league-player-country-select"
                className="sim-career-input"
                value={selectedLeagueCountry}
                onChange={(event) => setSelectedLeagueCountry(event.target.value)}
              >
                <option value="">Select country</option>
                {availableLeagueCountries.map((country) => (
                  <option key={`league-player-country-${country}`} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="sim-career-format-tabs" role="tablist" aria-label="League player stats format tabs">
              {CAREER_FORMATS.map((format) => (
                <button
                  key={`league-player-tab-${format}`}
                  type="button"
                  className={`sim-career-format-tab ${leaguePlayerFormatTab === format ? 'active' : ''}`}
                  role="tab"
                  aria-selected={leaguePlayerFormatTab === format}
                  onClick={() => setLeaguePlayerFormatTab(format)}
                >
                  {formatCareerMatchLabel(format)}
                </button>
              ))}
            </div>
            <div className="sim-career-stats-scroll">
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Top 20 Scorers ({selectedLeagueCountry || 'N/A'} - {formatCareerMatchLabel(leaguePlayerFormatTab)})</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Mat</th>
                      <th>Runs</th>
                      <th>Balls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaguePlayerStatsByFormat[leaguePlayerFormatTab].topScorers.map((entry, index) => (
                      <tr key={`league-scorer-${leaguePlayerFormatTab}-${entry.key}`}>
                        <td>{index + 1}</td>
                        <td>
                          <button
                            type="button"
                            className="sim-player-link-btn"
                            onClick={() => openCareerPlayerProfile(entry, entry.team)}
                          >
                            <PlayerNameWithType player={entry} />
                          </button>
                        </td>
                        <td>{entry.team}</td>
                        <td>{entry.matches}</td>
                        <td>{entry.runs}</td>
                        <td>{entry.balls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Top 20 Wicket Takers ({selectedLeagueCountry || 'N/A'} - {formatCareerMatchLabel(leaguePlayerFormatTab)})</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Mat</th>
                      <th>Wkts</th>
                      <th>Overs</th>
                      <th>Runs Conceded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaguePlayerStatsByFormat[leaguePlayerFormatTab].topWicketTakers.map((entry, index) => (
                      <tr key={`league-wicket-${leaguePlayerFormatTab}-${entry.key}`}>
                        <td>{index + 1}</td>
                        <td>
                          <button
                            type="button"
                            className="sim-player-link-btn"
                            onClick={() => openCareerPlayerProfile(entry, entry.team)}
                          >
                            <PlayerNameWithType player={entry} />
                          </button>
                        </td>
                        <td>{entry.team}</td>
                        <td>{entry.matches}</td>
                        <td>{entry.wickets}</td>
                        <td>{`${Math.floor((entry.ballsBowled || 0) / 6)}.${(entry.ballsBowled || 0) % 6}`}</td>
                        <td>{entry.runsConceded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sim-save-row-actions">
              <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowLeaguePlayerStats(false)} />
            </div>
          </div>
        </div>
      ) : null}
      <GlobalPlayerSearchModal analytics={analytics} state={state} />
    </>
  );
}

export default CareerAnalyticsModals;
