import { ensurePlayerMeta, selectAIPlayingXI } from "./controllerCommonUtils";

import { buildMomShortlistFromScorecards } from "./controllerMomUtils";

import { formatScoreRange } from "./careerSeasonScheduleUtils";

import { randomInt } from "./careerPlayerDataUtils";

import { formatCareerMatchLabel } from "./careerPlayerProgressionUtils";

import { buildLastMatchContext, mergeSimulatedTeamStatsFromScorecard, applyDomesticMatchPlayerUpdates } from "./careerMatchUpdateUtils";

import { buildSimulatedInningsCard, buildMatchContributionsFromScorecards, buildCreatedPlayerMatchContribution } from "./careerMatchStatsUtils";

export const simulateCareerFixture = ({
  match,
  careerTeam,
  careerPlayerProfile,
  domesticTeams = [],
  existingStats = {},
  seasonNumber = 1,
  previousFixturesByTeam = {},
}) => {
  const [minScore, maxScore] = formatScoreRange[match.format] || [120, 240];
  const teamAScore = randomInt(minScore, maxScore);
  const teamBScore = randomInt(minScore, maxScore);
  const winner = teamAScore === teamBScore ? 'Tie' : teamAScore > teamBScore ? match.teamA : match.teamB;
  const result = {
    winner,
    teamAScore,
    teamBScore,
    summary:
      winner === 'Tie'
        ? `${formatCareerMatchLabel(match.format)}: ${match.teamA} tied with ${match.teamB}`
        : `${formatCareerMatchLabel(match.format)}: ${winner} won by ${randomInt(1, 8)} ${Math.random() > 0.5 ? 'wickets' : 'runs'}`,
  };

  const updatedStats = { ...(existingStats || {}) };
  const domesticByName = (domesticTeams || []).reduce((acc, team) => {
    if (team?.name) {
      acc[team.name] = team;
    }
    return acc;
  }, {});
  const teamARoster = Array.isArray(domesticByName[match.teamA]?.players)
    ? domesticByName[match.teamA].players.map((player) => ensurePlayerMeta(player))
    : [];
  const teamBRoster = Array.isArray(domesticByName[match.teamB]?.players)
    ? domesticByName[match.teamB].players.map((player) => ensurePlayerMeta(player))
    : [];

  const teamAContext = buildLastMatchContext(previousFixturesByTeam?.[match.teamA], match.teamA);
  const teamBContext = buildLastMatchContext(previousFixturesByTeam?.[match.teamB], match.teamB);
  const teamAXIIds = selectAIPlayingXI({
    roster: teamARoster,
    previousXIIds: teamAContext.previousXIIds,
    lastMatchPerformanceById: teamAContext.lastMatchPerformanceById,
    lastMatchPerformanceByName: teamAContext.lastMatchPerformanceByName,
  });
  const teamBXIIds = selectAIPlayingXI({
    roster: teamBRoster,
    previousXIIds: teamBContext.previousXIIds,
    lastMatchPerformanceById: teamBContext.lastMatchPerformanceById,
    lastMatchPerformanceByName: teamBContext.lastMatchPerformanceByName,
  });
  const teamAById = new Map(teamARoster.map((player) => [String(player.id), player]));
  const teamBById = new Map(teamBRoster.map((player) => [String(player.id), player]));
  const teamAPlayers = teamAXIIds.map((id) => teamAById.get(String(id))).filter(Boolean).slice(0, 11);
  const teamBPlayers = teamBXIIds.map((id) => teamBById.get(String(id))).filter(Boolean).slice(0, 11);

  const teamAWickets = randomInt(3, Math.max(3, Math.min(10, teamAPlayers.length)));
  const teamBWickets = randomInt(3, Math.max(3, Math.min(10, teamBPlayers.length)));

  const teamAScorecard = buildSimulatedInningsCard({
    teamName: match.teamA,
    players: teamAPlayers,
    bowlingPlayers: teamBPlayers,
    score: teamAScore,
    wickets: teamAWickets,
    format: match.format,
  });
  const teamBScorecard = buildSimulatedInningsCard({
    teamName: match.teamB,
    players: teamBPlayers,
    bowlingPlayers: teamAPlayers,
    score: teamBScore,
    wickets: teamBWickets,
    format: match.format,
  });

  mergeSimulatedTeamStatsFromScorecard({
    updatedStats,
    teamName: match.teamA,
    teamPlayers: teamAPlayers,
    battingCard: teamAScorecard,
    opponentBattingCard: teamBScorecard,
    seasonNumber,
    format: match.format,
  });

  mergeSimulatedTeamStatsFromScorecard({
    updatedStats,
    teamName: match.teamB,
    teamPlayers: teamBPlayers,
    battingCard: teamBScorecard,
    opponentBattingCard: teamAScorecard,
    seasonNumber,
    format: match.format,
  });

  const momShortlist = buildMomShortlistFromScorecards({
    cards: [
      { team: match.teamA, scorecard: teamAScorecard },
      { team: match.teamB, scorecard: teamBScorecard },
    ],
  });
  const matchContributionsByTeam = buildMatchContributionsFromScorecards({
    teamAName: match.teamA,
    teamBName: match.teamB,
    teamAScorecard,
    teamBScorecard,
  });
  const updatedDomesticTeams = applyDomesticMatchPlayerUpdates({
    domesticTeams,
    teamAName: match.teamA,
    teamBName: match.teamB,
    teamAXIIds: teamAPlayers.map((player) => player.id),
    teamBXIIds: teamBPlayers.map((player) => player.id),
    momShortlist,
    matchContributionsByTeam,
  });

  if (!teamAPlayers.length && !teamBPlayers.length && match.isUserMatch && careerPlayerProfile?.name) {
    const key = `career-player-${careerPlayerProfile.name.toLowerCase().replace(/\s+/g, '-')}`;
    const previous = updatedStats[key] || {
      key,
      team: careerTeam,
      name: careerPlayerProfile.name,
      runs: 0,
      outs: 0,
      wickets: 0,
      balls: 0,
      ballsBowled: 0,
      runsConceded: 0,
      matches: 0,
      season: seasonNumber,
    };
    const delta = buildCreatedPlayerMatchContribution(match.format);
    updatedStats[key] = {
      ...previous,
      team: careerTeam,
      season: seasonNumber,
      runs: previous.runs + delta.runs,
      outs: previous.outs + delta.outs,
      wickets: previous.wickets + delta.wickets,
      balls: previous.balls + delta.balls,
      ballsBowled: previous.ballsBowled + delta.ballsBowled,
      runsConceded: previous.runsConceded + delta.runsConceded,
      matches: previous.matches + 1,
    };
  }

  return {
    result: {
      ...result,
      teamAWickets,
      teamBWickets,
      scorecard: {
        currentInnings: teamBScorecard,
        previousInnings: teamAScorecard,
      },
      momShortlist,
    },
    updatedStats,
    updatedDomesticTeams,
  };
};
