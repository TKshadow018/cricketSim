import React from 'react';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';

function PlayerCard({
  player,
  cardKey,
  draggable = false,
  active = false,
  disabled = false,
  dragContext,
  onDragStart,
  onDragEnd,
  onClick,
  hint,
}) {
  return (
    <button
      key={cardKey}
      type="button"
      draggable={draggable}
      className={`sim-player-pick-btn ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`.trim()}
      onDragStart={
        dragContext
          ? (event) => onDragStart(event, dragContext.teamKey, dragContext.sourceList, player.id)
          : undefined
      }
      onDragEnd={onDragEnd}
      onClick={onClick}
      disabled={disabled}
    >
      <strong>{player.name}</strong>
      <div className="sim-player-stat-row">
        <span className="sim-player-stat-pill sim-player-stat-batpace">BP {player.abilityToPlayPaceBall || 0}</span>
        <span className="sim-player-stat-pill sim-player-stat-batspin">BS {player.abilityToPlaySpinBall || 0}</span>
        <span className="sim-player-stat-pill sim-player-stat-pace">P {player.paceAbility || 0}</span>
        <span className="sim-player-stat-pill sim-player-stat-spin">S {player.spinAbility || 0}</span>
      </div>
      <small>{hint}</small>
    </button>
  );
}

