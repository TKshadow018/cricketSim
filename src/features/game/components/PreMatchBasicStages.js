import React from 'react';
import { motion } from 'framer-motion';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import { matchTypeList } from '../../../gameData/matchTypeList';
import StageShell from './StageShell';
import SelectionGrid from './SelectionGrid';
import FlagTeamGrid from './FlagTeamGrid';
import TossStage from './TossStage';
import { TossResultCard } from './ResultCards';
import AppButton from '../../../components/ui/AppButton';
import {
  PITCH_ICON_PATH,
  OUTFIELD_ICON_PATH,
  formatConditionLabel,
  setCommentatorName,
  buildSaveSummary,
} from './preMatchStageUtils';
import CareerSetupStage from './CareerSetupStage';
import CareerSeasonScheduleStage from './CareerSeasonScheduleStage';

function PreMatchBasicStages(props) {
  const {
    stage,
    stageCommonProps,
    game,
    setupBackSlot,
    countryList,
    stadiumSelectionItems,
    availableVoices,
    matchVisual,
    goToNextStage,
    selectGameMode,
    selectSeriesLength,
    tournamentUserTeam,
    tournamentOpponentTeams,
    toggleTournamentOpponent,
    prepareTournamentFixtures,
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
    saveToDelete,
    setSaveToDelete,
    handleTossCall,
    handleUserTossDecision,
    commentatorDisplayName,
    isUserWinner,
    beginCareer,
    careerTeam,
    careerSeason,
    careerMatchIndex,
    careerSchedule,
    careerStandings,
    careerPlayerProfile,
    careerDomesticCountry,
    careerDomesticTeams,
    careerOffers,
    careerRetired,
    handleCareerStartNextMatch,
    handleViewCareerHistory,
  } = props;

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
                      <small>{buildSaveSummary(save, matchStatusEnum)}</small>
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

      {stage === matchStatusEnum.ChooseGameMode && (
        <StageShell {...stageCommonProps} title="Choose Game Mode" subtitle="Pick how you want to play.">
          <div className="sim-series-mode-grid">
            <button type="button" className={`sim-series-mode-card ${game.gameMode === 'quick' ? 'active' : ''}`} onClick={() => selectGameMode('quick')}>
              <h4>Quick Match</h4>
              <p>Single match experience.</p>
            </button>
            <button type="button" className={`sim-series-mode-card ${game.gameMode === 'series' ? 'active' : ''}`} onClick={() => selectGameMode('series')}>
              <h4>Play Series</h4>
              <p>Multiple matches vs same opponent.</p>
            </button>
            <button type="button" className={`sim-series-mode-card ${game.gameMode === 'tournament' ? 'active' : ''}`} onClick={() => selectGameMode('tournament')}>
              <h4>Tournament</h4>
              <p>4 / 8 / 16 team knockout.</p>
            </button>
            <button type="button" className={`sim-series-mode-card ${game.gameMode === 'career' ? 'active' : ''}`} onClick={() => selectGameMode('career')}>
              <h4>Career</h4>
              <p>Manage a national team across seasons.</p>
            </button>
          </div>
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseSeriesLength && (
        <StageShell
          {...stageCommonProps}
          title="Series Length"
          subtitle="How many matches in this series?"
          rightSlot={setupBackSlot}
        >
          <div className="sim-series-length-grid">
            {[2, 3, 4, 5, 6, 7].map((value) => (
              <button
                key={`series-${value}`}
                type="button"
                className={`sim-series-length-card ${game.seriesLength === value ? 'active' : ''}`}
                onClick={() => selectSeriesLength(value)}
              >
                <span className="sim-series-length-number">{value}</span>
                <small>Matches</small>
              </button>
            ))}
          </div>
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseOwnTeam && (
        <StageShell {...stageCommonProps} title="Choose Your Team" subtitle="Pick your national side." rightSlot={setupBackSlot} dark>
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
        <StageShell {...stageCommonProps} title="Choose Opponent" subtitle="Set the rival team for this showdown." rightSlot={setupBackSlot} dark>
          {game.gameMode === 'tournament' ? (
            <>
              <p className="sim-section-title">
                Select opponents: {tournamentOpponentTeams.length} (allowed totals: 3, 7, 15)
              </p>
              <div className="sim-flag-grid">
                {countryList
                  .filter((team) => team.name !== tournamentUserTeam)
                  .map((team) => {
                    const active = tournamentOpponentTeams.includes(team.name);
                    return (
                      <button
                        key={`tour-opp-${team.id}`}
                        type="button"
                        className={`sim-flag-card ${active ? 'active' : ''}`}
                        onClick={() => toggleTournamentOpponent(team.name)}
                      >
                        <div className="sim-flag-holder">
                          <img src={team.image.replace('./', '/')} alt={team.name} />
                        </div>
                        <h4>{team.name}</h4>
                        <p>Rank #{team.current_ranking}</p>
                      </button>
                    );
                  })}
              </div>
              <div className="sim-save-row-actions">
                <AppButton
                  text="Continue to Fixtures"
                  fullWidth={false}
                  onClick={prepareTournamentFixtures}
                  disabled={![3, 7, 15].includes(tournamentOpponentTeams.length)}
                />
              </div>
            </>
          ) : (
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
          )}
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseMatchLocation && (
        <StageShell {...stageCommonProps} title="Choose Match Country" subtitle="Decide where the match will be hosted." rightSlot={setupBackSlot} dark>
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
        <StageShell {...stageCommonProps} title="Choose Stadium" subtitle="Pick the exact ground and conditions." rightSlot={setupBackSlot}>
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
            renderMeta={(item) => (
              <div className="sim-stadium-meta-row">
                <span className="sim-stadium-meta-chip">
                  <img src={PITCH_ICON_PATH} alt="pitch" />
                  <span>{formatConditionLabel(item.pitchType)}</span>
                </span>
                <span className="sim-stadium-meta-chip">
                  <img src={OUTFIELD_ICON_PATH} alt="outfield" />
                  <span>{formatConditionLabel(item.outfieldType)}</span>
                </span>
              </div>
            )}
            renderDescription={(item) => `${item.location} • Capacity ${item.capacity?.toLocaleString?.() || 'N/A'}`}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.ChooseCommentator && (
        <StageShell {...stageCommonProps} title="Choose Commentator" subtitle="Select commentary voice from real player names." rightSlot={setupBackSlot}>
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
                speak(`Commentary voice set to ${setCommentatorName(voice)}`);
                goToNextStage();
              }}
              keyOf={(voice) => `${voice.name}-${voice.lang}`}
              renderTitle={(voice) => setCommentatorName(voice)}
              renderMeta={(voice) => voice.lang}
              renderDescription={(voice) => (
                <div className="sim-commentator-row">
                  <small>Speech synthesis commentator</small>
                  <button
                    type="button"
                    className="sim-commentator-test-btn"
                    title="Test sound"
                    aria-label={`Test sound for ${setCommentatorName(voice)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setPreferredVoice(voice.name);
                      speak(`Hi I am ${setCommentatorName(voice)}`);
                    }}
                  >
                    🔊
                  </button>
                </div>
              )}
            />
          ) : (
            <div className="sim-empty-message">
              Voice list is still loading from your browser. Keep this page open for a moment.
            </div>
          )}
        </StageShell>
      )}

      {stage === matchStatusEnum.TossTime && (
        <StageShell {...stageCommonProps} title="Toss Time" subtitle="Flip and decide bat or bowl." rightSlot={setupBackSlot} dark>
          <TossStage
            matchCondition={game.matchCondition}
            selectedCall={game.tossCall}
            onChooseCall={handleTossCall}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.TossResult && (
        <StageShell {...stageCommonProps} title="Toss Result" subtitle="The teams lock strategy before first ball." rightSlot={setupBackSlot} dark>
          <TossResultCard
            winner={game.tossWinner}
            decision={game.tossDecision}
            commentator={commentatorDisplayName}
            isUserWinner={isUserWinner}
            onUserDecision={handleUserTossDecision}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.CareerSetup && (
        <CareerSetupStage
          stageCommonProps={stageCommonProps}
          countryList={countryList}
          game={game}
          beginCareer={beginCareer}
        careerPlayerProfile={careerPlayerProfile}
        careerDomesticCountry={careerDomesticCountry}
        careerDomesticTeams={careerDomesticTeams}
        careerOffers={careerOffers}
        />
      )}

      {stage === matchStatusEnum.CareerSeasonSchedule && (
        <CareerSeasonScheduleStage
          stageCommonProps={stageCommonProps}
          careerTeam={careerTeam}
          careerSeason={careerSeason}
          careerMatchIndex={careerMatchIndex}
          careerSchedule={careerSchedule}
          careerStandings={careerStandings}
          careerPlayerProfile={careerPlayerProfile}
          careerRetired={careerRetired}
          handleCareerStartNextMatch={handleCareerStartNextMatch}
          handleViewCareerHistory={handleViewCareerHistory}
        />
      )}
    </>
  );
}

export default PreMatchBasicStages;
