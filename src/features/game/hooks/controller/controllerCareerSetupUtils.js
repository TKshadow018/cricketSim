import { PLAYER_TYPES } from "../../../../gameData/playerTypes";
import { assignCareerSkills, limitPlayerSkills } from "../../../../gameData/playerSkills";
import { buildRandomBattingOrderCoeff, ensurePlayerMeta } from "../../utils/controllerCommonUtils";
import { randomInt } from "./controllerCareerMarketUtils";

export const normalizePlayerType = (value) => String(value || '').trim().toLowerCase();

export const buildStatsByPlayerType = (playerType) => {
  const normalizedType = normalizePlayerType(playerType);

  if (normalizedType === PLAYER_TYPES.WICKETKEEPER) {
    return {
      abilityToPlayPaceBall: randomInt(35, 55),
      abilityToPlaySpinBall: randomInt(35, 55),
      battingAggresion: randomInt(40, 60),
      paceAbility: randomInt(8, 15),
      spinAbility: randomInt(8, 15),
      isWicketKeeper: true,
      playerType: PLAYER_TYPES.WICKETKEEPER,
    };
  }

  if (normalizedType === PLAYER_TYPES.PACE_ALLROUNDER) {
    return {
      abilityToPlayPaceBall: randomInt(30, 50),
      abilityToPlaySpinBall: randomInt(30, 50),
      battingAggresion: randomInt(40, 60),
      paceAbility: randomInt(30, 50),
      spinAbility: randomInt(8, 15),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.PACE_ALLROUNDER,
    };
  }

  if (normalizedType === PLAYER_TYPES.SPIN_ALLROUNDER) {
    return {
      abilityToPlayPaceBall: randomInt(30, 50),
      abilityToPlaySpinBall: randomInt(30, 50),
      battingAggresion: randomInt(40, 60),
      paceAbility: randomInt(8, 15),
      spinAbility: randomInt(30, 50),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.SPIN_ALLROUNDER,
    };
  }

  if (normalizedType === PLAYER_TYPES.PACER) {
    return {
      abilityToPlayPaceBall: randomInt(8, 15),
      abilityToPlaySpinBall: randomInt(8, 15),
      battingAggresion: randomInt(10, 60),
      paceAbility: randomInt(40, 60),
      spinAbility: randomInt(8, 15),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.PACER,
    };
  }

  if (normalizedType === PLAYER_TYPES.SPINER) {
    return {
      abilityToPlayPaceBall: randomInt(8, 15),
      abilityToPlaySpinBall: randomInt(8, 15),
      battingAggresion: randomInt(10, 60),
      paceAbility: randomInt(8, 15),
      spinAbility: randomInt(40, 60),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.SPINER,
    };
  }

  if (normalizedType === PLAYER_TYPES.BOWLER) {
    const pacePrimary = Math.random() >= 0.5;
    return {
      abilityToPlayPaceBall: randomInt(8, 15),
      abilityToPlaySpinBall: randomInt(8, 15),
      battingAggresion: randomInt(10, 60),
      paceAbility: pacePrimary ? randomInt(40, 60) : randomInt(8, 15),
      spinAbility: pacePrimary ? randomInt(8, 15) : randomInt(40, 60),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.BOWLER,
    };
  }

  return {
    abilityToPlayPaceBall: randomInt(40, 60),
    abilityToPlaySpinBall: randomInt(40, 60),
    battingAggresion: randomInt(50, 70),
    paceAbility: randomInt(8, 15),
    spinAbility: randomInt(8, 15),
    isWicketKeeper: false,
    playerType: PLAYER_TYPES.BATSMAN,
  };
};

export const resolveMatchTypeKeyForFormat = (format) => {
  if (format === 'odi') return 'ODI';
  if (format === 'firstClass') return 'test';
  return 't20';
};

export const buildCreatedCareerPlayer = (profile, domesticCountry) => {
  const assigned = buildStatsByPlayerType(profile?.playerType);
  return ensurePlayerMeta({
    id: `career-player-${Date.now()}`,
    name: profile.name,
    country: profile.nationality || domesticCountry,
    playerType: assigned.playerType,
    abilityToPlayPaceBall: assigned.abilityToPlayPaceBall,
    abilityToPlaySpinBall: assigned.abilityToPlaySpinBall,
    battingAggresion: assigned.battingAggresion,
    paceAbility: assigned.paceAbility,
    spinAbility: assigned.spinAbility,
    isWicketKeeper: assigned.isWicketKeeper,
    skills: assignCareerSkills(assigned, 2),
    fitness: 100,
    morale: 50,
    battingOrderCoeff: buildRandomBattingOrderCoeff({
      playerType: assigned.playerType,
      isWicketKeeper: assigned.isWicketKeeper,
      abilityToPlayPaceBall: assigned.abilityToPlayPaceBall,
      abilityToPlaySpinBall: assigned.abilityToPlaySpinBall,
      paceAbility: assigned.paceAbility,
      spinAbility: assigned.spinAbility,
    }),
  });
};

export const normalizeDomesticTeams = (domesticTeams = []) =>
  (domesticTeams || []).map((team, teamIndex) => {
    const players = (team.players || []).map((player, playerIndex) => ({
      ...ensurePlayerMeta(player),
      id: player.id ?? `${team.name || 'team'}-P${teamIndex + 1}-${playerIndex + 1}`,
      skills: limitPlayerSkills(player, 2),
    }));
    return {
      ...team,
      players,
    };
  });

export const resolveCareerLeagueCountry = ({ teams = [], careerTeam = '', fallbackCountry = '' }) => {
  const matchingTeam = (teams || []).find((team) => team?.name === careerTeam);
  return matchingTeam?.country || fallbackCountry || '';
};

export const filterDomesticTeamsForLeagueCountry = ({ teams = [], leagueCountry = '' }) => {
  return (teams || []).filter((team) => team?.country === leagueCountry);
};

export const syncCareerPlayerProfile = ({ teams = [], careerTeam, careerPlayerProfile }) => {
  if (!careerPlayerProfile?.name) {
    return careerPlayerProfile;
  }

  const roster = (teams || []).find((team) => team.name === careerTeam)?.players || [];
  const updatedPlayer = careerPlayerProfile.playerId
    ? roster.find((player) => String(player.id) === String(careerPlayerProfile.playerId))
    : roster.find((player) => player.name === careerPlayerProfile.name);

  return updatedPlayer ? { ...careerPlayerProfile, ...updatedPlayer } : careerPlayerProfile;
};
