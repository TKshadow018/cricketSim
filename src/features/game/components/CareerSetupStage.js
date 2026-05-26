import React from 'react';
import { matchTypeList } from '../../../gameData/matchTypeList';
import StageShell from './StageShell';
import FlagTeamGrid from './FlagTeamGrid';
import AppButton from '../../../components/ui/AppButton';
import { CAREER_SEASON_LENGTHS } from '../utils/controllerCareerScheduleUtils';

const SEASON_LENGTH_OPTIONS = [
  { key: 'short', label: 'Short', matches: CAREER_SEASON_LENGTHS.short, description: `${CAREER_SEASON_LENGTHS.short} matches` },
  { key: 'standard', label: 'Standard', matches: CAREER_SEASON_LENGTHS.standard, description: `${CAREER_SEASON_LENGTHS.standard} matches` },
  { key: 'full', label: 'Full', matches: CAREER_SEASON_LENGTHS.full, description: `${CAREER_SEASON_LENGTHS.full} matches` },
];

function CareerSetupStage({ stageCommonProps, countryList, game, beginCareer }) {
  const [selectedTeam, setSelectedTeam] = React.useState(game.careerTeam || '');
  const [selectedFormat, setSelectedFormat] = React.useState(game.careerFormat || 't20');
  const [selectedSeasonLength, setSelectedSeasonLength] = React.useState(game.careerSeasonLength || 'standard');

  const canStart = !!selectedTeam;

  return (
    <StageShell {...stageCommonProps} title="Career Mode Setup" subtitle="Choose your team, format, and season length to begin your career.">
      <h4 className="sim-section-title">Select Your Team</h4>
      <FlagTeamGrid
        teams={countryList}
        selectedName={selectedTeam}
        onSelect={(team) => setSelectedTeam(team.name)}
      />

      <h4 className="sim-section-title">Match Format</h4>
      <div className="sim-series-mode-grid">
        {Object.entries(matchTypeList).map(([key, value]) => (
          <button
            key={key}
            type="button"
            className={`sim-series-mode-card ${selectedFormat === key ? 'active' : ''}`}
            onClick={() => setSelectedFormat(key)}
          >
            <h4>{value.nameKey.toUpperCase()}</h4>
            <p>{value.over} overs</p>
          </button>
        ))}
      </div>

      <h4 className="sim-section-title">Season Length</h4>
      <div className="sim-series-length-grid">
        {SEASON_LENGTH_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`sim-series-length-card ${selectedSeasonLength === option.key ? 'active' : ''}`}
            onClick={() => setSelectedSeasonLength(option.key)}
          >
            <span className="sim-series-length-number">{option.label}</span>
            <small>{option.description}</small>
          </button>
        ))}
      </div>

      <AppButton
        text="Begin Career"
        onClick={() => beginCareer({ team: selectedTeam, format: selectedFormat, seasonLength: selectedSeasonLength })}
        disabled={!canStart}
        fullWidth
      />
    </StageShell>
  );
}

export default CareerSetupStage;
