import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { MODE_CAREER } from '../../utils/controllerCommonUtils';
import { buildCareerMatchScorecard, mergePlayerStatsForCurrentMatch } from '../../utils/controllerCareerUtils';
import { buildMomRecommendations } from '../../utils/controllerMomUtils';
import { applyDomesticMatchPlayerUpdates, buildCareerStandings, simulateCareerFixture } from '../../utils/controllerCareerScheduleUtils';
import { buildCareerTransferOffers } from "./controllerCareerMarketUtils";
import { syncCareerPlayerProfile } from "./controllerCareerSetupUtils";
import { getLatestCompletedFixtureForTeam } from "./controllerCareerFixtureUtils";
import { buildTeamContributionsFromInnings } from "./controllerCareerSeasonUtils";

export const createCareerMatchHandlers = ({
  dispatch,
  gameMode,
  stage,
  careerTeam,
  careerPlayerProfile,
  careerDomesticTeams,
  careerRetired,
  careerSeason,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  firstBattingSide,
  firstInnings,
  secondInnings,
  firstInningsTeamName,
  secondInningsTeamName,
  resultSummary,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  careerResultCommitSignatureRef,
  setCareerPlayerProfileAction,
  setCareerDomesticTeamsAction,
  setCareerOffersAction,
  setCareerMatchIndexAction,
  setCareerScheduleAction,
  setCareerStandingsAction,
  setCareerPlayerStatsAction,
  setStageAction,
  launchCareerFixture,
}) => {
const handleCareerStartNextMatch = () => {
    if (careerRetired) return;
    let schedule = [...(careerSchedule || [])];
    if (!schedule.length) return;

    let updatedStats = { ...(careerPlayerStats || {}) };
    let updatedDomesticTeams = careerDomesticTeams;

    let index = schedule.findIndex((match) => !match.isComplete);
    if (index < 0) {
      dispatch(setCareerScheduleAction(schedule));
      dispatch(setCareerPlayerStatsAction(updatedStats));
      dispatch(setCareerDomesticTeamsAction(updatedDomesticTeams));
      dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, schedule, updatedDomesticTeams)));
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
      return;
    }

    while (index < schedule.length) {
      const match = schedule[index];
      if (match.isComplete) {
        index += 1;
        continue;
      }

      const isUserFixture = match.isUserMatch || match.teamA === careerTeam || match.teamB === careerTeam;
      if (isUserFixture) {
        launchCareerFixture(match, schedule, updatedStats, updatedDomesticTeams);
        break;
      }

      const previousFixturesByTeam = {
        [match.teamA]: getLatestCompletedFixtureForTeam(schedule, match.teamA, index),
        [match.teamB]: getLatestCompletedFixtureForTeam(schedule, match.teamB, index),
      };

      const { result, updatedStats: statsAfterMatch, updatedDomesticTeams: teamsAfterMatch } = simulateCareerFixture({
        match,
        careerTeam,
        careerPlayerProfile,
        domesticTeams: updatedDomesticTeams,
        existingStats: updatedStats,
        seasonNumber: careerSeason,
        previousFixturesByTeam,
      });
      updatedStats = statsAfterMatch;
      updatedDomesticTeams = teamsAfterMatch;
      schedule[index] = { ...match, isComplete: true, result };
      index += 1;
    }

    const currentPendingIndex = schedule.findIndex((match) => !match.isComplete);
    if (currentPendingIndex >= 0 && schedule[currentPendingIndex]?.isUserMatch) {
      return;
    }

    const nextPendingIndex = schedule.findIndex((match) => !match.isComplete);
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerPlayerStatsAction(updatedStats));
    dispatch(setCareerDomesticTeamsAction(updatedDomesticTeams));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: updatedDomesticTeams,
          careerTeam,
          careerPlayerProfile,
        })
      )
    );
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, schedule, updatedDomesticTeams)));
    dispatch(setCareerMatchIndexAction(nextPendingIndex >= 0 ? nextPendingIndex : schedule.length));

    if (nextPendingIndex < 0) {
      const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
      dispatch(
        setCareerOffersAction(
          buildCareerTransferOffers({
            careerTeam,
            careerDomesticTeams: updatedDomesticTeams,
            careerPlayerProfile,
            careerPlayerStats: updatedStats,
            currentAge,
            careerStandings: buildCareerStandings(careerTeam, schedule, updatedDomesticTeams),
          })
        )
      );
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
    }
  };

