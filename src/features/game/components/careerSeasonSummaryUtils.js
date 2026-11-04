export const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;

export const buildSeasonPlayerIndex = ({ careerDomesticTeams, careerPlayerStats, careerPlayerProfile, currentAge }) => {
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

      const battingAverage = Number(entry.outs || 0) > 0 ? Number(entry.runs || 0) / Number(entry.outs) : Number(entry.runs || 0);
      const strikeRate = Number(entry.balls || 0) > 0 ? (Number(entry.runs || 0) * 100) / Number(entry.balls) : 0;
      const bowlingAverage = Number(entry.wickets || 0) > 0 ? Number(entry.runsConceded || 0) / Number(entry.wickets) : 999;
      const economy = Number(entry.ballsBowled || 0) > 0 ? (Number(entry.runsConceded || 0) * 6) / Number(entry.ballsBowled) : 99;
      const resolvedAge =
        careerPlayerProfile?.playerId !== undefined &&
        careerPlayerProfile?.playerId !== null &&
        String(entry.playerId) === String(careerPlayerProfile.playerId)
          ? currentAge
          : Number(rosterPlayer?.age || 25);

      return {
        ...entry,
        player: rosterPlayer || {
          id: entry.playerId,
          name: entry.name,
          playerType: entry.playerType,
          isWicketKeeper: entry.isWicketKeeper,
        },
        battingAverage,
        strikeRate,
        bowlingAverage,
        economy,
        age: resolvedAge,
      };
    });
};

export const buildMomAwardsMap = (careerSchedule = []) => {
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

export const resolveSeasonAwards = (players, momAwardsMap) => {
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
      String(left.name).localeCompare(String(right.name))
  )[0] || null;

  const bestBowler = [...withMomCounts].sort(
    (left, right) =>
      Number(right.wickets || 0) - Number(left.wickets || 0) ||
      left.bowlingAverage - right.bowlingAverage ||
      left.economy - right.economy ||
      String(left.name).localeCompare(String(right.name))
  )[0] || null;

  const youngPlayer = [...withMomCounts]
    .filter((entry) => Number(entry.age) < 23)
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
      winner: bestBatsman,
      summary: bestBatsman ? `${bestBatsman.runs} runs (avg ${bestBatsman.battingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'best-bowler',
      title: 'Best Bowler',
      winner: bestBowler,
      summary: bestBowler ? `${bestBowler.wickets} wickets (avg ${bestBowler.bowlingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'young-player',
      title: 'Young Player of the Year (U23)',
      winner: youngPlayer,
      summary: youngPlayer
        ? `${youngPlayer.runs} runs, ${youngPlayer.wickets} wickets, age ${youngPlayer.age}`
        : 'No eligible under-23 player',
    },
    {
      id: 'player-of-year',
      title: 'Player of the Year',
      winner: playerOfYear,
      summary: playerOfYear ? `Impact score ${Math.round(playerOfYear.allRoundScore)}` : 'No winner',
    },
    {
      id: 'most-mom',
      title: 'Most Man of the Match Awards',
      winner: mostMom,
      summary: mostMom ? `${mostMom.momAwards} awards` : 'No MOM awards recorded',
    },
  ];
};
