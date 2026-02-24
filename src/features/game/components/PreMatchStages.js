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

const PITCH_ICON_PATH = '/asset/img/icon/conditions/pitch-512.svg';
const OUTFIELD_ICON_PATH = '/asset/img/icon/conditions/outfield-512.svg';

const formatConditionLabel = (value = '') =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const COMMENTATOR_NAME_BANK = {
  India: {
    male: ['Aakash Chopra', 'Nikhil Verma', 'Rohan Mehta', 'Dev Malhotra', 'Arjun Bhat', 'Karan Iyer'],
    female: ['Meera Joshi', 'Ananya Rao', 'Kavya Menon', 'Riya Sharma', 'Isha Nair', 'Pooja Singh'],
  },
  England: {
    male: ['Oliver Grant', 'George Turner', 'Harry Walton', 'Arthur Blake', 'Noah Carter', 'Leo Hughes'],
    female: ['Sophie Bennett', 'Amelia Clarke', 'Lily Brooks', 'Emily Harper', 'Grace Moore', 'Olivia Hall'],
  },
  Australia: {
    male: ['Liam Cooper', 'Jack Miller', 'Ethan Wright', 'Hudson Grant', 'Aiden Blake', 'Mason Reid'],
    female: ['Charlotte Hayes', 'Mia Collins', 'Zoe Parker', 'Ava Turner', 'Matilda Brooks', 'Chloe Bennett'],
  },
  USA: {
    male: ['James Carter', 'Logan Reed', 'Lucas Hayes', 'Henry Stone', 'Mason Parker', 'Ethan Brooks'],
    female: ['Emma Brooks', 'Sophia Morgan', 'Avery Mitchell', 'Harper Clark', 'Mia Carter', 'Ella Jones'],
  },
  Canada: {
    male: ['Noah Sinclair', 'Evan Clarke', 'Ryan Fraser', 'Owen Martin', 'Liam Adams', 'Jacob Wright'],
    female: ['Olivia Martin', 'Chloe Bennett', 'Mila Adams', 'Emma Fraser', 'Ava Clarke', 'Claire Wilson'],
  },
  Ireland: {
    male: ['Conor Murphy', 'Sean Kelly', 'Ronan Doyle', 'Niall Quinn', 'Cian Walsh', 'Darragh Byrne'],
    female: ['Aoife Nolan', 'Niamh OBrien', 'Ciara Quinn', 'Orla Murphy', 'Saoirse Kelly', 'Clodagh Ryan'],
  },
  NewZealand: {
    male: ['Arlo Mason', 'Finn Walker', 'Theo Hudson', 'Lucas Reid', 'Hunter Blake', 'Mason Cole'],
    female: ['Isla Harper', 'Ruby Bennett', 'Sienna Blake', 'Ella Morgan', 'Willow Carter', 'Ava Mason'],
  },
  SouthAfrica: {
    male: ['Thabo Ndlovu', 'Kagiso Mokoena', 'Aiden Smith', 'Ruan Jacobs', 'Liam Naidoo', 'Ethan Khumalo'],
    female: ['Leah Jacobs', 'Amara Naidoo', 'Naledi Khumalo', 'Zara Mokoena', 'Mia Ndlovu', 'Ava Smith'],
  },
  Pakistan: {
    male: ['Hamza Ali', 'Usman Qureshi', 'Saad Malik', 'Ayaan Khan', 'Zayan Raza', 'Bilal Ahmed'],
    female: ['Aisha Khan', 'Noor Ahmed', 'Hania Raza', 'Mariam Ali', 'Alina Qureshi', 'Zara Malik'],
  },
  Bangladesh: {
    male: ['Rahim Hasan', 'Arif Hossain', 'Rafi Karim', 'Siam Islam', 'Nafis Rahman', 'Hasan Chowdhury'],
    female: ['Nusrat Jahan', 'Sadia Noor', 'Tania Akter', 'Afiya Rahman', 'Mahi Hasan', 'Mim Karim'],
  },
  SriLanka: {
    male: ['Kasun Perera', 'Dilan Silva', 'Ravin Senanayake', 'Ishan Fernando', 'Charith Jayawardene', 'Nimal De Silva'],
    female: ['Ishani Fernando', 'Anuki Jayasuriya', 'Piumi De Silva', 'Nethmi Perera', 'Dilani Silva', 'Madhavi Senanayake'],
  },
  Japan: {
    male: ['Haruto Sato', 'Kaito Suzuki', 'Ren Nakamura', 'Daiki Tanaka', 'Sota Kobayashi', 'Yuki Yamamoto'],
    female: ['Aoi Tanaka', 'Sakura Yamamoto', 'Mio Kobayashi', 'Hina Sato', 'Rin Suzuki', 'Yui Nakamura'],
  },
  France: {
    male: ['Louis Martin', 'Arthur Bernard', 'Jules Petit', 'Hugo Moreau', 'Lucas Laurent', 'Noah Dubois'],
    female: ['Chloe Dubois', 'Lea Moreau', 'Camille Laurent', 'Emma Bernard', 'Ines Petit', 'Jade Martin'],
  },
  Default: {
    male: ['Jordan Brown', 'Alex Taylor', 'Sam Parker', 'Jamie Wilson', 'Chris Carter', 'Ryan Stone'],
    female: ['Casey Morgan', 'Riley Carter', 'Alexis Parker', 'Taylor Brooks', 'Morgan Hayes', 'Jamie Reed'],
  },
};

