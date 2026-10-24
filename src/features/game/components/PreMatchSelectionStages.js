import React from 'react';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import PlayerNameWithType from './PlayerNameWithType';
import { countBowlingRolePlayers } from '../../../gameData/playerTypes';

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
      aria-pressed={active}
      onDragStart={
        dragContext
          ? (event) => onDragStart(event, dragContext.teamKey, dragContext.sourceList, player.id)
          : undefined
      }
      onDragEnd={onDragEnd}
      onClick={onClick}
      disabled={disabled}
    >
      <strong><PlayerNameWithType player={player} /></strong>
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
  battingOrderIds,
  availablePool,
  selectedPlayers,
  teamKey,
  roles,
  setRole,
  movePlayer,
  removePlayer,
  autoPick,
  autoPosition,
  autoPositionError,
  openCustomModal,
  primaryActionText,
  primaryAction,
  primaryDisabled,
  xiReady,
  requireBowlingQuota,
  stageCommonProps,
  setupBackSlot,
  onDropToAvailable,
  onDropToSelected,
  onDragStart,
  onDragEnd,
}) {
  const bowlingRoleCount = countBowlingRolePlayers(selectedPlayers);
  const missingRequirements = [];
  if (selectedCount !== 11 || !xiReady) {
    missingRequirements.push(`Select exactly 11 players (${selectedCount}/11 selected).`);
  } else {
    if (!roles?.captainId) {
      missingRequirements.push('Choose a captain.');
    }
    if (!roles?.viceCaptainId || roles.viceCaptainId === roles.captainId) {
      missingRequirements.push('Choose a different vice captain.');
    }
    if (
      !roles?.wicketKeeperId ||
      !selectedPlayers.some(
        (player) => player.id === roles.wicketKeeperId && player.isWicketKeeper
      )
    ) {
      missingRequirements.push(
        selectedPlayers.some((player) => player.isWicketKeeper)
          ? 'Choose a wicketkeeper.'
          : 'Select a wicketkeeper for the XI.'
      );
    }
  }
  if (requireBowlingQuota && bowlingRoleCount < 5) {
    missingRequirements.push(
      `Select at least 5 bowling-role players (${bowlingRoleCount}/5 selected).`
    );
  }

  return (
    <StageShell {...stageCommonProps} title={title} subtitle={subtitle} rightSlot={setupBackSlot} dark>
      <p className="sim-section-title" role="status" aria-live="polite">
        Selected: {selectedCount} / 11 · {selectedCount === 11 ? 'XI complete' : `${11 - selectedCount} more to select`}
      </p>
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
                hint="Select to add to XI"
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
                hint={`Select to remove${battingOrderIds?.includes(player.id) ? ` · Batting position ${battingOrderIds.indexOf(player.id) + 1}` : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="sim-xi-role-grid">
        <div className="sim-role-picker">
          <span>Captain</span>
          <div className="sim-role-option-list">
            {selectedPlayers.map((player) => {
              const isSelected = roles?.captainId === player.id;
              const disabled = roles?.viceCaptainId === player.id;
              return (
                <button
                  key={`cap-${teamKey}-${player.id}`}
                  type="button"
                  className={`sim-role-option-btn ${isSelected ? 'active' : ''} ${disabled ? 'disabled' : ''}`.trim()}
                  onClick={() => setRole('captainId', player.id)}
                  disabled={disabled}
                >
                  <PlayerNameWithType player={player} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="sim-role-picker">
          <span>Vice Captain</span>
          <div className="sim-role-option-list">
            {selectedPlayers.map((player) => {
              const isSelected = roles?.viceCaptainId === player.id;
              const disabled = roles?.captainId === player.id;
              return (
                <button
                  key={`vcap-${teamKey}-${player.id}`}
                  type="button"
                  className={`sim-role-option-btn ${isSelected ? 'active' : ''} ${disabled ? 'disabled' : ''}`.trim()}
                  onClick={() => setRole('viceCaptainId', player.id)}
                  disabled={disabled}
                >
                  <PlayerNameWithType player={player} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="sim-role-picker">
          <span>Wicketkeeper</span>
          <div className="sim-role-option-list">
            {selectedPlayers
              .filter((player) => player.isWicketKeeper)
              .map((player) => {
                const isSelected = roles?.wicketKeeperId === player.id;
                return (
                  <button
                    key={`wk-${teamKey}-${player.id}`}
                    type="button"
                    className={`sim-role-option-btn ${isSelected ? 'active' : ''}`.trim()}
                    onClick={() => setRole('wicketKeeperId', player.id)}
                  >
                    <PlayerNameWithType player={player} />
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <div className="sim-save-row-actions">
        <AppButton text="Auto Pick 11" variant="secondary" fullWidth={false} onClick={autoPick} />
        <AppButton text="Create Custom Player" variant="secondary" fullWidth={false} onClick={() => openCustomModal(teamKey)} />
        <AppButton
          text="Auto Select Batting Order"
          variant="secondary"
          fullWidth={false}
          onClick={autoPosition}
          disabled={selectedCount !== 11}
        />
        <div className="sim-primary-action-group">
          <AppButton text={primaryActionText} fullWidth={false} onClick={primaryAction} disabled={primaryDisabled} />
          {primaryDisabled && missingRequirements.length > 0 ? (
            <p className="sim-disabled-action-reason" role="status" aria-live="polite">
              {missingRequirements.join(' ')}
            </p>
          ) : null}
        </div>
      </div>
      {autoPositionError ? <p role="alert" className="sim-inline-error">{autoPositionError}</p> : null}
    </StageShell>
  );
}

function PreMatchSelectionStages(props) {
  const {
    stage,
    requireBowlingQuota,
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
    ownBattingOrderIds,
    opponentBattingOrderIds,
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
    autoPositionOwnXI,
    autoPositionOpponentXI,
    autoPositionError,
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
          battingOrderIds={ownBattingOrderIds}
          availablePool={ownAvailablePool}
          selectedPlayers={ownSelectedXIPlayers}
          teamKey="own"
          roles={ownTeamRoles}
          setRole={setOwnRole}
          movePlayer={moveOwnPlayerToXI}
          removePlayer={removeOwnPlayerFromXI}
          autoPick={autoPickOwnXI}
          autoPosition={autoPositionOwnXI}
          autoPositionError={autoPositionError}
          openCustomModal={openCustomModal}
          primaryActionText="Continue"
          primaryAction={goToNextStage}
          primaryDisabled={
            !ownXIReady ||
            !ownRolesReady ||
            (requireBowlingQuota && countBowlingRolePlayers(ownSelectedXIPlayers) < 5)
          }
          xiReady={ownXIReady}
          requireBowlingQuota={requireBowlingQuota}
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
          battingOrderIds={opponentBattingOrderIds}
          availablePool={opponentAvailablePool}
          selectedPlayers={opponentSelectedXIPlayers}
          teamKey="opponent"
          roles={opponentTeamRoles}
          setRole={setOpponentRole}
          movePlayer={moveOpponentPlayerToXI}
          removePlayer={removeOpponentPlayerFromXI}
          autoPick={autoPickOpponentXI}
          autoPosition={autoPositionOpponentXI}
          autoPositionError={autoPositionError}
          openCustomModal={openCustomModal}
          primaryActionText="Start Match"
          primaryAction={startMatchWithSelectedXI}
          primaryDisabled={
            !opponentXIReady ||
            !opponentRolesReady ||
            (requireBowlingQuota && countBowlingRolePlayers(opponentSelectedXIPlayers) < 5)
          }
          xiReady={opponentXIReady}
          requireBowlingQuota={requireBowlingQuota}
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
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={closeCustomModal}
            >
              ×
            </button>
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
