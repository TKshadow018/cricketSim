import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import { matchTypeList } from '../../../gameData/matchTypeList';
import StageShell from './StageShell';
import SelectionGrid from './SelectionGrid';
import FlagTeamGrid from './FlagTeamGrid';
import TossStage from './TossStage';
import { TossResultCard } from './ResultCards';
import AppButton from '../../../components/ui/AppButton';

const STADIUM_ICON_POOL = [
  '/asset/img/icon/stadium/stadium1.png',
  '/asset/img/icon/stadium/stadium2.png',
  '/asset/img/icon/stadium/stadium3.png',
  '/asset/img/icon/stadium/stadium4.png',
  '/asset/img/icon/stadium/stadium5.png',
];

function PreMatchStages({
  stage,
  stageCommonProps,
  game,
  countryList,
  venueStadiums,
  availableVoices,
  matchVisual,
  goToNextStage,
  setMatchTypeKey,
  setOwnTeam,
  setOpponentTeam,
  setLocationCountry,
  setSelectedStadium,
  setCommentator,
  setPreferredVoice,
  speak,
  savedGames,
  isSavesLoading,
  saveMessage,
  onLoadSavedGame,
  onDeleteSavedGame,
  handleTossCall,
  handleUserTossDecision,
  isUserWinner,
  ownAvailablePool,
  opponentAvailablePool,
  ownSelectedXIIds,
  opponentSelectedXIIds,
  ownSelectedXIPlayers,
  opponentSelectedXIPlayers,
  ownTeamRoles,
  opponentTeamRoles,
  ownXIReady,
  opponentXIReady,
  ownRolesReady,
  opponentRolesReady,
  moveOwnPlayerToXI,
  removeOwnPlayerFromXI,
  moveOpponentPlayerToXI,
  removeOpponentPlayerFromXI,
  setOwnRole,
  setOpponentRole,
  createCustomPlayer,
  autoPickOwnXI,
  autoPickOpponentXI,
  startMatchWithSelectedXI,
}) {
  const [saveToDelete, setSaveToDelete] = useState(null);
  const [dragPayload, setDragPayload] = useState(null);
  const [customPlayerModal, setCustomPlayerModal] = useState({
    open: false,
    teamKey: 'own',
    name: '',
    abilityToPlayPaceBall: 60,
    abilityToPlaySpinBall: 60,
    battingAggresion: 60,
    spinAbility: 20,
    paceAbility: 20,
    isWicketKeeper: false,
  });

  const stadiumSelectionItems = useMemo(
    () =>
      venueStadiums.slice(0, 18).map((item) => {
        const randomIndex = Math.floor(Math.random() * STADIUM_ICON_POOL.length);
        const iconPath = STADIUM_ICON_POOL[randomIndex] || STADIUM_ICON_POOL[0];

        return {
          ...item,
          visualClassName: 'sim-choice-visual-stadium',
          renderVisual: () => <img src={iconPath} alt="stadium" className="sim-stadium-choice-image" />,
        };
      }),
    [venueStadiums]
  );

  const onDragStart = (teamKey, sourceList, playerId) => {
    setDragPayload({ teamKey, sourceList, playerId });
  };

  const onDropToAvailable = (teamKey) => {
    if (!dragPayload || dragPayload.teamKey !== teamKey || dragPayload.sourceList !== 'selected') {
      return;
    }

    if (teamKey === 'own') {
      removeOwnPlayerFromXI(dragPayload.playerId);
    } else {
      removeOpponentPlayerFromXI(dragPayload.playerId);
    }
    setDragPayload(null);
  };

  const onDropToSelected = (teamKey) => {
    if (!dragPayload || dragPayload.teamKey !== teamKey || dragPayload.sourceList !== 'available') {
      return;
    }

    if (teamKey === 'own') {
      moveOwnPlayerToXI(dragPayload.playerId);
    } else {
      moveOpponentPlayerToXI(dragPayload.playerId);
    }
    setDragPayload(null);
  };

  const openCustomModal = (teamKey) => {
    setCustomPlayerModal({
      open: true,
      teamKey,
      name: '',
      abilityToPlayPaceBall: 60,
      abilityToPlaySpinBall: 60,
      battingAggresion: 60,
      spinAbility: 20,
      paceAbility: 20,
      isWicketKeeper: false,
    });
  };

  const closeCustomModal = () => {
    setCustomPlayerModal((previous) => ({ ...previous, open: false }));
  };

  const updateCustomField = (key, value) => {
    setCustomPlayerModal((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submitCustomPlayer = () => {
    const normalizedName = customPlayerModal.name.trim();
    if (!normalizedName) {
      return;
    }

    const clamp = (value) => Math.max(0, Math.min(99, Number(value) || 0));
    createCustomPlayer(customPlayerModal.teamKey, {
      name: normalizedName,
      abilityToPlayPaceBall: clamp(customPlayerModal.abilityToPlayPaceBall),
      abilityToPlaySpinBall: clamp(customPlayerModal.abilityToPlaySpinBall),
      battingAggresion: clamp(customPlayerModal.battingAggresion),
      spinAbility: clamp(customPlayerModal.spinAbility),
      paceAbility: clamp(customPlayerModal.paceAbility),
      isWicketKeeper: !!customPlayerModal.isWicketKeeper,
    });

    closeCustomModal();
  };

  const renderPlayerCard = ({
    player,
    key,
    draggable = false,
    active = false,
    disabled = false,
    dragContext,
    onClick,
    hint,
  }) => (
    <button
      key={key}
      type="button"
      draggable={draggable}
      className={`sim-player-pick-btn ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`.trim()}
      onDragStart={
        dragContext ? () => onDragStart(dragContext.teamKey, dragContext.sourceList, player.id) : undefined
      }
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

  const buildSaveSummary = (save) => {
    const gameState = save?.gameState || {};
    const stage = gameState.stage;
    const first = gameState.firstInnings || {};
    const second = gameState.secondInnings || {};
    const overs = (balls) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

    if (stage === matchStatusEnum.TeamOneBat) {
      return `${gameState.firstBattingSide === 'own' ? gameState.ownTeam : gameState.opponentTeam}: ${
        first.score || 0
      }/${first.wickets || 0} (${overs(first.balls)})`;
    }

    if (stage === matchStatusEnum.TeamTwoBat || stage === matchStatusEnum.MatchEnd) {
      const secondBattingTeam = gameState.firstBattingSide === 'own' ? gameState.opponentTeam : gameState.ownTeam;
      return `${secondBattingTeam}: ${second.score || 0}/${second.wickets || 0} (${overs(second.balls)})`;
    }

    return `Stage ${stage ?? '-'} setup in progress`;
  };

  return (
    <>
      {stage === matchStatusEnum.intro && (
        <StageShell
          {...stageCommonProps}
          title="Cricket Simulation Arena"
          subtitle="Set up your battle, play ball by ball, and experience dynamic commentary."
          rightSlot={<motion.div className="sim-pulse-dot" animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />}
        >
          <div className="sim-intro-grid clickable" onClick={goToNextStage}>
            <p>Use match setup stages, then control batting and bowling actions during innings.</p>
            <p className="sim-click-hint">Tap this panel to start setup</p>
          </div>

          {isSavesLoading ? <p className="sim-section-title">Loading saved games...</p> : null}

          {!isSavesLoading && savedGames?.length ? (
            <div className="sim-scoreboard-panel">
              <h4>Saved Games</h4>
              {savedGames.map((save) => {
                const updatedAt = save?.updatedAt?.toDate ? save.updatedAt.toDate() : null;
                const updatedText = updatedAt ? updatedAt.toLocaleString() : 'Recently updated';

                return (
                  <div key={save.id} className="sim-saved-item sim-player-pick-btn">
                    <div className="sim-saved-item-content">
                      <strong>{save.title || 'Saved Match'}</strong>
                      <small>{updatedText}</small>
                      <small>{buildSaveSummary(save)}</small>
                      <div className="sim-save-row-actions">
                        <AppButton
                          text="Load Saved"
                          onClick={() => onLoadSavedGame(save)}
                          variant="secondary"
                          fullWidth={false}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sim-delete-cross-btn"
                      onClick={() => setSaveToDelete(save)}
                      title="Delete save"
                      aria-label="Delete save"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {saveMessage ? <p className="sim-section-title">{saveMessage}</p> : null}

          {saveToDelete ? (
            <div className="sim-confirm-overlay" role="dialog" aria-modal="true">
              <div className="sim-confirm-modal">
                <h4>Delete saved game?</h4>
                <p>Are you sure you want to delete this save? This cannot be undone.</p>
                <div className="sim-save-row-actions">
                  <AppButton
                    text="Cancel"
                    variant="secondary"
                    fullWidth={false}
                    onClick={() => setSaveToDelete(null)}
                  />
                  <AppButton
                    text="Delete"
                    variant="secondary"
                    fullWidth={false}
                    onClick={async () => {
                      await onDeleteSavedGame(saveToDelete.id);
                      setSaveToDelete(null);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseMatchType && (
        <StageShell {...stageCommonProps} title="Choose Match Type" subtitle="Select format, overs, innings and duration profile.">
          <SelectionGrid
            items={Object.entries(matchTypeList).map(([key, value]) => ({
              key,
              ...value,
              badge: ['t10', 't20', 'ODI'].includes(key) ? 'Popular' : '',
              renderVisual: () => <span>{matchVisual[key] || '🏏'}</span>,
            }))}
            selectedKey={game.matchTypeKey}
            onSelect={(item) => {
              setMatchTypeKey(item.key);
              speak(`${item.nameKey} selected.`);
              goToNextStage();
            }}
            keyOf={(item) => item.key}
            renderTitle={(item) => item.nameKey.toUpperCase()}
            renderMeta={(item) => `${item.over} overs • ${item.innings} innings`}
            renderDescription={(item) => `${item.day} day format`}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseOwnTeam && (
        <StageShell {...stageCommonProps} title="Choose Your Team" subtitle="Pick your national side." dark>
          <FlagTeamGrid
            teams={countryList}
            selectedName={game.ownTeam}
            onSelect={(team) => {
              setOwnTeam(team.name);
              speak(`Your team is ${team.name}.`);
              goToNextStage();
            }}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseOpponent && (
        <StageShell {...stageCommonProps} title="Choose Opponent" subtitle="Set the rival team for this showdown." dark>
          <FlagTeamGrid
            teams={countryList}
            selectedName={game.opponentTeam}
            disabledName={game.ownTeam}
            onSelect={(team) => {
              setOpponentTeam(team.name);
              speak(`Opponent team is ${team.name}.`);
              goToNextStage();
            }}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseMatchLocation && (
        <StageShell {...stageCommonProps} title="Choose Match Country" subtitle="Decide where the match will be hosted." dark>
          <FlagTeamGrid
            teams={countryList}
            selectedName={game.locationCountry}
            onSelect={(team) => {
              setLocationCountry(team.name);
              setSelectedStadium('');
              speak(`Match location set to ${team.name}.`);
              goToNextStage();
            }}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseStadium && (
        <StageShell {...stageCommonProps} title="Choose Stadium" subtitle="Pick the exact ground and conditions.">
          <SelectionGrid
            items={stadiumSelectionItems}
            selectedKey={game.selectedStadium}
            onSelect={(item) => {
              setSelectedStadium(item.name);
              speak(`Stadium selected: ${item.name}.`);
              goToNextStage();
            }}
            keyOf={(item) => item.name}
            renderTitle={(item) => item.name}
            renderMeta={(item) => `${item.location} • ${item.pitchType}`}
            renderDescription={(item) => `Capacity ${item.capacity?.toLocaleString?.() || 'N/A'}`}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseCommentator && (
        <StageShell {...stageCommonProps} title="Choose Commentator" subtitle="Select commentary voice from real player names.">
          {availableVoices.length ? (
            <SelectionGrid
              items={availableVoices.map((voice) => ({
                ...voice,
                renderVisual: () => <span>🎙️</span>,
                badge: voice.default ? 'Default' : '',
              }))}
              selectedKey={game.commentator}
              onSelect={(voice) => {
                setCommentator(voice.name);
                setPreferredVoice(voice.name);
                speak(`Commentary voice set to ${voice.name}`);
                goToNextStage();
              }}
              keyOf={(voice) => `${voice.name}-${voice.lang}`}
              renderTitle={(voice) => voice.name}
              renderMeta={(voice) => voice.lang}
              renderDescription={() => 'Speech synthesis commentator'}
            />
          ) : (
            <div className="sim-empty-message">
              Voice list is still loading from your browser. Keep this page open for a moment.
            </div>
          )}
        </StageShell>
      )}

      {stage === matchStatusEnum.TossTime && (
        <StageShell {...stageCommonProps} title="Toss Time" subtitle="Flip and decide bat or bowl." dark>
          <TossStage
            matchCondition={game.matchCondition}
            selectedCall={game.tossCall}
            onChooseCall={handleTossCall}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.TossResult && (
        <StageShell {...stageCommonProps} title="Toss Result" subtitle="The teams lock strategy before first ball." dark>
          <TossResultCard
            winner={game.tossWinner}
            decision={game.tossDecision}
            commentator={game.commentator}
            isUserWinner={isUserWinner}
            onUserDecision={handleUserTossDecision}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseOwnPlayingXI && (
        <StageShell {...stageCommonProps} title="Select Your Team" subtitle="Choose exactly 11 players for your playing XI." dark>
          <p className="sim-section-title">Selected: {ownSelectedXIIds.length} / 11</p>
          <div className="sim-xi-dnd-layout">
            <div
              className="sim-xi-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropToAvailable('own')}
            >
              <h4>Available Players</h4>
              <div className="sim-player-pick-grid">
                {ownAvailablePool.map((player) =>
                  renderPlayerCard({
                    player,
                    key: `own-available-${player.id}`,
                    draggable: true,
                    disabled: ownSelectedXIIds.length >= 11,
                    dragContext: { teamKey: 'own', sourceList: 'available' },
                    onClick: () => moveOwnPlayerToXI(player.id),
                    hint: 'Drag to selected XI',
                  })
                )}
              </div>
            </div>

            <div
              className="sim-xi-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropToSelected('own')}
            >
              <h4>Selected XI</h4>
              <div className="sim-player-pick-grid">
                {ownSelectedXIPlayers.map((player) =>
                  renderPlayerCard({
                    player,
                    key: `own-selected-${player.id}`,
                    draggable: true,
                    active: true,
                    dragContext: { teamKey: 'own', sourceList: 'selected' },
                    onClick: () => removeOwnPlayerFromXI(player.id),
                    hint: 'Drag back to remove',
                  })
                )}
              </div>
            </div>
          </div>

          <div className="sim-xi-role-grid">
            <label>
              Captain
              <select
                value={ownTeamRoles?.captainId ?? ''}
                onChange={(event) => setOwnRole('captainId', Number(event.target.value) || null)}
              >
                <option value="">Select captain</option>
                {ownSelectedXIPlayers.map((player) => (
                  <option
                    key={`own-cap-${player.id}`}
                    value={player.id}
                    disabled={ownTeamRoles?.viceCaptainId === player.id}
                  >
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Vice Captain
              <select
                value={ownTeamRoles?.viceCaptainId ?? ''}
                onChange={(event) => setOwnRole('viceCaptainId', Number(event.target.value) || null)}
              >
                <option value="">Select vice captain</option>
                {ownSelectedXIPlayers.map((player) => (
                  <option
                    key={`own-vcap-${player.id}`}
                    value={player.id}
                    disabled={ownTeamRoles?.captainId === player.id}
                  >
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Wicketkeeper
              <select
                value={ownTeamRoles?.wicketKeeperId ?? ''}
                onChange={(event) => setOwnRole('wicketKeeperId', Number(event.target.value) || null)}
              >
                <option value="">Select wicketkeeper</option>
                {ownSelectedXIPlayers
                  .filter((player) => player.isWicketKeeper)
                  .map((player) => (
                  <option key={`own-wk-${player.id}`} value={player.id}>
                    {player.name}
                  </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="sim-save-row-actions">
            <AppButton text="Auto Pick 11" variant="secondary" fullWidth={false} onClick={autoPickOwnXI} />
            <AppButton
              text="Create Custom Player"
              variant="secondary"
              fullWidth={false}
              onClick={() => openCustomModal('own')}
            />
            <AppButton
              text="Continue"
              fullWidth={false}
              onClick={goToNextStage}
              disabled={!ownXIReady || !ownRolesReady}
            />
          </div>
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseOpponentPlayingXI && (
        <StageShell {...stageCommonProps} title="Select Opponent Team" subtitle="Choose exactly 11 players for opponent playing XI." dark>
          <p className="sim-section-title">Selected: {opponentSelectedXIIds.length} / 11</p>
          <div className="sim-xi-dnd-layout">
            <div
              className="sim-xi-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropToAvailable('opponent')}
            >
              <h4>Available Players</h4>
              <div className="sim-player-pick-grid">
                {opponentAvailablePool.map((player) =>
                  renderPlayerCard({
                    player,
                    key: `opp-available-${player.id}`,
                    draggable: true,
                    disabled: opponentSelectedXIIds.length >= 11,
                    dragContext: { teamKey: 'opponent', sourceList: 'available' },
                    onClick: () => moveOpponentPlayerToXI(player.id),
                    hint: 'Drag to selected XI',
                  })
                )}
              </div>
            </div>

            <div
              className="sim-xi-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropToSelected('opponent')}
            >
              <h4>Selected XI</h4>
              <div className="sim-player-pick-grid">
                {opponentSelectedXIPlayers.map((player) =>
                  renderPlayerCard({
                    player,
                    key: `opp-selected-${player.id}`,
                    draggable: true,
                    active: true,
                    dragContext: { teamKey: 'opponent', sourceList: 'selected' },
                    onClick: () => removeOpponentPlayerFromXI(player.id),
                    hint: 'Drag back to remove',
                  })
                )}
              </div>
            </div>
          </div>

          <div className="sim-xi-role-grid">
            <label>
              Captain
              <select
                value={opponentTeamRoles?.captainId ?? ''}
                onChange={(event) => setOpponentRole('captainId', Number(event.target.value) || null)}
              >
                <option value="">Select captain</option>
                {opponentSelectedXIPlayers.map((player) => (
                  <option
                    key={`opp-cap-${player.id}`}
                    value={player.id}
                    disabled={opponentTeamRoles?.viceCaptainId === player.id}
                  >
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Vice Captain
              <select
                value={opponentTeamRoles?.viceCaptainId ?? ''}
                onChange={(event) => setOpponentRole('viceCaptainId', Number(event.target.value) || null)}
              >
                <option value="">Select vice captain</option>
                {opponentSelectedXIPlayers.map((player) => (
                  <option
                    key={`opp-vcap-${player.id}`}
                    value={player.id}
                    disabled={opponentTeamRoles?.captainId === player.id}
                  >
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Wicketkeeper
              <select
                value={opponentTeamRoles?.wicketKeeperId ?? ''}
                onChange={(event) => setOpponentRole('wicketKeeperId', Number(event.target.value) || null)}
              >
                <option value="">Select wicketkeeper</option>
                {opponentSelectedXIPlayers
                  .filter((player) => player.isWicketKeeper)
                  .map((player) => (
                  <option key={`opp-wk-${player.id}`} value={player.id}>
                    {player.name}
                  </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="sim-save-row-actions">
            <AppButton
              text="Auto Pick 11"
              variant="secondary"
              fullWidth={false}
              onClick={autoPickOpponentXI}
            />
            <AppButton
              text="Create Custom Player"
              variant="secondary"
              fullWidth={false}
              onClick={() => openCustomModal('opponent')}
            />
            <AppButton
              text="Start Match"
              fullWidth={false}
              onClick={startMatchWithSelectedXI}
              disabled={!opponentXIReady || !opponentRolesReady}
            />
          </div>
        </StageShell>
      )}

      {customPlayerModal.open ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true">
          <div className="sim-confirm-modal sim-custom-player-modal">
            <h4>Create Custom Player</h4>
            <div className="sim-custom-form-grid">
              <label>
                Name
                <input
                  value={customPlayerModal.name}
                  onChange={(event) => updateCustomField('name', event.target.value)}
                />
              </label>
              <label>
                Ability vs Pace
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={customPlayerModal.abilityToPlayPaceBall}
                  onChange={(event) => updateCustomField('abilityToPlayPaceBall', event.target.value)}
                />
              </label>
              <label>
                Ability vs Spin
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={customPlayerModal.abilityToPlaySpinBall}
                  onChange={(event) => updateCustomField('abilityToPlaySpinBall', event.target.value)}
                />
              </label>
              <label>
                Batting Aggression
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={customPlayerModal.battingAggresion}
                  onChange={(event) => updateCustomField('battingAggresion', event.target.value)}
                />
              </label>
              <label>
                Spin Ability
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={customPlayerModal.spinAbility}
                  onChange={(event) => updateCustomField('spinAbility', event.target.value)}
                />
              </label>
              <label>
                Pace Ability
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={customPlayerModal.paceAbility}
                  onChange={(event) => updateCustomField('paceAbility', event.target.value)}
                />
              </label>
              <label className="sim-custom-checkbox">
                <input
                  type="checkbox"
                  checked={customPlayerModal.isWicketKeeper}
                  onChange={(event) => updateCustomField('isWicketKeeper', event.target.checked)}
                />
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

export default PreMatchStages;
