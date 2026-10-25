import { applyEndOfSeasonPlayerAbilityUpdates } from "../../utils/controllerCareerScheduleUtils";
import { buildTopRunScorers, buildTopWicketTakers } from "../../utils/controllerCareerUtils";
import { buildSeasonProgressionNotes } from "../../utils/controllerCareerPlayerUtils";

export const markContribution = (map, player, key) => {
  if (player.id !== undefined && player.id !== null) {
    const idKey = String(player.id);
    map[idKey] = {
      ...(map[idKey] || {}),
      [key]: true,
    };
  }

  if (player.name) {
    const nameKey = String(player.name);
    map[nameKey] = {
      ...(map[nameKey] || {}),
      [key]: true,
    };
  }
};

export const buildTeamContributionsFromInnings = ({ players = [], battingStats = [], bowlingStats = [] }) => {
  const map = {};

  (players || []).forEach((player, index) => {
    const batting = battingStats[index] || {};
    const bowling = bowlingStats[index] || {};
    if (Number(batting?.balls || 0) > 0) {
      markContribution(map, player, 'didBat');
    }
    if (Number(bowling?.balls || 0) > 0) {
      markContribution(map, player, 'didBowl');
    }
  });

  return map;
};

export const buildSeasonPlayerAwardIndex = ({
  careerDomesticTeams,
  careerPlayerStats,
  careerPlayerProfile,
  currentAge,
}) => {
  const rosterByTeamAndId = new Map();
  const rosterByTeamAndName = new Map();

  (careerDomesticTeams || []).forEach((team) => {
    (team.players || []).forEach((player) => {
      if (player?.id !== undefined && player?.id !== null) {
        rosterByTeamAndId.set(`${team.name}::${String(player.id)}`, player);
      }
      if (player?.name) {
        rosterByTeamAndName.set(`${team.name}::${player.name}`, player);
      }
    });
  });

  return Object.values(careerPlayerStats || {})
    .filter((entry) => entry && entry.name && entry.team)
    .map((entry) => {
      const rosterPlayer =
        (entry.playerId !== undefined && entry.playerId !== null
          ? rosterByTeamAndId.get(`${entry.team}::${String(entry.playerId)}`)
          : null) ||
        rosterByTeamAndName.get(`${entry.team}::${entry.name}`) ||
        null;

      const battingAverage = Number(entry.outs || 0) > 0 ? Number(entry.runs || 0) / Number(entry.outs || 1) : Number(entry.runs || 0);
      const strikeRate = Number(entry.balls || 0) > 0 ? (Number(entry.runs || 0) * 100) / Number(entry.balls || 1) : 0;
      const bowlingAverage = Number(entry.wickets || 0) > 0 ? Number(entry.runsConceded || 0) / Number(entry.wickets || 1) : 999;
      const economy = Number(entry.ballsBowled || 0) > 0 ? (Number(entry.runsConceded || 0) * 6) / Number(entry.ballsBowled || 1) : 99;
      const resolvedAge =
        careerPlayerProfile?.playerId !== undefined &&
        careerPlayerProfile?.playerId !== null &&
        String(entry.playerId) === String(careerPlayerProfile.playerId)
          ? currentAge
          : Number(rosterPlayer?.age || 25);

      return {
        ...entry,
        battingAverage,
        strikeRate,
        bowlingAverage,
        economy,
        age: resolvedAge,
      };
    });
};

export const buildMomAwardsMapFromSchedule = (careerSchedule = []) => {
  const counts = new Map();

  (careerSchedule || []).forEach((fixture) => {
    if (!fixture?.isComplete) {
      return;
    }

    const awarded = fixture.result?.momAward || fixture.result?.momShortlist?.[0] || null;
    if (!awarded?.team || !awarded?.name) {
      return;
    }

    const key = `${awarded.team}::${awarded.playerId ?? ''}::${awarded.name}`;
    counts.set(key, {
      key,
      team: awarded.team,
      playerId: awarded.playerId,
      name: awarded.name,
      count: Number(counts.get(key)?.count || 0) + 1,
    });
  });

  return counts;
};

