import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import {
  createDomesticTeamsForAllCountries,
  createGlobalCareerPlayerPool,
} from '../utils/controllerCareerScheduleUtils';
import '../styles/career-setup-wizard.css';

const CAREER_SETUP_STEPS = [
  {
    title: 'Player Details',
    subtitle: 'Create the player who will lead your career.',
  },
  {
    title: 'Playing Style',
    subtitle: 'Choose a role that fits the player you want to build.',
  },
  {
    title: 'Domestic League',
    subtitle: 'Choose a country and prepare its clubs and player pool.',
  },
  {
    title: 'Review & Start',
    subtitle: 'Confirm your player and career plan before the auction.',
  },
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
  beginCareer,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerGlobalPlayerPool,
}) {
  const availableCountries = Array.isArray(countryList) ? countryList : [];
  const [step, setStep] = React.useState(1);
  const progressRef = React.useRef(null);
  const [playerName, setPlayerName] = React.useState(careerPlayerProfile?.name || '');
  const [playerAge, setPlayerAge] = React.useState(careerPlayerProfile?.age || 18);
  const [playerNationality, setPlayerNationality] = React.useState(
    careerPlayerProfile?.nationality || careerDomesticCountry || ''
  );
  const [playerType, setPlayerType] = React.useState(() =>
    PLAYER_TYPE_OPTIONS.find((option) => option.key === careerPlayerProfile?.playerType)?.key || 'batsman'
  );
  const [selectedCountry, setSelectedCountry] = React.useState(careerDomesticCountry || '');
  const [domesticTeams, setDomesticTeams] = React.useState(
    Array.isArray(careerDomesticTeams) ? careerDomesticTeams : []
  );
  const [globalPlayerPool, setGlobalPlayerPool] = React.useState(
    Array.isArray(careerGlobalPlayerPool) ? careerGlobalPlayerPool : []
  );

  const trimmedPlayerName = String(playerName || '').trim();
  const numericAge = Number(playerAge);
  const normalizedNationality = String(playerNationality || selectedCountry || '').trim();
  const ageValid = Number.isFinite(numericAge) && numericAge >= 16 && numericAge <= 40;
  const playerDetailsReady = !!trimmedPlayerName && ageValid && !!normalizedNationality;
  const hasGeneratedCareerData = domesticTeams.length > 0 && globalPlayerPool.length > 0;
  const canContinueToSeason = !!selectedCountry && hasGeneratedCareerData;
  const canStart = playerDetailsReady && !!playerType && canContinueToSeason;
  const selectedPlayerType = PLAYER_TYPE_OPTIONS.find((option) => option.key === playerType) || PLAYER_TYPE_OPTIONS[0];
  const selectedPlayerTypeThemeClass = `sim-career-player-preview--${String(selectedPlayerType.key).replace(/\s+/g, '-')}`;
  const stepContent = CAREER_SETUP_STEPS[step - 1];

  React.useLayoutEffect(() => {
    const scrollContainer = progressRef.current?.closest('.sim-shell');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [step]);

  const generateDomesticLeagueAndOffers = () => {
    const createdTeams = createDomesticTeamsForAllCountries(availableCountries);
    const createdPool = createGlobalCareerPlayerPool(availableCountries);
    setDomesticTeams(Array.isArray(createdTeams) ? createdTeams : []);
    setGlobalPlayerPool(Array.isArray(createdPool) ? createdPool : []);
  };

  const handleBeginCareer = () => {
    if (!canStart) {
      return;
    }

    beginCareer({
      playerProfile: {
        name: trimmedPlayerName,
        age: numericAge,
        nationality: normalizedNationality,
        playerType,
      },
      domesticCountry: selectedCountry,
      domesticTeams,
      globalPlayerPool,
      countryList: availableCountries,
      offers: [],
    });
  };

  return (
    <StageShell
      {...stageCommonProps}
      title={stepContent.title}
      subtitle={stepContent.subtitle}
    >
      <div className="sim-career-setup-progress" ref={progressRef}>
        <div className="sim-career-setup-progress-labels">
          <span>CAREER SETUP</span>
          <span>Step {step} of {CAREER_SETUP_STEPS.length}</span>
        </div>
        <div
          className="sim-career-setup-progress-track"
          role="progressbar"
          aria-label="Career setup progress"
          aria-valuemin={1}
          aria-valuemax={CAREER_SETUP_STEPS.length}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of ${CAREER_SETUP_STEPS.length}`}
        >
          <span style={{ width: `${(step / CAREER_SETUP_STEPS.length) * 100}%` }} />
        </div>
      </div>

      {step === 1 ? (
        <section className="sim-career-create-panel sim-career-reveal" aria-labelledby="career-player-details-title">
          <h3 id="career-player-details-title" className="sim-section-title">Player identity</h3>
          <div className="sim-career-create-grid">
            <label htmlFor="career-player-name">Player Name</label>
            <input
              id="career-player-name"
              className="sim-career-input"
              type="text"
              autoComplete="name"
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
              inputMode="numeric"
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
              {availableCountries.map((country) => (
                <option key={`nat-${country.id}`} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          {!playerDetailsReady ? (
            <p className="sim-career-create-hint" role="status" aria-live="polite">
              Enter a name, an age from 16 to 40, and a nationality to continue.
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="sim-career-create-panel sim-career-reveal" aria-labelledby="career-player-style-title">
          <h3 id="career-player-style-title" className="sim-section-title">Choose a player role</h3>
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
          <div className={`sim-career-player-preview ${selectedPlayerTypeThemeClass}`} aria-live="polite">
            <p className="sim-career-player-preview-kicker">Player Preview</p>
            <h4>{trimmedPlayerName || 'Unnamed Prospect'}</h4>
            <p>Age: {Number.isFinite(numericAge) ? numericAge : 'N/A'}</p>
            <p>Nationality: {normalizedNationality || 'Choose nationality'}</p>
            <p>Role: {selectedPlayerType.label}</p>
            <p>Style Tag: {selectedPlayerType.badge}</p>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="sim-career-create-panel sim-career-reveal" aria-labelledby="career-league-title">
          <h3 id="career-league-title" className="sim-section-title">Select your domestic league</h3>
          <label htmlFor="career-domestic-country">League Country</label>
          <select
            id="career-domestic-country"
            className="sim-career-input"
            value={selectedCountry}
            onChange={(event) => {
              setSelectedCountry(event.target.value);
              setDomesticTeams([]);
              setGlobalPlayerPool([]);
            }}
          >
            <option value="">Select a country</option>
            {availableCountries.map((country) => (
              <option key={`league-${country.id}`} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>

          <div className="sim-career-setup-generation">
            <p>
              {hasGeneratedCareerData
                ? `${domesticTeams.length} clubs and ${globalPlayerPool.length} player${globalPlayerPool.length === 1 ? '' : 's'} are ready.`
                : 'Create the clubs and player pool before continuing.'}
            </p>
            <AppButton
              text={hasGeneratedCareerData ? 'Regenerate Clubs & Player Pool' : 'Generate Clubs & Player Pool'}
              onClick={generateDomesticLeagueAndOffers}
              disabled={!selectedCountry}
              fullWidth={false}
              variant="secondary"
            />
          </div>
          <p className="sim-career-create-hint" role="status" aria-live="polite">
            {canContinueToSeason
              ? 'League setup is ready.'
              : 'Choose a league country and generate its clubs to continue.'}
          </p>
        </section>
      ) : null}

      {step === 4 ? (
        <>
          <section className="sim-career-setup-review" aria-labelledby="career-review-title">
            <h3 id="career-review-title" className="sim-section-title">Career overview</h3>
            <dl>
              <div>
                <dt>Player</dt>
                <dd>{trimmedPlayerName}</dd>
                <small>Age {numericAge} · {normalizedNationality}</small>
              </div>
              <div><dt>Role</dt><dd>{selectedPlayerType.label}</dd></div>
              <div><dt>League</dt><dd>{selectedCountry}</dd></div>
              <div><dt>Season</dt><dd>1 cycle</dd></div>
              <div>
                <dt>Club pool</dt>
                <dd>
                  {domesticTeams.length} clubs · {globalPlayerPool.length} player{globalPlayerPool.length === 1 ? '' : 's'}
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : null}

      <div className="sim-career-setup-actions">
        {step > 1 ? (
          <AppButton
            text={`Back to ${CAREER_SETUP_STEPS[step - 2].title}`}
            onClick={() => setStep((currentStep) => currentStep - 1)}
            variant="secondary"
            fullWidth={false}
          />
        ) : null}
        {step === 1 ? (
          <AppButton
            text="Continue to Playing Style"
            onClick={() => setStep(2)}
            disabled={!playerDetailsReady}
            fullWidth={false}
          />
        ) : null}
        {step === 2 ? (
          <AppButton
            text="Continue to Domestic League"
            onClick={() => setStep(3)}
            fullWidth={false}
          />
        ) : null}
        {step === 3 ? (
          <AppButton
            text="Continue to Career Review"
            onClick={() => setStep(4)}
            disabled={!canContinueToSeason}
            fullWidth={false}
          />
        ) : null}
        {step === 4 ? (
          <AppButton
            text="Begin Career and Run Auction"
            onClick={handleBeginCareer}
            disabled={!canStart}
            fullWidth={false}
          />
        ) : null}
      </div>
    </StageShell>
  );
}

export default CareerSetupStage;
