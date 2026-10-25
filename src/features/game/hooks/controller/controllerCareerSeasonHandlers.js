import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { applyEndOfSeasonPlayerAbilityUpdates, assignGlobalPoolPlayersToDomesticTeams, buildCareerStandings, resolveNextCareerMatch } from '../../utils/controllerCareerScheduleUtils';
import { buildCareerStatsLookup, estimateCareerPlayerMarketValue, applyOffseasonTransferMarket, relocateCareerPlayerToTeam, resolveSeasonPointsForTeam, resolveSeasonStatsForPlayer } from "./controllerCareerMarketUtils";
import { resolveCareerLeagueCountry, syncCareerPlayerProfile } from "./controllerCareerSetupUtils";
import { buildAllCountryLeagueSchedules } from "./controllerCareerFixtureUtils";
import { buildEndOfSeasonReport } from "./controllerCareerSeasonUtils";

export const createCareerSeasonHandlers = ({
  dispatch,
  careerTeam,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerGlobalPlayerPool,
  careerOffers,
  careerRetired,
  careerSeason,
  careerSeasonLength,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  careerSeasonHistory,
  careerResultCommitSignatureRef,
  setCareerTeamAction,
  setCareerPlayerProfileAction,
  setCareerDomesticCountryAction,
  setCareerDomesticTeamsAction,
  setCareerGlobalPlayerPoolAction,
  setCareerAuctionSummaryAction,
  setCareerOffersAction,
  setCareerRetiredAction,
  setCareerSeasonAction,
  setCareerMatchIndexAction,
  setCareerScheduleAction,
  setCareerStandingsAction,
  setCareerPlayerStatsAction,
  setCareerSeasonHistoryAction,
  setStageAction,
  resetMatchRuntimeAction,
  setAutoSimMode,
}) => {
const handleStartNextCareerSeason = (options = {}) => {
    if (careerRetired) return;
    const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
    if (currentAge >= 40) {
      dispatch(setCareerRetiredAction(true));
      dispatch(setStageAction(matchStatusEnum.CareerHistory));
      return;
    }

    const selectedTeamName = typeof options?.selectedTeam === 'string' && options.selectedTeam.trim()
      ? options.selectedTeam.trim()
      : careerTeam;
    const selectedOffer = (careerOffers || []).find((offer) => offer.team === selectedTeamName) || null;

    const seasonEntry = {
      season: careerSeason,
      careerTeam,
      standings: careerStandings,
      schedule: careerSchedule,
      playerAge: currentAge,
      seasonReport: buildEndOfSeasonReport({
        careerTeam,
        careerSeason,
        currentAge,
        careerDomesticTeams,
        careerPlayerStats,
        careerPlayerProfile,
        careerStandings,
        careerSchedule,
      }),
      offseasonDecision: {
        selectedTeam: selectedTeamName,
        acceptedOffer: selectedOffer,
      },
    };
    const updatedHistory = [...(careerSeasonHistory || []), seasonEntry];
    const progressedDomesticTeams = applyEndOfSeasonPlayerAbilityUpdates({
      domesticTeams: careerDomesticTeams,
      careerPlayerStats,
      currentAge,
      careerTeam,
      careerPlayerProfile,
    });
    const transferWindow = applyOffseasonTransferMarket({
      domesticTeams: progressedDomesticTeams,
      careerPlayerProfile,
      careerPlayerStats,
    });
    const movedCareerPlayer = relocateCareerPlayerToTeam({
      domesticTeams: transferWindow.teams,
      currentCareerTeam: careerTeam,
      nextCareerTeam: selectedTeamName,
      careerPlayerProfile,
    });
    const assignmentResult = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams: movedCareerPlayer.teams,
      globalPlayerPool: careerGlobalPlayerPool,
      countryRows: options?.countryList || [],
    });

    const nextCareerTeamName = movedCareerPlayer.nextCareerTeam || careerTeam;
    const nextLeagueCountry = resolveCareerLeagueCountry({
      teams: assignmentResult.domesticTeams || movedCareerPlayer.teams,
      careerTeam: nextCareerTeamName,
      fallbackCountry: careerDomesticCountry,
    });
    const nextValuation = estimateCareerPlayerMarketValue({
      player: careerPlayerProfile,
      seasonStats: resolveSeasonStatsForPlayer({
        statsLookup: buildCareerStatsLookup(careerPlayerStats),
        teamName: careerTeam,
        playerId: careerPlayerProfile?.playerId,
        playerName: careerPlayerProfile?.name,
      }),
      currentAge,
      currentValue: selectedOffer?.amount || careerPlayerProfile?.currentValue,
      currentTeamPoints: resolveSeasonPointsForTeam(careerStandings, careerTeam),
    });
    const teamsAfterAssignment = assignmentResult.domesticTeams || movedCareerPlayer.teams;
    const newSchedule = buildAllCountryLeagueSchedules({
      allDomesticTeams: teamsAfterAssignment,
      userLeagueCountry: nextLeagueCountry,
      seasonLength: careerSeasonLength,
      careerTeam: nextCareerTeamName,
    });
    const newStandings = buildCareerStandings(nextCareerTeamName, newSchedule, teamsAfterAssignment);
    const firstPendingFixtureIndex = newSchedule.findIndex((fixture) => !fixture.isComplete);

    dispatch(setCareerSeasonHistoryAction(updatedHistory));
    dispatch(setCareerSeasonAction(careerSeason + 1));
    dispatch(setCareerTeamAction(nextCareerTeamName));
    dispatch(setCareerDomesticCountryAction(nextLeagueCountry));
    dispatch(setCareerDomesticTeamsAction(teamsAfterAssignment));
    dispatch(setCareerGlobalPlayerPoolAction(assignmentResult.globalPlayerPool || careerGlobalPlayerPool || []));
    dispatch(setCareerAuctionSummaryAction(null));
    dispatch(setCareerOffersAction([]));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: teamsAfterAssignment,
          careerTeam: nextCareerTeamName,
          careerPlayerProfile: {
            ...careerPlayerProfile,
            currentValue: nextValuation,
          },
        })
      )
    );
    dispatch(setCareerScheduleAction(newSchedule));
    dispatch(setCareerStandingsAction(newStandings));
    dispatch(setCareerMatchIndexAction(firstPendingFixtureIndex >= 0 ? firstPendingFixtureIndex : 0));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

const handleRetireCareer = () => {
    dispatch(setCareerRetiredAction(true));
    dispatch(setStageAction(matchStatusEnum.CareerHistory));
  };

const handleEndCareer = () => {
    setAutoSimMode(null);
    if (careerResultCommitSignatureRef) {
      careerResultCommitSignatureRef.current = '';
    }
    dispatch(resetMatchRuntimeAction());
  };

const handleViewCareerHistory = () => {
    dispatch(setStageAction(matchStatusEnum.CareerHistory));
  };

const handleBackToCareerSchedule = () => {
    if (careerRetired) {
      dispatch(setStageAction(matchStatusEnum.CareerHistory));
      return;
    }
    const nextMatch = resolveNextCareerMatch(careerSchedule);
    dispatch(setCareerMatchIndexAction(nextMatch ? careerSchedule.findIndex((match) => match.id === nextMatch.id) : careerSchedule.length));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  return {
    handleStartNextCareerSeason,
    handleRetireCareer,
    handleEndCareer,
    handleViewCareerHistory,
    handleBackToCareerSchedule,
  };
};