const hashText = (text = '') => {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) >>> 0;
  }
  return value;
};

const regionToCountry = {
  IN: 'India',
  GB: 'England',
  UK: 'England',
  US: 'USA',
  AU: 'Australia',
  CA: 'Canada',
  IE: 'Ireland',
  NZ: 'NewZealand',
  ZA: 'SouthAfrica',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  LK: 'SriLanka',
  JP: 'Japan',
  FR: 'France',
};

const inferCountryKey = (lang = '', voiceName = '') => {
  const parts = String(lang).split('-');
  const region = (parts[1] || '').toUpperCase();
  if (regionToCountry[region]) {
    return regionToCountry[region];
  }

  const countryInName = String(voiceName).match(/\(([^)]+)\)/)?.[1]?.trim();
  if (countryInName) {
    const normalized = countryInName.replace(/\s+/g, '').toLowerCase();
    const matched = Object.keys(COMMENTATOR_NAME_BANK).find(
      (key) => key.toLowerCase() === normalized
    );
    if (matched) {
      return matched;
    }
  }

  return 'Default';
};

const inferGender = (voice = {}) => {
  const explicit = String(voice.gender || '').toLowerCase();
  if (explicit === 'male' || explicit === 'female') {
    return explicit;
  }

  const text = String(voice.name || '').toLowerCase();
  const femaleTokens = ['female', 'heera', 'zira', 'aria', 'jenny', 'sara', 'maya', 'priya', 'mia', 'olivia'];
  const maleTokens = ['male', 'david', 'mark', 'james', 'ryan', 'guy', 'adam', 'liam', 'oliver', 'haruto'];

  if (femaleTokens.some((token) => text.includes(token))) {
    return 'female';
  }
  if (maleTokens.some((token) => text.includes(token))) {
    return 'male';
  }

  return hashText(`${voice.name || ''}::${voice.lang || ''}`) % 2 === 0 ? 'male' : 'female';
};

const setCommentatorName = (voiceInput = {}) => {
  const voice =
    typeof voiceInput === 'string'
      ? {
        name: voiceInput,
        lang: '',
      }
      : (voiceInput || {});

  const countryKey = inferCountryKey(voice.lang, voice.name);
  const bank = COMMENTATOR_NAME_BANK[countryKey] || COMMENTATOR_NAME_BANK.Default;
  const gender = inferGender(voice);
  const pool = bank[gender] || bank.male || bank.female || COMMENTATOR_NAME_BANK.Default.male;
  const seed = hashText(`${voice.name || ''}::${voice.lang || ''}`);
  return pool[seed % pool.length] || COMMENTATOR_NAME_BANK.Default.male[0];
};

