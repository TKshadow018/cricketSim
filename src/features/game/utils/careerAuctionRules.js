export const AUCTION_DOMESTIC_POOL_RATIO = 0.85;

export const AUCTION_FOREIGN_POOL_RATIO = 0.15;

export const AUCTION_EQUAL_TEAM_BUDGET = 4200000;

export const AUCTION_MIN_DOMESTIC_PER_TEAM = 15;

export const AUCTION_MAX_DOMESTIC_PER_TEAM = 20;

export const AUCTION_MIN_FOREIGN_PER_TEAM = 5;

export const AUCTION_MAX_FOREIGN_PER_TEAM = 8;

export const AUCTION_MIN_WICKETKEEPERS = 2;

export const AUCTION_MIN_BOWLING_PROFILE = 10;

export const AUCTION_MIN_BATTING_PROFILE = 12;

export const isAuctionWicketkeeper = (player = {}) => {
  const type = String(player?.playerType || '').toLowerCase();
  return Boolean(player?.isWicketKeeper) || type.includes('wicketkeeper');
};

const isAuctionAllrounder = (player = {}) => String(player?.playerType || '').toLowerCase().includes('allrounder');

export const isAuctionBowlingProfile = (player = {}) => {
  const type = String(player?.playerType || '').toLowerCase();
  return isAuctionAllrounder(player) || type.includes('bowler') || type.includes('pacer') || type.includes('spinner') || type.includes('spiner');
};

export const isAuctionBattingProfile = (player = {}) => {
  const type = String(player?.playerType || '').toLowerCase();
  return isAuctionAllrounder(player) || type.includes('batsman');
};

export const updateAuctionRoleCounts = (team, player) => {
  if (isAuctionWicketkeeper(player)) {
    team.roleCounts.wicketkeepers += 1;
  }
  if (isAuctionBowlingProfile(player)) {
    team.roleCounts.bowling += 1;
  }
  if (isAuctionBattingProfile(player)) {
    team.roleCounts.batting += 1;
  }
};

const getAuctionRoleDeficits = (team) => ({
  wicketkeepers: Math.max(0, AUCTION_MIN_WICKETKEEPERS - Number(team?.roleCounts?.wicketkeepers || 0)),
  bowling: Math.max(0, AUCTION_MIN_BOWLING_PROFILE - Number(team?.roleCounts?.bowling || 0)),
  batting: Math.max(0, AUCTION_MIN_BATTING_PROFILE - Number(team?.roleCounts?.batting || 0)),
});

const playerHelpsAuctionDeficit = (team, player) => {
  const deficits = getAuctionRoleDeficits(team);
  return Boolean(
    (deficits.wicketkeepers > 0 && isAuctionWicketkeeper(player)) ||
    (deficits.bowling > 0 && isAuctionBowlingProfile(player)) ||
    (deficits.batting > 0 && isAuctionBattingProfile(player))
  );
};

const countOpenAuctionDeficitTypes = (team) => {
  const deficits = getAuctionRoleDeficits(team);
  return [deficits.wicketkeepers, deficits.bowling, deficits.batting].filter((value) => value > 0).length;
};

export const canTeamSpendOnAuctionPlayer = (team, player) => {
  const openDeficitTypes = countOpenAuctionDeficitTypes(team);

  if (openDeficitTypes > 0) {
    return playerHelpsAuctionDeficit(team, player);
  }

  return true;
};

export const resolveAuctionNeedScore = ({ team, player }) => {
  const { wicketkeepers: wkDeficit, bowling: bowlDeficit, batting: batDeficit } = getAuctionRoleDeficits(team);
  const totalDeficit = wkDeficit + bowlDeficit + batDeficit;

  const helpsWk = isAuctionWicketkeeper(player);
  const helpsBowling = isAuctionBowlingProfile(player);
  const helpsBatting = isAuctionBattingProfile(player);

  const rolePressure =
    (wkDeficit > 0 && helpsWk ? 0.44 : 0) +
    (bowlDeficit > 0 && helpsBowling ? 0.42 : 0) +
    (batDeficit > 0 && helpsBatting ? 0.42 : 0);
  const deficitPenalty = totalDeficit > 0 && !(helpsWk || helpsBowling || helpsBatting) ? 0.32 : 0;
  const domesticNeed = Math.max(0, team.domesticTarget - team.domesticCount) / Math.max(1, team.domesticTarget);
  const foreignNeed = Math.max(0, team.foreignTarget - team.foreignCount) / Math.max(1, team.foreignTarget);

  const hardConstraintBoost = playerHelpsAuctionDeficit(team, player) && totalDeficit > 0 ? 0.35 : 0;

  return rolePressure + hardConstraintBoost + domesticNeed * 0.22 + foreignNeed * 0.18 - deficitPenalty;
};

export const resolveUniqueBidAmount = ({ amount, minBid, maxBid, usedAmounts = new Set(), seed = 0 }) => {
  const safeMin = Number(minBid || 0);
  const safeMax = Number(maxBid || 0);
  const startingPoint = Math.max(safeMin, Math.min(safeMax, Math.round(Number(amount || safeMin) / 100) * 100));
  const offsets = [0];
  for (let step = 1; step <= 24; step += 1) {
    offsets.push(step * 100);
    offsets.push(-step * 100);
  }

  for (let index = 0; index < offsets.length; index += 1) {
    const candidate = startingPoint + offsets[(seed + index) % offsets.length];
    if (candidate >= safeMin && candidate <= safeMax && !usedAmounts.has(candidate)) {
      return candidate;
    }
  }
};
