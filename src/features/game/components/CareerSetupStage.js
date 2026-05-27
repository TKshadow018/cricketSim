import React from 'react';
import StageShell from './StageShell';
import FlagTeamGrid from './FlagTeamGrid';
import AppButton from '../../../components/ui/AppButton';
import {
  CAREER_SEASON_LENGTHS,
  buildCareerOffers,
  createDomesticTeamsForCountry,
} from '../utils/controllerCareerScheduleUtils';

const SEASON_LENGTH_OPTIONS = [
  { key: 'short', label: 'Short', matches: CAREER_SEASON_LENGTHS.short, description: `${CAREER_SEASON_LENGTHS.short} matches` },
  { key: 'standard', label: 'Standard', matches: CAREER_SEASON_LENGTHS.standard, description: `${CAREER_SEASON_LENGTHS.standard} matches` },
  { key: 'full', label: 'Full', matches: CAREER_SEASON_LENGTHS.full, description: `${CAREER_SEASON_LENGTHS.full} matches` },
];

function CareerSetupStage({
  stageCommonProps,
  countryList,
  game,
  beginCareer,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerOffers,
}) {
  const [playerName, setPlayerName] = React.useState(careerPlayerProfile?.name || '');
  const [playerAge, setPlayerAge] = React.useState(careerPlayerProfile?.age || 18);
  const [playerNationality, setPlayerNationality] = React.useState(careerPlayerProfile?.nationality || '');
  const [selectedCountry, setSelectedCountry] = React.useState(careerDomesticCountry || '');
  const [domesticTeams, setDomesticTeams] = React.useState(careerDomesticTeams || []);
  const [offers, setOffers] = React.useState(careerOffers || []);
  const [selectedTeam, setSelectedTeam] = React.useState(game.careerTeam || '');
  const [selectedSeasonLength, setSelectedSeasonLength] = React.useState(game.careerSeasonLength || 'standard');
  const canGenerateOffers = !!selectedCountry && (playerNationality || '').trim();
  const canStart =
    !!selectedTeam && (playerName || '').trim() && Number(playerAge) >= 16 && Number(playerAge) <= 40 && !!playerNationality;

  const generateDomesticLeagueAndOffers = (countryName) => {
    const createdTeams = createDomesticTeamsForCountry(countryName);
    const createdOffers = buildCareerOffers(createdTeams, 3);
    setDomesticTeams(createdTeams);
    setOffers(createdOffers);
    setSelectedTeam(createdOffers[0] || '');
  };

  return (
    <StageShell {...stageCommonProps} title="Career Mode Setup" subtitle="Create your player and begin a full player career journey.">
      <h4 className="sim-section-title">Create Your Player</h4>
      <div className="sim-scoreboard-panel">
        <label htmlFor="career-player-name">Player Name</label>
        <input
          id="career-player-name"
          className="sim-field"
          type="text"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder="Enter player name"
        />
        <label htmlFor="career-player-age">Age</label>
        <input
          id="career-player-age"
          className="sim-field"
          type="number"
          min={16}
          max={40}
          value={playerAge}
          onChange={(event) => setPlayerAge(event.target.value)}
        />
        <label htmlFor="career-player-nationality">Nationality</label>
        <select
          id="career-player-nationality"
          className="sim-field"
          value={playerNationality}
          onChange={(event) => setPlayerNationality(event.target.value)}
        >
          <option value="">Select nationality</option>
          {countryList.map((country) => (
            <option key={`nat-${country.id}`} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <h4 className="sim-section-title">Select Domestic League Country</h4>
      <FlagTeamGrid
        teams={countryList}
        selectedName={selectedCountry}
        onSelect={(team) => {
          setSelectedCountry(team.name);
          setDomesticTeams([]);
          setOffers([]);
          setSelectedTeam('');
        }}
      />

      <div style={{ marginTop: '10px' }}>
        <AppButton
          text="Generate Domestic Clubs & Offers"
          onClick={() => generateDomesticLeagueAndOffers(selectedCountry)}
          disabled={!canGenerateOffers}
          fullWidth
        />
      </div>

      {offers.length > 0 && (
        <>
          <h4 className="sim-section-title">Choose from 3 Club Offers</h4>
          <div className="sim-series-mode-grid">
            {offers.map((offer) => (
              <button
                key={offer}
                type="button"
                className={`sim-series-mode-card ${selectedTeam === offer ? 'active' : ''}`}
                onClick={() => setSelectedTeam(offer)}
              >
                <h4>{offer}</h4>
                <p>{selectedCountry} Domestic League</p>
              </button>
            ))}
          </div>
        </>
      )}

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
        onClick={() =>
          beginCareer({
            team: selectedTeam,
            seasonLength: selectedSeasonLength,
            playerProfile: {
              name: playerName.trim(),
              age: Number(playerAge),
              nationality: playerNationality,
            },
            domesticCountry: selectedCountry,
            domesticTeams,
            offers,
          })
        }
        disabled={!canStart}
        fullWidth
      />
    </StageShell>
  );
}

export default CareerSetupStage;