export const resolveSeasonAwards = (players = [], momAwardsMap = new Map()) => {
  const withMomCounts = players.map((entry) => {
    const momKey = `${entry.team}::${entry.playerId ?? ''}::${entry.name}`;
    const momAwards = Number(momAwardsMap.get(momKey)?.count || 0);
    const allRoundScore =
      Number(entry.runs || 0) * 1.25 +
      Number(entry.wickets || 0) * 28 +
      Number(entry.matches || 0) * 2 +
      momAwards * 22;

    return {
      ...entry,
      momAwards,
      allRoundScore,
    };
  });

  const bestBatsman = [...withMomCounts].sort(
    (left, right) =>
      Number(right.runs || 0) - Number(left.runs || 0) ||
      right.battingAverage - left.battingAverage ||
      right.strikeRate - left.strikeRate ||
      String(left.name || '').localeCompare(String(right.name || ''))
  )[0] || null;

  const bestBowler = [...withMomCounts].sort(
    (left, right) =>
      Number(right.wickets || 0) - Number(left.wickets || 0) ||
      left.bowlingAverage - right.bowlingAverage ||
      left.economy - right.economy ||
      String(left.name || '').localeCompare(String(right.name || ''))
  )[0] || null;

  const youngPlayer = [...withMomCounts]
    .filter((entry) => Number(entry.age || 99) < 23)
    .sort(
      (left, right) =>
        right.allRoundScore - left.allRoundScore ||
        Number(right.runs || 0) - Number(left.runs || 0) ||
        Number(right.wickets || 0) - Number(left.wickets || 0)
    )[0] || null;

  const playerOfYear = [...withMomCounts].sort(
    (left, right) =>
      right.allRoundScore - left.allRoundScore ||
      Number(right.runs || 0) - Number(left.runs || 0) ||
      Number(right.wickets || 0) - Number(left.wickets || 0)
  )[0] || null;

  const mostMom = [...withMomCounts].sort(
    (left, right) => right.momAwards - left.momAwards || right.allRoundScore - left.allRoundScore
  )[0] || null;

  return [
    {
      id: 'best-batsman',
      title: 'Best Batsman',
      winner: bestBatsman
        ? { name: bestBatsman.name, team: bestBatsman.team, playerId: bestBatsman.playerId }
        : null,
      summary: bestBatsman ? `${bestBatsman.runs} runs (avg ${bestBatsman.battingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'best-bowler',
      title: 'Best Bowler',
      winner: bestBowler
        ? { name: bestBowler.name, team: bestBowler.team, playerId: bestBowler.playerId }
        : null,
      summary: bestBowler ? `${bestBowler.wickets} wickets (avg ${bestBowler.bowlingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'young-player',
      title: 'Young Player of the Year (U23)',
      winner: youngPlayer
        ? { name: youngPlayer.name, team: youngPlayer.team, playerId: youngPlayer.playerId }
        : null,
      summary: youngPlayer
        ? `${youngPlayer.runs} runs, ${youngPlayer.wickets} wickets, age ${youngPlayer.age}`
        : 'No eligible under-23 player',
    },
    {
      id: 'player-of-year',
      title: 'Player of the Year',
      winner: playerOfYear
        ? { name: playerOfYear.name, team: playerOfYear.team, playerId: playerOfYear.playerId }
        : null,
      summary: playerOfYear ? `Impact score ${Math.round(playerOfYear.allRoundScore)}` : 'No winner',
    },
    {
      id: 'most-mom',
      title: 'Most Man of the Match Awards',
      winner: mostMom
        ? { name: mostMom.name, team: mostMom.team, playerId: mostMom.playerId }
        : null,
      summary: mostMom ? `${mostMom.momAwards} awards` : 'No MOM awards recorded',
    },
  ];
};

export const buildEndOfSeasonReport = ({
  careerTeam,
  careerSeason,
  currentAge,
  careerDomesticTeams,
  careerPlayerStats,
  careerPlayerProfile,
  careerStandings,
  careerSchedule,
}) => {
  const previewTeams = applyEndOfSeasonPlayerAbilityUpdates({
    domesticTeams: careerDomesticTeams,
    careerPlayerStats,
    currentAge,
    careerTeam,
    careerPlayerProfile,
  });

  const currentByTeamAndId = new Map();
  (careerDomesticTeams || []).forEach((team) => {
    (team.players || []).forEach((player) => {
      currentByTeamAndId.set(`${team.name}::${player.id}`, player);
    });
  });

  const abilityChangePreview = [];
  previewTeams.forEach((team) => {
    (team.players || []).forEach((player) => {
      const previous = currentByTeamAndId.get(`${team.name}::${player.id}`);
      if (!previous) {
        return;
      }

      const before = {
        abilityToPlayPaceBall: Number(previous.abilityToPlayPaceBall || 0),
        abilityToPlaySpinBall: Number(previous.abilityToPlaySpinBall || 0),
        battingAggresion: Number(previous.battingAggresion || 0),
        paceAbility: Number(previous.paceAbility || 0),
        spinAbility: Number(previous.spinAbility || 0),
      };
      const after = {
        abilityToPlayPaceBall: Number(player.abilityToPlayPaceBall || 0),
        abilityToPlaySpinBall: Number(player.abilityToPlaySpinBall || 0),
        battingAggresion: Number(player.battingAggresion || 0),
        paceAbility: Number(player.paceAbility || 0),
        spinAbility: Number(player.spinAbility || 0),
      };
      const delta =
        (after.abilityToPlayPaceBall - before.abilityToPlayPaceBall) +
        (after.abilityToPlaySpinBall - before.abilityToPlaySpinBall) +
        (after.battingAggresion - before.battingAggresion) +
        (after.paceAbility - before.paceAbility) +
        (after.spinAbility - before.spinAbility);

      if (delta !== 0) {
        abilityChangePreview.push({
          team: team.name,
          player: previous,
          before,
          after,
          delta,
        });
      }
    });
  });

  abilityChangePreview.sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.player.name.localeCompare(right.player.name));

  const careerPlayerStatsList = Object.values(careerPlayerStats || {}).filter((entry) => entry && entry.name);
  const awardsPlayerIndex = buildSeasonPlayerAwardIndex({
    careerDomesticTeams,
    careerPlayerStats,
    careerPlayerProfile,
    currentAge,
  });
  const momAwardsMap = buildMomAwardsMapFromSchedule(careerSchedule);

  return {
    season: careerSeason,
    currentAge,
    standings: careerStandings,
    schedule: careerSchedule,
    topRunScorers: buildTopRunScorers(careerPlayerStatsList),
    topWicketTakers: buildTopWicketTakers(careerPlayerStatsList),
    awards: resolveSeasonAwards(awardsPlayerIndex, momAwardsMap),
    progressionNotes: buildSeasonProgressionNotes(careerPlayerStats),
    abilityChangePreview,
  };
};
