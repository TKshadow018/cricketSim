import React from 'react';
import { motion } from 'framer-motion';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import { matchTypeList } from '../../../gameData/matchTypeList';
import StageShell from './StageShell';
import SelectionGrid from './SelectionGrid';
import FlagTeamGrid from './FlagTeamGrid';
import TossStage from './TossStage';
import { TossResultCard } from './ResultCards';

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
  handleTossCall,
  handleUserTossDecision,
  isUserWinner,
}) {
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
            items={venueStadiums.slice(0, 18)}
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
    </>
  );
}

export default PreMatchStages;