function XIStage({
  title,
  subtitle,
  selectedCount,
  availablePool,
  selectedPlayers,
  teamKey,
  roles,
  setRole,
  movePlayer,
  removePlayer,
  autoPick,
  openCustomModal,
  primaryActionText,
  primaryAction,
  primaryDisabled,
  stageCommonProps,
  setupBackSlot,
  onDropToAvailable,
  onDropToSelected,
  onDragStart,
  onDragEnd,
}) {
  return (
    <StageShell {...stageCommonProps} title={title} subtitle={subtitle} rightSlot={setupBackSlot} dark>
      <p className="sim-section-title">Selected: {selectedCount} / 11</p>
      <div className="sim-xi-dnd-layout">
        <div
          className="sim-xi-column"
          onDragOver={(event) => {
            event.preventDefault();
            if (event.dataTransfer) {
              event.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={(event) => onDropToAvailable(teamKey, event)}
        >
          <h4>Available Players</h4>
          <div className="sim-player-pick-grid">
            {availablePool.map((player) => (
              <PlayerCard
                key={`available-${teamKey}-${player.id}`}
                player={player}
                cardKey={`available-${teamKey}-${player.id}`}
                draggable
                disabled={selectedCount >= 11}
                dragContext={{ teamKey, sourceList: 'available' }}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={() => movePlayer(player.id)}
                hint="Drag to selected XI"
              />
            ))}
          </div>
        </div>

        <div
          className="sim-xi-column"
          onDragOver={(event) => {
            event.preventDefault();
            if (event.dataTransfer) {
              event.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={(event) => onDropToSelected(teamKey, event)}
        >
          <h4>Selected XI</h4>
          <div className="sim-player-pick-grid">
            {selectedPlayers.map((player) => (
              <PlayerCard
                key={`selected-${teamKey}-${player.id}`}
                player={player}
                cardKey={`selected-${teamKey}-${player.id}`}
                draggable
                active
                dragContext={{ teamKey, sourceList: 'selected' }}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={() => removePlayer(player.id)}
                hint="Drag back to remove"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="sim-xi-role-grid">
        <label>
          Captain
          <select value={roles?.captainId ?? ''} onChange={(event) => setRole('captainId', Number(event.target.value) || null)}>
            <option value="">Select captain</option>
            {selectedPlayers.map((player) => (
              <option key={`cap-${teamKey}-${player.id}`} value={player.id} disabled={roles?.viceCaptainId === player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vice Captain
          <select value={roles?.viceCaptainId ?? ''} onChange={(event) => setRole('viceCaptainId', Number(event.target.value) || null)}>
            <option value="">Select vice captain</option>
            {selectedPlayers.map((player) => (
              <option key={`vcap-${teamKey}-${player.id}`} value={player.id} disabled={roles?.captainId === player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Wicketkeeper
          <select value={roles?.wicketKeeperId ?? ''} onChange={(event) => setRole('wicketKeeperId', Number(event.target.value) || null)}>
            <option value="">Select wicketkeeper</option>
            {selectedPlayers
              .filter((player) => player.isWicketKeeper)
              .map((player) => (
                <option key={`wk-${teamKey}-${player.id}`} value={player.id}>
                  {player.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="sim-save-row-actions">
        <AppButton text="Auto Pick 11" variant="secondary" fullWidth={false} onClick={autoPick} />
        <AppButton text="Create Custom Player" variant="secondary" fullWidth={false} onClick={() => openCustomModal(teamKey)} />
        <AppButton text={primaryActionText} fullWidth={false} onClick={primaryAction} disabled={primaryDisabled} />
      </div>
    </StageShell>
  );
}

function PreMatchSelectionStages(props) {
  const {
    stage,
    stageCommonProps,
    setupBackSlot,
    tournamentMatches,
    tournamentUserTeam,
    tournamentOpponentTeams,
    randomizeTournamentFixtures,
    confirmTournamentFixtures,
    updateTournamentFixture,
    ownSelectedXIIds,
    opponentSelectedXIIds,
    ownAvailablePool,
    opponentAvailablePool,
    ownSelectedXIPlayers,
    opponentSelectedXIPlayers,
    ownTeamRoles,
    opponentTeamRoles,
    setOwnRole,
    setOpponentRole,
    ownXIReady,
    opponentXIReady,
    ownRolesReady,
    opponentRolesReady,
    moveOwnPlayerToXI,
    removeOwnPlayerFromXI,
    moveOpponentPlayerToXI,
    removeOpponentPlayerFromXI,
    autoPickOwnXI,
    autoPickOpponentXI,
    openCustomModal,
    startMatchWithSelectedXI,
    goToNextStage,
    onDropToAvailable,
    onDropToSelected,
    onDragStart,
    onDragEnd,
    customPlayerModal,
    updateCustomField,
    closeCustomModal,
    submitCustomPlayer,
  } = props;

  return (
    <>
      {stage === matchStatusEnum.SetupTournamentFixtures && (
        <StageShell
          {...stageCommonProps}
          title="Setup Tournament Fixtures"
          subtitle="Set first-round pairings and match dates, or randomize all fixtures."
          rightSlot={setupBackSlot}
          dark
        >
          <p className="sim-section-title">Teams: {[tournamentUserTeam, ...tournamentOpponentTeams].filter(Boolean).join(' • ')}</p>
          <div className="sim-save-row-actions">
            <AppButton text="Randomize Fixtures" variant="secondary" fullWidth={false} onClick={randomizeTournamentFixtures} />
            <AppButton text="Confirm Fixtures" fullWidth={false} onClick={confirmTournamentFixtures} />
          </div>
          <div className="sim-series-summary-grid">
            {(tournamentMatches || [])
              .filter((match) => match.round === 1)
              .map((match) => {
                const teamOptions = [tournamentUserTeam, ...tournamentOpponentTeams].filter(Boolean);
                return (
                  <div key={`fixture-${match.id}`} className="sim-scoreboard-panel">
                    <h4>{match.id}</h4>
                    <div className="sim-fixture-grid">
                      <label>
                        Team A
                        <select value={match.teamA} onChange={(event) => updateTournamentFixture(match.id, 'teamA', event.target.value)}>
                          <option value="">Select team</option>
                          {teamOptions.map((team) => (
                            <option key={`fixture-a-${match.id}-${team}`} value={team}>{team}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Team B
                        <select value={match.teamB} onChange={(event) => updateTournamentFixture(match.id, 'teamB', event.target.value)}>
                          <option value="">Select team</option>
                          {teamOptions.map((team) => (
                            <option key={`fixture-b-${match.id}-${team}`} value={team}>{team}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Match Date
                        <input type="date" value={match.date || ''} onChange={(event) => updateTournamentFixture(match.id, 'date', event.target.value)} />
                      </label>
                    </div>
                  </div>
                );
              })}
          </div>
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseOwnPlayingXI && (
        <XIStage
          title="Select Your Team"
          subtitle="Choose exactly 11 players for your playing XI."
          selectedCount={ownSelectedXIIds.length}
          availablePool={ownAvailablePool}
          selectedPlayers={ownSelectedXIPlayers}
          teamKey="own"
          roles={ownTeamRoles}
          setRole={setOwnRole}
          movePlayer={moveOwnPlayerToXI}
          removePlayer={removeOwnPlayerFromXI}
          autoPick={autoPickOwnXI}
          openCustomModal={openCustomModal}
          primaryActionText="Continue"
          primaryAction={goToNextStage}
          primaryDisabled={!ownXIReady || !ownRolesReady}
          stageCommonProps={stageCommonProps}
          setupBackSlot={setupBackSlot}
          onDropToAvailable={onDropToAvailable}
          onDropToSelected={onDropToSelected}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )}

      {stage === matchStatusEnum.ChooseOpponentPlayingXI && (
        <XIStage
          title="Select Opponent Team"
          subtitle="Choose exactly 11 players for opponent playing XI."
          selectedCount={opponentSelectedXIIds.length}
          availablePool={opponentAvailablePool}
          selectedPlayers={opponentSelectedXIPlayers}
          teamKey="opponent"
          roles={opponentTeamRoles}
          setRole={setOpponentRole}
          movePlayer={moveOpponentPlayerToXI}
          removePlayer={removeOpponentPlayerFromXI}
          autoPick={autoPickOpponentXI}
          openCustomModal={openCustomModal}
          primaryActionText="Start Match"
          primaryAction={startMatchWithSelectedXI}
          primaryDisabled={!opponentXIReady || !opponentRolesReady}
          stageCommonProps={stageCommonProps}
          setupBackSlot={setupBackSlot}
          onDropToAvailable={onDropToAvailable}
          onDropToSelected={onDropToSelected}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )}

      {customPlayerModal.open ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true">
          <div className="sim-confirm-modal sim-custom-player-modal">
            <h4>Create Custom Player</h4>
            <div className="sim-custom-form-grid">
              <label>
                Name
                <input value={customPlayerModal.name} onChange={(event) => updateCustomField('name', event.target.value)} />
              </label>
              <label>
                Ability vs Pace
                <input type="number" min="0" max="99" value={customPlayerModal.abilityToPlayPaceBall} onChange={(event) => updateCustomField('abilityToPlayPaceBall', event.target.value)} />
              </label>
              <label>
                Ability vs Spin
                <input type="number" min="0" max="99" value={customPlayerModal.abilityToPlaySpinBall} onChange={(event) => updateCustomField('abilityToPlaySpinBall', event.target.value)} />
              </label>
              <label>
                Batting Aggression
                <input type="number" min="0" max="99" value={customPlayerModal.battingAggresion} onChange={(event) => updateCustomField('battingAggresion', event.target.value)} />
              </label>
              <label>
                Spin Ability
                <input type="number" min="0" max="99" value={customPlayerModal.spinAbility} onChange={(event) => updateCustomField('spinAbility', event.target.value)} />
              </label>
              <label>
                Pace Ability
                <input type="number" min="0" max="99" value={customPlayerModal.paceAbility} onChange={(event) => updateCustomField('paceAbility', event.target.value)} />
              </label>
              <label className="sim-custom-checkbox">
                <input type="checkbox" checked={customPlayerModal.isWicketKeeper} onChange={(event) => updateCustomField('isWicketKeeper', event.target.checked)} />
                Is Wicketkeeper
              </label>
            </div>

            <div className="sim-save-row-actions">
              <AppButton text="Cancel" variant="secondary" fullWidth={false} onClick={closeCustomModal} />
              <AppButton text="Create" fullWidth={false} onClick={submitCustomPlayer} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default PreMatchSelectionStages;
