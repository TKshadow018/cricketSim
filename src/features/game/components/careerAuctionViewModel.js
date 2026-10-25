export const buildLiveBudgetRows = ({ budgetRows, timeline, currentIndex, isAtFinalAuctionState }) => {
  if (isAtFinalAuctionState) {
    return budgetRows;
  }

  const baseByTeam = budgetRows.reduce((acc, row) => {
    acc[row.team] = {
      ...row,
      signings: 0,
      spent: 0,
      domesticPlayers: 0,
      foreignPlayers: 0,
      roleCounts: {
        wicketkeepers: 0,
        bowling: 0,
        batting: 0,
      },
    };
    return acc;
  }, {});

  timeline.slice(0, Math.max(0, currentIndex + 1)).forEach((event) => {
    if (!event?.isSold || !event?.winnerTeam || !baseByTeam[event.winnerTeam]) {
      return;
    }

    const row = baseByTeam[event.winnerTeam];
    row.signings += 1;
    row.spent += Number(event.amount || 0);
    if (event.playerCountry && row.country && event.playerCountry === row.country) {
      row.domesticPlayers += 1;
    } else {
      row.foreignPlayers += 1;
    }
    if (event.isWicketkeeperProfile) row.roleCounts.wicketkeepers += 1;
    if (event.isBowlingProfile) row.roleCounts.bowling += 1;
    if (event.isBattingProfile) row.roleCounts.batting += 1;
  });

  return Object.values(baseByTeam)
    .map((row) => ({
      ...row,
      budgetLeft: Math.max(0, Number(row.budgetStart || 0) - Number(row.spent || 0)),
      budgetLeftLabel: `$${Math.max(0, Number(row.budgetStart || 0) - Number(row.spent || 0)).toLocaleString('en-US')}`,
      spentLabel: `$${Number(row.spent || 0).toLocaleString('en-US')}`,
    }))
    .sort((left, right) => Number(right.spent || 0) - Number(left.spent || 0) || String(left.team).localeCompare(String(right.team)));
};

export const buildQuotaSummary = ({ rows, minimumRoleLimits, domesticRange, foreignRange }) => {
  const total = rows.length;
  const passingAll = rows.filter((row) => {
    const wicketkeeperPass = Number(row.roleCounts?.wicketkeepers || 0) >= Number(minimumRoleLimits.wicketkeepers || 2);
    const bowlingPass = Number(row.roleCounts?.bowling || 0) >= Number(minimumRoleLimits.bowlingProfiles || 10);
    const battingPass = Number(row.roleCounts?.batting || 0) >= Number(minimumRoleLimits.battingProfiles || 12);
    const domesticPass = Number(row.domesticPlayers || 0) >= Number(domesticRange[0] || 15) && Number(row.domesticPlayers || 0) <= Number(domesticRange[1] || 20);
    const foreignPass = Number(row.foreignPlayers || 0) >= Number(foreignRange[0] || 5) && Number(row.foreignPlayers || 0) <= Number(foreignRange[1] || 8);
    return wicketkeeperPass && bowlingPass && battingPass && domesticPass && foreignPass;
  }).length;

  return {
    total,
    passingAll,
    failing: Math.max(0, total - passingAll),
  };
};

export const buildTeamMomentumRows = ({ budgetRows, timeline, currentIndex, isAtFinalAuctionState }) => {
  let rows;

  if (isAtFinalAuctionState) {
    rows = budgetRows.map((row) => ({
      team: row.team,
      country: row.country,
      signings: Number(row.signings || 0),
      spend: Number(row.spent || 0),
    }));
  } else {
    const teamMap = budgetRows.reduce((acc, row) => {
      acc[row.team] = {
        team: row.team,
        country: row.country,
        signings: 0,
        spend: 0,
      };
      return acc;
    }, {});

    timeline.slice(0, Math.max(0, currentIndex + 1)).forEach((event) => {
      if (!event?.isSold || !event?.winnerTeam || !teamMap[event.winnerTeam]) {
        return;
      }
      teamMap[event.winnerTeam].signings += 1;
      teamMap[event.winnerTeam].spend += Number(event.amount || 0);
    });

    rows = Object.values(teamMap);
  }

  const maxSpend = Math.max(1, ...rows.map((row) => row.spend));
  return rows
    .map((row) => ({
      ...row,
      heat: Math.min(100, Math.round((row.spend / maxSpend) * 70 + row.signings * 4)),
    }))
    .sort((left, right) => right.heat - left.heat || right.spend - left.spend)
    .slice(0, 8);
};