const commitCareerMatchResult = () => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnum.MatchEnd) {
      return { didCommit: false, seasonComplete: false };
    }

    const currentFixtureFromIndex =
      Number.isInteger(careerMatchIndex) && careerMatchIndex >= 0
        ? (careerSchedule || [])[careerMatchIndex]
        : null;
    const hasCurrentTeams =
      !!firstInningsTeamName &&
      !!secondInningsTeamName &&
      [firstInningsTeamName, secondInningsTeamName].every((name) =>
        [currentFixtureFromIndex?.teamA, currentFixtureFromIndex?.teamB].includes(name)
      );

    const pendingUserMatch =
      currentFixtureFromIndex && !currentFixtureFromIndex.isComplete && (currentFixtureFromIndex.isUserMatch || hasCurrentTeams)
        ? currentFixtureFromIndex
        : (careerSchedule || []).find(
            (fixture) =>
              !fixture.isComplete &&
              (fixture.isUserMatch || fixture.teamA === careerTeam || fixture.teamB === careerTeam) &&
              [firstInningsTeamName, secondInningsTeamName].every((name) => [fixture.teamA, fixture.teamB].includes(name))
          ) ||
          (careerSchedule || []).find(
            (fixture) => !fixture.isComplete && (fixture.isUserMatch || fixture.teamA === careerTeam || fixture.teamB === careerTeam)
          );

    if (!pendingUserMatch) {
      return { didCommit: false, seasonComplete: false };
    }

    const signature = [
      pendingUserMatch.id,
      firstInnings.score,
      firstInnings.wickets,
      firstInnings.balls,
      secondInnings.score,
      secondInnings.wickets,
      secondInnings.balls,
      resultSummary,
    ].join('|');
    if (careerResultCommitSignatureRef?.current === signature) {
      const alreadyCompleted = (careerSchedule || []).every((fixture) => fixture.isComplete);
      return { didCommit: false, seasonComplete: alreadyCompleted };
    }

    if (careerResultCommitSignatureRef) {
      careerResultCommitSignatureRef.current = signature;
    }

    let winner = 'Tie';
    if (secondInnings.score > firstInnings.score) {
      winner = secondInningsTeamName;
    } else if (secondInnings.score < firstInnings.score) {
      winner = firstInningsTeamName;
    }

    const scorecard = buildCareerMatchScorecard({
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
      firstInningsTeamName,
      secondInningsTeamName,
    });

    const momShortlist = buildMomRecommendations({
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      firstInnings,
      secondInnings,
      ownTeam,
      opponentTeam,
      firstInningsTeamName,
      secondInningsTeamName,
      ownSanitizedRoles: {
        captainId: ownPlayers[0]?.id ?? null,
        viceCaptainId: ownPlayers[1]?.id ?? ownPlayers[0]?.id ?? null,
        wicketKeeperId: ownPlayers.find((player) => player.isWicketKeeper)?.id ?? ownPlayers[0]?.id ?? null,
      },
      opponentSanitizedRoles: {
        captainId: opponentPlayers[0]?.id ?? null,
        viceCaptainId: opponentPlayers[1]?.id ?? opponentPlayers[0]?.id ?? null,
        wicketKeeperId: opponentPlayers.find((player) => player.isWicketKeeper)?.id ?? opponentPlayers[0]?.id ?? null,
      },
    });

    const updatedSchedule = (careerSchedule || []).map((fixture) =>
      fixture.id === pendingUserMatch.id
        ? {
            ...fixture,
            isComplete: true,
            result: {
              winner,
              teamAScore: fixture.teamA === firstInningsTeamName ? firstInnings.score : secondInnings.score,
              teamBScore: fixture.teamB === firstInningsTeamName ? firstInnings.score : secondInnings.score,
              teamAWickets: fixture.teamA === firstInningsTeamName ? firstInnings.wickets : secondInnings.wickets,
              teamBWickets: fixture.teamB === firstInningsTeamName ? firstInnings.wickets : secondInnings.wickets,
              summary: resultSummary,
              scorecard,
              momShortlist,
              momAward: momShortlist?.[0] || null,
            },
          }
        : fixture
    );

    const mergedStats = mergePlayerStatsForCurrentMatch({
      existingStats: careerPlayerStats,
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
      matchFormat: pendingUserMatch.format || 't20',
    });
    const ownContributions = buildTeamContributionsFromInnings({
      players: ownPlayers,
      battingStats: firstBattingSide === 'own' ? firstInnings.battingStats : secondInnings.battingStats,
      bowlingStats: firstBattingSide === 'own' ? secondInnings.bowlingStats : firstInnings.bowlingStats,
    });
    const opponentContributions = buildTeamContributionsFromInnings({
      players: opponentPlayers,
      battingStats: firstBattingSide === 'own' ? secondInnings.battingStats : firstInnings.battingStats,
      bowlingStats: firstBattingSide === 'own' ? firstInnings.bowlingStats : secondInnings.bowlingStats,
    });
    const matchContributionsByTeam = {
      [pendingUserMatch.teamA]: pendingUserMatch.teamA === ownTeam ? ownContributions : opponentContributions,
      [pendingUserMatch.teamB]: pendingUserMatch.teamB === ownTeam ? ownContributions : opponentContributions,
    };
    const updatedDomesticTeams = applyDomesticMatchPlayerUpdates({
      domesticTeams: careerDomesticTeams,
      teamAName: pendingUserMatch.teamA,
      teamBName: pendingUserMatch.teamB,
      teamAXIIds: pendingUserMatch.teamA === ownTeam ? ownPlayers.map((player) => player.id) : opponentPlayers.map((player) => player.id),
      teamBXIIds: pendingUserMatch.teamB === ownTeam ? ownPlayers.map((player) => player.id) : opponentPlayers.map((player) => player.id),
      momShortlist,
      matchContributionsByTeam,
    });
    const nextPendingIndex = updatedSchedule.findIndex((fixture) => !fixture.isComplete);
    const seasonComplete = nextPendingIndex < 0;

    dispatch(setCareerScheduleAction(updatedSchedule));
    dispatch(setCareerPlayerStatsAction(mergedStats));
    dispatch(setCareerDomesticTeamsAction(updatedDomesticTeams));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: updatedDomesticTeams,
          careerTeam,
          careerPlayerProfile,
        })
      )
    );
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, updatedSchedule, updatedDomesticTeams)));
    dispatch(setCareerMatchIndexAction(seasonComplete ? updatedSchedule.length : nextPendingIndex));

    return { didCommit: true, seasonComplete };
  };

const handleCareerMatchPrimaryAction = () => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnum.MatchEnd) return;
    const { seasonComplete } = commitCareerMatchResult();
    if (seasonComplete) {
      const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
      dispatch(
        setCareerOffersAction(
          buildCareerTransferOffers({
            careerTeam,
            careerDomesticTeams,
            careerPlayerProfile,
            careerPlayerStats,
            currentAge,
            careerStandings,
          })
        )
      );
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
      return;
    }
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  return {
    handleCareerStartNextMatch,
    commitCareerMatchResult,
    handleCareerMatchPrimaryAction,
  };
};