function PreMatchStages({
  stage,
  stageCommonProps,
  game,
  countryList,
  venueStadiums,
  availableVoices,
  matchVisual,
  goToNextStage,
  goToPreviousStage,
  selectGameMode,
  selectSeriesLength,
  tournamentUserTeam,
  tournamentOpponentTeams,
  tournamentMatches,
  toggleTournamentOpponent,
  prepareTournamentFixtures,
  confirmTournamentFixtures,
  randomizeTournamentFixtures,
  updateTournamentFixture,
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

  const showSetupBackButton =
    (stage >= matchStatusEnum.ChooseMatchType && stage < matchStatusEnum.TeamOneBat) ||
    stage === matchStatusEnum.ChooseSeriesLength ||
    stage === matchStatusEnum.SetupTournamentFixtures;
  const setupBackSlot = showSetupBackButton ? (
    <AppButton text="Back" variant="secondary" fullWidth={false} onClick={goToPreviousStage} />
  ) : null;

  const selectedCommentatorVoice = useMemo(
    () => availableVoices.find((voice) => voice.name === game.commentator),
    [availableVoices, game.commentator]
  );

  const commentatorDisplayName = setCommentatorName(selectedCommentatorVoice || game.commentator);

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
    const seriesResults = Array.isArray(gameState.seriesResults) ? gameState.seriesResults : [];
    const tournamentResults = Array.isArray(gameState.tournamentMatches)
      ? gameState.tournamentMatches.filter((match) => match?.isComplete)
      : [];
    const isSeries = gameState.gameMode === 'series';
    const isTournament = gameState.gameMode === 'tournament';
    const overs = (balls) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

    const standing = seriesResults.reduce(
      (acc, result) => {
        if (result.winnerTeam === gameState.ownTeam) {
          acc.ownWins += 1;
        } else if (result.winnerTeam === gameState.opponentTeam) {
          acc.opponentWins += 1;
        } else {
          acc.ties += 1;
        }
        return acc;
      },
      { ownWins: 0, opponentWins: 0, ties: 0 }
    );

    const prefix = isSeries
      ? `${gameState.seriesLength || 1}-match series • ${gameState.ownTeam || 'Own'} ${standing.ownWins}-${standing.opponentWins} ${gameState.opponentTeam || 'Opponent'} • Match ${gameState.seriesCurrentMatch || 1}: `
      : isTournament
        ? `${(gameState.tournamentOpponentTeams || []).length + 1}-team knockout • ${gameState.tournamentUserTeam || gameState.ownTeam} • Completed ${tournamentResults.length}: `
      : '';

    if (stage === matchStatusEnum.TeamOneBat) {
      return `${prefix}${gameState.firstBattingSide === 'own' ? gameState.ownTeam : gameState.opponentTeam}: ${
        first.score || 0
      }/${first.wickets || 0} (${overs(first.balls)})`;
    }

    if (stage === matchStatusEnum.TeamTwoBat || stage === matchStatusEnum.MatchEnd) {
      const secondBattingTeam = gameState.firstBattingSide === 'own' ? gameState.opponentTeam : gameState.ownTeam;
      return `${prefix}${secondBattingTeam}: ${second.score || 0}/${second.wickets || 0} (${overs(second.balls)})`;
    }

    if (stage === matchStatusEnum.SeriesSummary) {
      return `${prefix}Series completed • Final ${standing.ownWins}-${standing.opponentWins}`;
    }

    return `${prefix}Stage ${stage ?? '-'} setup in progress`;
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
                        <select
                          value={match.teamA}
                          onChange={(event) => updateTournamentFixture(match.id, 'teamA', event.target.value)}
                        >
                          <option value="">Select team</option>
                          {teamOptions.map((team) => (
                            <option key={`fixture-a-${match.id}-${team}`} value={team}>{team}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Team B
                        <select
                          value={match.teamB}
                          onChange={(event) => updateTournamentFixture(match.id, 'teamB', event.target.value)}
                        >
                          <option value="">Select team</option>
                          {teamOptions.map((team) => (
                            <option key={`fixture-b-${match.id}-${team}`} value={team}>{team}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Match Date
                        <input
                          type="date"
                          value={match.date || ''}
                          onChange={(event) => updateTournamentFixture(match.id, 'date', event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
          </div>
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

      {stage === matchStatusEnum.ChooseOwnPlayingXI && (
        <StageShell {...stageCommonProps} title="Select Your Team" subtitle="Choose exactly 11 players for your playing XI." rightSlot={setupBackSlot} dark>
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
        <StageShell {...stageCommonProps} title="Select Opponent Team" subtitle="Choose exactly 11 players for opponent playing XI." rightSlot={setupBackSlot} dark>
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
