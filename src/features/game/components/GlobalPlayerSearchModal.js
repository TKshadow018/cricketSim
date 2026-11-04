import React from "react";
import AppButton from "../../../components/ui/AppButton";

function GlobalPlayerSearchModal({ analytics, state }) {
  const {
    availableLeagueCountries,
    hasGlobalSearchFilters,
    globalPlayerTypeOptions,
    totalFilteredPlayers,
    totalSearchPages,
    normalizedGlobalSearchPage,
    paginatedGlobalPlayers,
  } = analytics;
  const {
    showGlobalPlayerSearch,
    setShowGlobalPlayerSearch,
    searchName,
    setSearchName,
    searchPlayerType,
    setSearchPlayerType,
    searchCountry,
    setSearchCountry,
    batVsPaceRange,
    setBatVsPaceRange,
    batVsSpinRange,
    setBatVsSpinRange,
    paceAbilityRange,
    setPaceAbilityRange,
    spinAbilityRange,
    setSpinAbilityRange,
    aggressionRange,
    setAggressionRange,
    matchesRange,
    setMatchesRange,
    runsRange,
    setRunsRange,
    runsPerMatchRange,
    setRunsPerMatchRange,
    wicketsRange,
    setWicketsRange,
    setGlobalSearchPage,
  } = state;

  return (
    <>
      {showGlobalPlayerSearch ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="Global player search">
          <div className="sim-confirm-modal sim-career-stats-modal" style={{ width: '95vw', maxWidth: '1600px' }}>
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowGlobalPlayerSearch(false)}
            >
              ×
            </button>
            <h4>Search Players Worldwide</h4>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
              <div style={{ maxWidth: '200px', width: '100%', flex: '0 0 200px' }}>
                <div className="sim-career-inline-fields" style={{ display: 'grid', gap: 8 }}>
                  <input
                    className="sim-career-input"
                    type="text"
                    placeholder="Player Name"
                    value={searchName}
                    onChange={(event) => setSearchName(event.target.value)}
                  />
                  <select className="sim-career-input" value={searchPlayerType} onChange={(event) => setSearchPlayerType(event.target.value)}>
                    <option value="">All Player Types</option>
                    {globalPlayerTypeOptions.map((type) => (
                      <option key={`search-player-type-${type}`} value={type}>{type}</option>
                    ))}
                  </select>
                  <select className="sim-career-input" value={searchCountry} onChange={(event) => setSearchCountry(event.target.value)}>
                    <option value="">All Countries</option>
                    {availableLeagueCountries.map((country) => (
                      <option key={`search-country-${country}`} value={country}>{country}</option>
                    ))}
                  </select>
                  <input className="sim-career-input" type="text" placeholder="Bat vs Pace (e.g. 30-80)" value={batVsPaceRange} onChange={(event) => setBatVsPaceRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Bat vs Spin (e.g. 30-80)" value={batVsSpinRange} onChange={(event) => setBatVsSpinRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Pace Ability (e.g. 40-90)" value={paceAbilityRange} onChange={(event) => setPaceAbilityRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Spin Ability (e.g. 20-70)" value={spinAbilityRange} onChange={(event) => setSpinAbilityRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Aggression (e.g. 50-95)" value={aggressionRange} onChange={(event) => setAggressionRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Matches (e.g. 5-20)" value={matchesRange} onChange={(event) => setMatchesRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Total Runs (e.g. 200-900)" value={runsRange} onChange={(event) => setRunsRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Runs/Match (e.g. 20-60)" value={runsPerMatchRange} onChange={(event) => setRunsPerMatchRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Total Wickets (e.g. 5-30)" value={wicketsRange} onChange={(event) => setWicketsRange(event.target.value)} />
                </div>
              </div>

              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div className="sim-career-inline-fields" style={{ marginBottom: 8 }}>
                  <span className="sim-series-length-card" style={{ padding: '6px 10px' }}>Players: {totalFilteredPlayers}</span>
                </div>

                <div className="sim-career-stats-scroll">
                  <div className="sim-scoreboard-panel">
                    <h4 className="sim-section-title">Players List ({totalFilteredPlayers})</h4>
                    {!hasGlobalSearchFilters ? (
                      <p>Enter at least one filter to load players.</p>
                    ) : (
                      <table className="sim-scoreboard-table">
                        <thead>
                          <tr>
                            <th>Player</th>
                            <th>Country</th>
                            <th>Team</th>
                            <th>Type</th>
                            <th>Bat vs Pace</th>
                            <th>Bat vs Spin</th>
                            <th>Pace</th>
                            <th>Spin</th>
                            <th>Aggression</th>
                            <th>Mat</th>
                            <th>Runs</th>
                            <th>Runs/Mat</th>
                            <th>Wkts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedGlobalPlayers.map((player) => (
                            <tr key={`global-search-${player.id}`}>
                              <td>{player.name}</td>
                              <td>{player.country}</td>
                              <td>{player.team}</td>
                              <td>{player.playerType}</td>
                              <td>{player.batVsPace}</td>
                              <td>{player.batVsSpin}</td>
                              <td>{player.paceAbility}</td>
                              <td>{player.spinAbility}</td>
                              <td>{player.aggression}</td>
                              <td>{player.matches}</td>
                              <td>{player.runs}</td>
                              <td>{player.runsPerMatch.toFixed(2)}</td>
                              <td>{player.wickets}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="sim-save-row-actions">
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="sim-series-length-card" style={{ padding: '6px 10px' }}>Page {normalizedGlobalSearchPage} of {totalSearchPages}</span>
                <AppButton text="Prev" onClick={() => setGlobalSearchPage((previous) => Math.max(1, previous - 1))} fullWidth={false} variant="secondary" disabled={normalizedGlobalSearchPage <= 1} />
                <AppButton text="Next" onClick={() => setGlobalSearchPage((previous) => Math.min(totalSearchPages, previous + 1))} fullWidth={false} variant="secondary" disabled={normalizedGlobalSearchPage >= totalSearchPages} />
                <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowGlobalPlayerSearch(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default GlobalPlayerSearchModal;
