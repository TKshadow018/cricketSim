import React from 'react';
import StageShell from './StageShell';
import FlagTeamGrid from './FlagTeamGrid';
import AppButton from '../../../components/ui/AppButton';
import {
  CAREER_SEASON_LENGTHS,
  buildCareerOffers,
  createDomesticTeamsForAllCountries,
  createGlobalCareerPlayerPool,
} from '../utils/controllerCareerScheduleUtils';

const SEASON_LENGTH_OPTIONS = [
  { key: 'short', label: 'Short', matches: CAREER_SEASON_LENGTHS.short, description: `${CAREER_SEASON_LENGTHS.short} format${CAREER_SEASON_LENGTHS.short === 1 ? '' : 's'}` },
  { key: 'standard', label: 'Standard', matches: CAREER_SEASON_LENGTHS.standard, description: `${CAREER_SEASON_LENGTHS.standard} format${CAREER_SEASON_LENGTHS.standard === 1 ? '' : 's'}` },
  { key: 'full', label: 'Full', matches: CAREER_SEASON_LENGTHS.full, description: `${CAREER_SEASON_LENGTHS.full} format${CAREER_SEASON_LENGTHS.full === 1 ? '' : 's'}` },
];

const PLAYER_TYPE_OPTIONS = [
  { key: 'batsman', label: 'Batsman', badge: 'BAT', blurb: 'Top-order run machine' },
  { key: 'bowler', label: 'Bowler', badge: 'BWL', blurb: 'Strike-taking specialist' },
  { key: 'wicketkeeper', label: 'Wicketkeeper', badge: 'WK', blurb: 'Gloves and finishing touch' },
  { key: 'pace allrounder', label: 'Pace Allrounder', badge: 'AR-P', blurb: 'Fast bowling + batting depth' },
  { key: 'spin allrounder', label: 'Spin Allrounder', badge: 'AR-S', blurb: 'Spin bowling + batting depth' },
  { key: 'pacer', label: 'Pacer', badge: 'PAC', blurb: 'Pure pace attack option' },
  { key: 'spiner', label: 'Spiner', badge: 'SPN', blurb: 'Spin control and turn' },
];

