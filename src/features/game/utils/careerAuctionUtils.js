import { ensurePlayerMeta, shuffleArray } from "./controllerCommonUtils";

import { normalizeCountryRows, resolveBaseMarketPrice } from "./careerPlayerProgressionUtils";

import { randomInt } from "./careerPlayerDataUtils";

import { AUCTION_MIN_DOMESTIC_PER_TEAM, AUCTION_MAX_DOMESTIC_PER_TEAM, AUCTION_MIN_FOREIGN_PER_TEAM, AUCTION_MAX_FOREIGN_PER_TEAM, AUCTION_EQUAL_TEAM_BUDGET, AUCTION_DOMESTIC_POOL_RATIO, AUCTION_FOREIGN_POOL_RATIO, isAuctionWicketkeeper, isAuctionBowlingProfile, isAuctionBattingProfile, canTeamSpendOnAuctionPlayer, resolveAuctionNeedScore, resolveUniqueBidAmount, updateAuctionRoleCounts, AUCTION_MIN_WICKETKEEPERS, AUCTION_MIN_BOWLING_PROFILE, AUCTION_MIN_BATTING_PROFILE } from "./careerAuctionRules";

import { assignGlobalPoolPlayersToDomesticTeams } from "./careerDomesticTeamUtils";

export const runCareerAuction = ({
  domesticTeams = [],
  globalPlayerPool = [],
  countryRows = [],
  leagueCountry = '',
  careerPlayer = null,
  maxSummaryEvents = 140,
}) => {
  const rankingByCountry = normalizeCountryRows(countryRows).reduce((acc, country) => {
    acc[country.name] = Number(country.current_ranking || 999);
    return acc;
  }, {});

  const leagueTeams = (domesticTeams || []).filter((team) => !leagueCountry || team.country === leagueCountry);
  const nonLeagueTeams = (domesticTeams || []).filter((team) => !leagueTeams.find((leagueTeam) => leagueTeam.id === team.id));

  const teams = leagueTeams.map((team) => {
    const domesticTarget = randomInt(AUCTION_MIN_DOMESTIC_PER_TEAM, AUCTION_MAX_DOMESTIC_PER_TEAM);
    const foreignTarget = randomInt(AUCTION_MIN_FOREIGN_PER_TEAM, AUCTION_MAX_FOREIGN_PER_TEAM);
    const squadTarget = domesticTarget + foreignTarget;
    const nationalPlayers = (team.players || [])
      .filter((player) => player?.isNationalTeamPlayer)
      .map((player) =>
        ensurePlayerMeta({
          ...player,
          assignedTeamId: team.id,
          assignedTeamName: team.name,
        })
      );
    const roleCounts = {
      wicketkeepers: 0,
      bowling: 0,
      batting: 0,
    };
    const initialTeamState = { roleCounts };
    nationalPlayers.forEach((player) => updateAuctionRoleCounts(initialTeamState, player));
    const domesticCount = nationalPlayers.filter((player) => player.country === team.country).length;
    const foreignCount = nationalPlayers.length - domesticCount;

    return {
      ...team,
      players: nationalPlayers,
      countryRank: Number(rankingByCountry[team.country] || team.countryRank || 999),
      domesticTarget,
      foreignTarget,
      squadTarget,
      domesticCount,
      foreignCount,
      roleCounts,
      budgetStart: AUCTION_EQUAL_TEAM_BUDGET,
      budget: AUCTION_EQUAL_TEAM_BUDGET,
      spent: 0,
      signings: 0,
    };
  });

  const poolWithMeta = (globalPlayerPool || []).map((player) => {
    const normalized = ensurePlayerMeta(player);
    const abilityScore = Number(
      player?.abilityScore ||
      normalized.abilityToPlayPaceBall +
        normalized.abilityToPlaySpinBall +
        normalized.battingAggresion +
        normalized.paceAbility +
        normalized.spinAbility
    );
    return {
      ...normalized,
      sourceCountry: player?.sourceCountry || normalized.country,
      countryRank: Number(player?.countryRank || rankingByCountry[normalized.country] || 999),
      baseMarketPrice: Number(player?.baseMarketPrice || resolveBaseMarketPrice(normalized)),
      abilityScore,
      assignedTeamId: '',
      assignedTeamName: '',
      isCareerPlayer: false,
    };
  });

  if (careerPlayer?.id) {
    poolWithMeta.push({
      ...ensurePlayerMeta(careerPlayer),
      sourceCountry: careerPlayer.country || leagueCountry,
      countryRank: Number(rankingByCountry[careerPlayer.country] || rankingByCountry[leagueCountry] || 999),
      baseMarketPrice: Number(resolveBaseMarketPrice(careerPlayer) * 1.18),
      abilityScore:
        Number(careerPlayer.abilityToPlayPaceBall || 0) +
        Number(careerPlayer.abilityToPlaySpinBall || 0) +
        Number(careerPlayer.battingAggresion || 0) +
        Number(careerPlayer.paceAbility || 0) +
        Number(careerPlayer.spinAbility || 0),
      assignedTeamId: '',
      assignedTeamName: '',
      isCareerPlayer: true,
    });
  }

  const domesticPoolCandidates = shuffleArray(
    poolWithMeta.filter((player) => !player.isCareerPlayer && player.country === leagueCountry)
  );
  const foreignPoolCandidates = shuffleArray(
    poolWithMeta.filter((player) => !player.isCareerPlayer && player.country !== leagueCountry)
  );
  const totalSlots = teams.reduce((sum, team) => sum + team.squadTarget, 0);
  const desiredDomesticCount = Math.max(teams.length, Math.round(totalSlots * AUCTION_DOMESTIC_POOL_RATIO));
  const desiredForeignCount = Math.max(teams.length, Math.round(totalSlots * AUCTION_FOREIGN_POOL_RATIO));

  const selectedDomestic = domesticPoolCandidates.slice(0, Math.min(domesticPoolCandidates.length, desiredDomesticCount));
  const selectedForeign = foreignPoolCandidates.slice(0, Math.min(foreignPoolCandidates.length, desiredForeignCount));
  const selectedPoolIds = new Set([...selectedDomestic, ...selectedForeign].map((player) => String(player.id)));
  const reservePool = shuffleArray(
    poolWithMeta.filter((player) => !player.isCareerPlayer && !selectedPoolIds.has(String(player.id)))
  );

  let auctionPool = shuffleArray([...selectedDomestic, ...selectedForeign]);
  if (careerPlayer?.id) {
    const careerEntry = poolWithMeta.find((player) => String(player.id) === String(careerPlayer.id));
    auctionPool = [careerEntry, ...auctionPool];
  }

  const auctionTimeline = [];
  const allTeamsFilled = () => teams.every((team) => team.players.length >= team.squadTarget);

  const runNomination = (player, nominationIndex) => {
    if (!player || allTeamsFilled()) {
      return;
    }

    const basePrice = Math.max(70000, Number(player.baseMarketPrice || 80000));
    const minBid = Math.round((basePrice * 0.7) / 500) * 500;
    const maxBid = Math.round((basePrice * 1.3) / 500) * 500;
    const abilityScore = Number(player.abilityScore || 0);
    const demandBonus = abilityScore >= 305 ? 0.34 : abilityScore >= 280 ? 0.2 : abilityScore >= 250 ? 0.08 : 0;
    const isElite = abilityScore >= 310;
    const isTop = abilityScore >= 285;
    const isSolid = abilityScore >= 245;
    const targetBidderCount = isElite
      ? randomInt(Math.min(5, teams.length), Math.min(10, teams.length))
      : isTop
        ? randomInt(Math.min(2, teams.length), Math.min(6, teams.length))
        : isSolid
          ? randomInt(0, Math.min(4, teams.length))
          : randomInt(0, Math.min(2, teams.length));
    const minimumCareerBidderCount = player?.isCareerPlayer ? 1 : 0;
    const effectiveBidderCount = Math.max(minimumCareerBidderCount, targetBidderCount);

    if (effectiveBidderCount <= 0) {
      auctionTimeline.push({
        index: nominationIndex,
        playerId: player.id,
        playerName: player.name,
        playerType: player.playerType || '',
        playerCountry: player.country,
        abilityScore,
        basePrice,
        basePriceLabel: `$${Number(basePrice || 0).toLocaleString('en-US')}`,
        isWicketkeeperProfile: isAuctionWicketkeeper(player),
        isBowlingProfile: isAuctionBowlingProfile(player),
        isBattingProfile: isAuctionBattingProfile(player),
        winnerTeam: '',
        winnerCountry: '',
        amount: 0,
        amountLabel: '',
        isSold: false,
        isCareerPlayer: !!player.isCareerPlayer,
        bids: [],
      });
      return;
    }

    let interestedBids = teams
      .filter((team) => team.players.length < team.squadTarget)
      .filter((team) => team.budget >= minBid)
      .filter((team) => {
        const isDomesticForTeam = player.country === team.country;
        if (isDomesticForTeam) {
          return team.domesticCount < team.domesticTarget;
        }
        return team.foreignCount < team.foreignTarget;
      })
      .filter((team) => canTeamSpendOnAuctionPlayer(team, player))
      .map((team) => {
        const needScore = resolveAuctionNeedScore({ team, player });
        const normalizedAbility = Math.max(0.18, Math.min(1.2, abilityScore / 330));
        const interest = 0.45 + normalizedAbility * 0.45 + demandBonus + needScore + Math.random() * 0.35;
        const shouldBid = interest >= (isElite ? 0.56 : isTop ? 0.66 : isSolid ? 0.76 : 0.84);
        if (!shouldBid) {
          return null;
        }

        const rawMultiplier = 0.7 + Math.random() * 0.6 + (interest - 0.8) * 0.08;
        const clampedMultiplier = Math.max(0.7, Math.min(1.3, rawMultiplier));
        const amount = Math.max(minBid, Math.min(team.budget, maxBid, Math.round((basePrice * clampedMultiplier) / 500) * 500));

        return {
          team,
          amount,
          interest,
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.amount - left.amount || right.interest - left.interest);

    if (player?.isCareerPlayer && !interestedBids.length) {
      const forcedTeam = teams
        .filter((team) => team.players.length < team.squadTarget)
        .filter((team) => {
          const isDomesticForTeam = player.country === team.country;
          if (isDomesticForTeam) {
            return team.domesticCount < team.domesticTarget;
          }
          return team.foreignCount < team.foreignTarget;
        })
        .sort((left, right) => Number(right.budget || 0) - Number(left.budget || 0))[0] || null;

      if (forcedTeam) {
        interestedBids = [{
          team: forcedTeam,
          amount: Math.max(minBid, Math.min(maxBid, Math.min(Number(forcedTeam.budget || 0), Math.round(basePrice / 500) * 500))),
          interest: 1,
        }];
      }
    }

    const bids = [];
    const usedBidAmounts = new Set();
    const selectedBidders = interestedBids.slice(0, effectiveBidderCount);
    const topAnchor = Math.max(
      minBid,
      Math.min(maxBid, Math.round((selectedBidders[0]?.amount || basePrice) / 500) * 500)
    );
    const gapStep = Math.max(500, Math.round((basePrice * 0.035) / 500) * 500);

    selectedBidders.forEach((bid, bidIndex) => {
      const baseCandidate = Math.max(
        minBid,
        Math.min(maxBid, topAnchor - bidIndex * gapStep - (bidIndex > 0 ? randomInt(0, 2) * 100 : 0))
      );
      const uniqueAmount = resolveUniqueBidAmount({
        amount: baseCandidate,
        minBid,
        maxBid,
        usedAmounts: usedBidAmounts,
        seed: nominationIndex * 31 + bidIndex,
      });
      usedBidAmounts.add(uniqueAmount);
      bids.push({
        ...bid,
        amount: uniqueAmount,
      });
    });

    const winnerBid = bids[0] || null;
    if (winnerBid) {
      const winnerTeam = winnerBid.team;
      const assignedPlayer = ensurePlayerMeta(player);
      winnerTeam.players.push(assignedPlayer);
      winnerTeam.budget = Math.max(0, winnerTeam.budget - winnerBid.amount);
      winnerTeam.spent += winnerBid.amount;
      winnerTeam.signings += 1;
      if (player.country === winnerTeam.country) {
        winnerTeam.domesticCount += 1;
      } else {
        winnerTeam.foreignCount += 1;
      }
      updateAuctionRoleCounts(winnerTeam, player);
      player.assignedTeamId = winnerTeam.id;
      player.assignedTeamName = winnerTeam.name;
    }

    auctionTimeline.push({
      index: nominationIndex,
      playerId: player.id,
      playerName: player.name,
      playerType: player.playerType || '',
      playerCountry: player.country,
      abilityScore,
      basePrice,
      basePriceLabel: `$${Number(basePrice || 0).toLocaleString('en-US')}`,
      isWicketkeeperProfile: isAuctionWicketkeeper(player),
      isBowlingProfile: isAuctionBowlingProfile(player),
      isBattingProfile: isAuctionBattingProfile(player),
      winnerTeam: winnerBid?.team?.name || '',
      winnerCountry: winnerBid?.team?.country || '',
      amount: winnerBid?.amount || 0,
      amountLabel: winnerBid ? `$${Number(winnerBid.amount || 0).toLocaleString('en-US')}` : '',
      isSold: Boolean(winnerBid),
      isCareerPlayer: !!player.isCareerPlayer,
      bids: bids.slice(0, 8).map((entry) => ({
        team: entry.team.name,
        country: entry.team.country,
        amount: entry.amount,
      })),
    });
  };

  let nominationIndex = 1;
  auctionPool.forEach((player) => {
    runNomination(player, nominationIndex);
    nominationIndex += 1;
  });

  while (!allTeamsFilled() && reservePool.length) {
    const reservePlayer = reservePool.shift();
    runNomination(reservePlayer, nominationIndex);
    nominationIndex += 1;
  }

  const fallbackUnassigned = shuffleArray(
    poolWithMeta.filter((player) => !player.assignedTeamId && !player.isCareerPlayer)
  );

  teams.forEach((team) => {
    while (team.players.length < team.squadTarget && fallbackUnassigned.length) {
      const preferredIndex = fallbackUnassigned.findIndex((player) => {
        const isDomestic = player.country === team.country;
        const categoryFits = isDomestic ? team.domesticCount < team.domesticTarget : team.foreignCount < team.foreignTarget;
        return categoryFits && canTeamSpendOnAuctionPlayer(team, player);
      });
      const nextIndex = preferredIndex >= 0
        ? preferredIndex
        : fallbackUnassigned.findIndex((player) => {
            const isDomestic = player.country === team.country;
            if (isDomestic) {
              return team.domesticCount < team.domesticTarget;
            }
            return team.foreignCount < team.foreignTarget;
          });
      if (nextIndex < 0) {
        break;
      }
      const [nextPlayer] = fallbackUnassigned.splice(nextIndex, 1);
      const fallbackAmount = Math.max(50000, Math.round((Number(nextPlayer.baseMarketPrice || 80000) * 0.7) / 500) * 500);
      const actualSpend = Math.min(Number(team.budget || 0), fallbackAmount);
      team.players.push(ensurePlayerMeta(nextPlayer));
      team.spent += actualSpend;
      team.budget = Math.max(0, team.budget - actualSpend);
      team.signings += 1;
      if (nextPlayer.country === team.country) {
        team.domesticCount += 1;
      } else {
        team.foreignCount += 1;
      }
      updateAuctionRoleCounts(team, nextPlayer);
      nextPlayer.assignedTeamId = team.id;
      nextPlayer.assignedTeamName = team.name;
    }
  });

  const remainingUnassigned = poolWithMeta.filter((player) => !player.assignedTeamId && !player.isCareerPlayer);
  const nonLeagueAssignment = assignGlobalPoolPlayersToDomesticTeams({
    domesticTeams: nonLeagueTeams,
    globalPlayerPool: remainingUnassigned,
    countryRows,
  });

  const updatedTeams = [
    ...teams.map((team) => ({
      ...team,
      players: team.players,
    })),
    ...(nonLeagueAssignment.domesticTeams || []),
  ];

  const updatedGlobalPool = poolWithMeta
    .filter((player) => !player.isCareerPlayer)
    .map((player) => ({
      ...player,
      assignedTeamId: player.assignedTeamId || '',
      assignedTeamName: player.assignedTeamName || '',
    }));

  const domesticAuctionTeams = teams;
  const fallbackCareerTeam = domesticAuctionTeams[0]?.name || updatedTeams[0]?.name || '';
  const careerPlayerEvent = auctionTimeline.find((event) => event.isCareerPlayer && event.isSold);
  const resolvedCareerTeam = careerPlayerEvent?.winnerTeam || fallbackCareerTeam;

  const budgetTable = domesticAuctionTeams
    .map((team) => {
      const budgetStart = Number(team.budgetStart || 0);
      const budgetLeft = Math.max(0, Number(team.budget || 0));
      const spent = Math.max(0, budgetStart - budgetLeft);
      return {
        team: team.name,
        country: team.country,
        budgetStart,
        budgetLeft,
        spent,
        signings: team.signings,
        domesticPlayers: team.domesticCount,
        foreignPlayers: team.foreignCount,
        domesticTarget: team.domesticTarget,
        foreignTarget: team.foreignTarget,
        targetSize: team.squadTarget,
        roleCounts: {
          wicketkeepers: team.roleCounts.wicketkeepers,
          bowling: team.roleCounts.bowling,
          batting: team.roleCounts.batting,
        },
        averageSpend: team.signings > 0 ? Math.round(spent / team.signings) : 0,
        budgetStartLabel: `$${budgetStart.toLocaleString('en-US')}`,
        budgetLeftLabel: `$${budgetLeft.toLocaleString('en-US')}`,
        spentLabel: `$${spent.toLocaleString('en-US')}`,
      };
    })
    .sort((left, right) => right.spent - left.spent || left.team.localeCompare(right.team));

  const marqueeBids = [...auctionTimeline]
    .filter((event) => event.isSold)
    .sort((left, right) => right.amount - left.amount || right.abilityScore - left.abilityScore)
    .slice(0, Math.max(20, Number(maxSummaryEvents || 140)));

  return {
    domesticTeams: updatedTeams,
    globalPlayerPool: nonLeagueAssignment.globalPlayerPool || updatedGlobalPool,
    careerTeam: resolvedCareerTeam,
    auctionSummary: {
      leagueCountry,
      teamCount: domesticAuctionTeams.length,
      totalPlayersAuctioned: poolWithMeta.filter((player) => player.assignedTeamId).length,
      playerPoolComposition: {
        domesticRatio: AUCTION_DOMESTIC_POOL_RATIO,
        foreignRatio: AUCTION_FOREIGN_POOL_RATIO,
      },
      teamRules: {
        domesticPerTeam: [AUCTION_MIN_DOMESTIC_PER_TEAM, AUCTION_MAX_DOMESTIC_PER_TEAM],
        foreignPerTeam: [AUCTION_MIN_FOREIGN_PER_TEAM, AUCTION_MAX_FOREIGN_PER_TEAM],
        equalBudget: AUCTION_EQUAL_TEAM_BUDGET,
        bidRangePercent: [-30, 30],
        minimumRoleLimits: {
          wicketkeepers: AUCTION_MIN_WICKETKEEPERS,
          bowlingProfiles: AUCTION_MIN_BOWLING_PROFILE,
          battingProfiles: AUCTION_MIN_BATTING_PROFILE,
        },
      },
      auctionTimeline,
      marqueeBids,
      budgetTable,
      careerPlayerEvent: careerPlayerEvent || null,
    },
  };
};

const formatOfferAmount = (amount) => `$${Number(amount).toLocaleString('en-US')}`;

export const buildCareerOffers = (domesticTeams = [], count = 3) => {
  const selectedTeams = shuffleArray(domesticTeams).slice(0, Math.min(count, domesticTeams.length));
  const baseAmount = randomInt(240000, 325000);
  const increments = [randomInt(7000, 11000), randomInt(12000, 17000), randomInt(19000, 25000)];
  const uniqueAmounts = increments
    .map((offset, index) => baseAmount + offset + index * 137)
    .sort((left, right) => left - right);

  return selectedTeams.map((team, index) => {
    const amount = uniqueAmounts[index] || baseAmount + index * 10000;
    return {
      team: team.name,
      location: team.location || '',
      country: team.country || '',
      amount,
      amountLabel: formatOfferAmount(amount),
    };
  });
};
