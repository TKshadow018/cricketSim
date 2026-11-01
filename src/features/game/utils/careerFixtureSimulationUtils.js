import { ensurePlayerMeta, selectAIPlayingXI } from "./controllerCommonUtils";

import { buildMomShortlistFromScorecards } from "./controllerMomUtils";

import { formatScoreRange } from "./careerSeasonScheduleUtils";

import { randomInt } from "./careerPlayerDataUtils";

import { formatCareerMatchLabel } from "./careerPlayerProgressionUtils";

import { buildLastMatchContext, mergeSimulatedTeamStatsFromScorecard, applyDomesticMatchPlayerUpdates } from "./careerMatchUpdateUtils";

import { buildSimulatedInningsCard, buildMatchContributionsFromScorecards, buildCreatedPlayerMatchContribution } from "./careerMatchStatsUtils";
import { simulateHeadlessMatch } from './headlessMatch';
import { simulateHeadlessTestMatch } from './headlessTestMatch';
import { withInningsExtras } from './scorecardExtras';
import { createSeededRandom } from './seededRandom';

export const simulateCareerFixture = ({
  match,
  careerTeam,
  careerPlayerProfile,
  domesticTeams = [],
  existingStats = {},
  seasonNumber = 1,
  previousFixturesByTeam = {},
  ruleset = 'arcade',
  seed,
}) => {
  const [minScore, maxScore] = formatScoreRange[match.format] || [120, 240];
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
  const supportedFormat = ['t20', 'odi', 'firstClass'].includes(match.format);
  const completeRosters = teamARoster.length >= 11 && teamBRoster.length >= 11;
  if (ruleset === 'realism' && supportedFormat && !completeRosters) {
    throw new Error('Both teams need eleven players to simulate a realistic career fixture.');
  }
  const useHeadless = supportedFormat && completeRosters;
  const simulationSeed = useHeadless ? seed ?? Math.floor(Math.random() * 4294967296) : undefined;
  const generator = useHeadless ? createSeededRandom(simulationSeed) : null;
  const random = generator ? generator.next : Math.random;
  const legacyResult = useHeadless ? null : (() => {
    const teamAScore = randomInt(minScore, maxScore);
    const teamBScore = randomInt(minScore, maxScore);
    const winner = teamAScore === teamBScore ? 'Tie' : teamAScore > teamBScore ? match.teamA : match.teamB;
    return {
      winner,
      teamAScore,
      teamBScore,
      summary: winner === 'Tie'
        ? `${formatCareerMatchLabel(match.format)}: ${match.teamA} tied with ${match.teamB}`
        : `${formatCareerMatchLabel(match.format)}: ${winner} won by ${randomInt(1, 8)} ${Math.random() > 0.5 ? 'wickets' : 'runs'}`,
    };
  })();

  const teamAContext = buildLastMatchContext(previousFixturesByTeam?.[match.teamA], match.teamA);
  const teamBContext = buildLastMatchContext(previousFixturesByTeam?.[match.teamB], match.teamB);
  const teamAXIIds = selectAIPlayingXI({
    roster: teamARoster,
    previousXIIds: teamAContext.previousXIIds,
    lastMatchPerformanceById: teamAContext.lastMatchPerformanceById,
    lastMatchPerformanceByName: teamAContext.lastMatchPerformanceByName,
    random,
  });
  const teamBXIIds = selectAIPlayingXI({
    roster: teamBRoster,
    previousXIIds: teamBContext.previousXIIds,
    lastMatchPerformanceById: teamBContext.lastMatchPerformanceById,
    lastMatchPerformanceByName: teamBContext.lastMatchPerformanceByName,
    random,
  });
  const teamAById = new Map(teamARoster.map((player) => [String(player.id), player]));
  const teamBById = new Map(teamBRoster.map((player) => [String(player.id), player]));
  const teamAPlayers = teamAXIIds.map((id) => teamAById.get(String(id))).filter(Boolean).slice(0, 11);
  const teamBPlayers = teamBXIIds.map((id) => teamBById.get(String(id))).filter(Boolean).slice(0, 11);

  const simulationInput = {
    teamA: match.teamA,
    teamB: match.teamB,
    playersA: teamAPlayers,
    playersB: teamBPlayers,
    format: match.format,
    seed: simulationSeed,
    ruleset,
  };
  const simulated = useHeadless
    ? match.format === 'firstClass'
      ? simulateHeadlessTestMatch(simulationInput)
      : simulateHeadlessMatch(simulationInput)
    : null;
  const teamAScore = simulated ? simulated.firstInnings.score : legacyResult.teamAScore;
  const teamBScore = simulated ? simulated.secondInnings.score : legacyResult.teamBScore;
  const teamAWickets = simulated ? simulated.firstInnings.wickets : randomInt(3, Math.max(3, Math.min(10, teamAPlayers.length)));
  const teamBWickets = simulated ? simulated.secondInnings.wickets : randomInt(3, Math.max(3, Math.min(10, teamBPlayers.length)));
  const result = simulated ? {
    winner: simulated.winner,
    teamAScore,
    teamBScore,
    summary: simulated.summary,
    simulationModel: `${ruleset}-v1`,
    simulationSeed: simulated.seed,
  } : legacyResult;
  const teamAScorecard = simulated ? withInningsExtras(simulated.scorecard.previousInnings, simulated.firstInnings) : buildSimulatedInningsCard({
    teamName: match.teamA,
    players: teamAPlayers,
    bowlingPlayers: teamBPlayers,
    score: teamAScore,
    wickets: teamAWickets,
    format: match.format,
  });
  const teamBScorecard = simulated ? withInningsExtras(simulated.scorecard.currentInnings, simulated.secondInnings) : buildSimulatedInningsCard({
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
      { team: match.teamA, bowlingTeam: match.teamB, scorecard: teamAScorecard },
      { team: match.teamB, bowlingTeam: match.teamA, scorecard: teamBScorecard },
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
    random,
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
        ...(simulated?.inningsScorecards ? { innings: simulated.inningsScorecards } : {}),
      },
      momShortlist,
    },
    updatedStats,
    updatedDomesticTeams,
  };
};