function CareerSetupStage({
  stageCommonProps,
  countryList,
  game,
  beginCareer,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerGlobalPlayerPool,
  careerOffers,
}) {
  const [playerName, setPlayerName] = React.useState(careerPlayerProfile?.name || '');
  const [playerAge, setPlayerAge] = React.useState(careerPlayerProfile?.age || 18);
  const [playerNationality, setPlayerNationality] = React.useState(careerPlayerProfile?.nationality || '');
  const [playerType, setPlayerType] = React.useState(careerPlayerProfile?.playerType || 'batsman');
  const [selectedCountry, setSelectedCountry] = React.useState(careerDomesticCountry || '');
  const [domesticTeams, setDomesticTeams] = React.useState(careerDomesticTeams || []);
  const [globalPlayerPool, setGlobalPlayerPool] = React.useState(careerGlobalPlayerPool || []);
  const [offers, setOffers] = React.useState(careerOffers || []);
  const [selectedTeam, setSelectedTeam] = React.useState(game.careerTeam || '');
  const [selectedSeasonLength, setSelectedSeasonLength] = React.useState(game.careerSeasonLength || 'standard');
  const trimmedPlayerName = (playerName || '').trim();
  const numericAge = Number(playerAge);
  const normalizedNationality = (playerNationality || selectedCountry || '').trim();
  const ageValid = Number.isFinite(numericAge) && numericAge >= 16 && numericAge <= 40;
  const canGenerateOffers = !!selectedCountry;
  const canStart =
    !!selectedTeam &&
    trimmedPlayerName &&
    ageValid &&
    !!normalizedNationality &&
    !!playerType &&
    domesticTeams.length > 0 &&
    globalPlayerPool.length > 0;
  const selectedOffer = offers.find((offer) => {
    const teamName = typeof offer === 'string' ? offer : offer.team;
    return teamName === selectedTeam;
  });
  const selectedPlayerType = PLAYER_TYPE_OPTIONS.find((option) => option.key === playerType) || PLAYER_TYPE_OPTIONS[0];
  const selectedPlayerTypeThemeClass = `sim-career-player-preview--${String(selectedPlayerType.key || 'batsman').replace(/\s+/g, '-')}`;

  const generateDomesticLeagueAndOffers = (countryName) => {
    if (!countryName) return;
    const createdTeams = createDomesticTeamsForAllCountries(countryList);
    const createdPool = createGlobalCareerPlayerPool(countryList);
    const selectedCountryTeams = createdTeams.filter((team) => team.country === countryName);
    const createdOffers = buildCareerOffers(selectedCountryTeams, 3);
    setDomesticTeams(createdTeams);
    setGlobalPlayerPool(createdPool);
    setOffers(createdOffers);
    setSelectedTeam(createdOffers[0]?.team || '');
  };

  return (
    <StageShell {...stageCommonProps} title="Career Mode Setup" subtitle="Create your player and begin a full player career journey.">
      <h4 className="sim-section-title">Create Your Player</h4>
      <div className="sim-scoreboard-panel sim-career-create-panel sim-career-reveal">
        <div className="sim-career-create-grid">
          <label htmlFor="career-player-name">Player Name</label>
          <input
            id="career-player-name"
            className="sim-career-input"
            type="text"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Enter player name"
          />

          <label htmlFor="career-player-age">Age</label>
          <input
            id="career-player-age"
            className="sim-career-input"
            type="number"
            min={16}
            max={40}
            value={playerAge}
            onChange={(event) => setPlayerAge(event.target.value)}
          />

          <label htmlFor="career-player-nationality">Nationality</label>
          <select
            id="career-player-nationality"
            className="sim-career-input"
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

          <label>Player Type</label>
          <div className="sim-career-type-grid" role="radiogroup" aria-label="Player type">
            {PLAYER_TYPE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`sim-career-type-pill ${playerType === option.key ? 'active' : ''}`}
                onClick={() => setPlayerType(option.key)}
                role="radio"
                aria-checked={playerType === option.key}
              >
                <span className="sim-career-type-pill-badge">{option.badge}</span>
                <span className="sim-career-type-pill-label">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="sim-career-type-blurb">{selectedPlayerType.blurb}</p>
        </div>

        <div className={`sim-career-player-preview sim-career-reveal ${selectedPlayerTypeThemeClass}`} aria-live="polite">
          <p className="sim-career-player-preview-kicker">Player Preview</p>
          <h4>{trimmedPlayerName || 'Unnamed Prospect'}</h4>
          <p>Age: {Number.isFinite(numericAge) ? numericAge : 'N/A'}</p>
          <p>Nationality: {normalizedNationality || 'Choose nationality'}</p>
          <p>Role: {selectedPlayerType.label}</p>
          <p>Style Tag: {selectedPlayerType.badge}</p>
          <p className="sim-career-player-preview-status">
            {canStart ? 'Ready to begin career.' : 'Complete all required fields to start career.'}
          </p>
        </div>
      </div>

      <h4 className="sim-section-title">Select Domestic League Country</h4>
      <FlagTeamGrid
        teams={countryList}
        selectedName={selectedCountry}
        onSelect={(team) => {
          setSelectedCountry(team.name);
          setDomesticTeams([]);
          setGlobalPlayerPool([]);
          setOffers([]);
          setSelectedTeam('');
        }}
      />

      <div style={{ marginTop: '10px' }}>
        <AppButton
          text="Generate Global Clubs & Player Pool"
          onClick={() => generateDomesticLeagueAndOffers(selectedCountry)}
          disabled={!canGenerateOffers}
          fullWidth
        />
      </div>

      {offers.length > 0 && (
        <>
          <h4 className="sim-section-title">Choose from 3 Club Offers</h4>
          <div className="sim-series-mode-grid">
            {offers.map((offer) => {
              const teamName = typeof offer === 'string' ? offer : offer.team;
              const amountLabel = typeof offer === 'string' ? '' : offer.amountLabel;
              const locationLabel = typeof offer === 'string' ? '' : [offer.location, offer.country].filter(Boolean).join(', ');
              return (
                <button
                  key={teamName}
                  type="button"
                  className={`sim-series-mode-card ${selectedTeam === teamName ? 'active' : ''}`}
                  onClick={() => setSelectedTeam(teamName)}
                >
                  <h4>{teamName}</h4>
                  <p>{selectedCountry} Domestic League</p>
                  {locationLabel ? <small>{locationLabel}</small> : null}
                  {amountLabel ? <small>Offer: {amountLabel}</small> : null}
                </button>
              );
            })}
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
        text={selectedTeam ? `Begin Career with ${selectedTeam}` : 'Begin Career'}
        onClick={() =>
          beginCareer({
            team: selectedTeam,
            seasonLength: selectedSeasonLength,
            playerProfile: {
              name: trimmedPlayerName,
              age: numericAge,
              nationality: normalizedNationality,
              playerType,
            },
            domesticCountry: selectedCountry,
            domesticTeams,
            globalPlayerPool,
            countryList,
            offers,
          })
        }
        disabled={!canStart}
        fullWidth
      />
      {selectedOffer && typeof selectedOffer === 'object' ? (
        <p className="sim-career-create-footer-note">
          Selected offer: {selectedOffer.team}
          {selectedOffer.amountLabel ? ` (${selectedOffer.amountLabel})` : ''}
        </p>
      ) : null}
    </StageShell>
  );
}

export default CareerSetupStage;
