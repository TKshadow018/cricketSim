import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { buildCareerStandings, resolveNextCareerMatch, runCareerAuction } from '../../utils/controllerCareerScheduleUtils';
import { estimateCareerPlayerMarketValue } from "./controllerCareerMarketUtils";
import { buildCreatedCareerPlayer, normalizeDomesticTeams, syncCareerPlayerProfile, resolveMatchTypeKeyForFormat } from "./controllerCareerSetupUtils";
import { getLatestCompletedFixtureForTeam, buildAllCountryLeagueSchedules, prepareMatchXIAndRoles } from "./controllerCareerFixtureUtils";

export const createCareerSetupHandlers = ({
  dispatch,
  careerTeam,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerSchedule,
  setCareerTeamAction,
  setCareerPlayerProfileAction,
  setCareerDomesticCountryAction,
  setCareerDomesticTeamsAction,
  setCareerGlobalPlayerPoolAction,
  setCareerAuctionSummaryAction,
  setCareerOffersAction,
  setCareerRetiredAction,
  setCareerSeasonAction,
  setCareerSeasonLengthAction,
  setCareerFormatAction,
  setCareerMatchIndexAction,
  setCareerScheduleAction,
  setCareerStandingsAction,
  setCareerPlayerStatsAction,
  setCareerSeasonHistoryAction,
  setOwnTeamAction,
  setOpponentTeamAction,
  setLocationCountryAction,
  setSelectedStadiumAction,
  setMatchTypeKeyAction,
  setOwnCustomPlayersAction,
  setOpponentCustomPlayersAction,
  setOwnPlayingXIAction,
  setOpponentPlayingXIAction,
  setOwnTeamRolesAction,
  setOpponentTeamRolesAction,
  setTossWinnerAction,
  setTossDecisionAction,
  setTossCallAction,
  setFirstBattingSideAction,
  setStageAction,
  resetMatchForCareerAction,
}) => {
const launchCareerFixture = (match, nextSchedule, nextStats, nextDomesticTeams = careerDomesticTeams) => {
    const formatKey = resolveMatchTypeKeyForFormat(match.format);
    const domesticByName = (nextDomesticTeams || []).reduce((acc, team) => {
      if (team?.name) {
        acc[team.name] = team;
      }
      return acc;
    }, {});
    const userRoster = Array.isArray(domesticByName[careerTeam]?.players) ? domesticByName[careerTeam].players : [];
    const opponentName = match.teamA === careerTeam ? match.teamB : match.teamA;
    const opponentRoster = Array.isArray(domesticByName[opponentName]?.players) ? domesticByName[opponentName].players : [];
    const fixtureIndex = (nextSchedule || []).findIndex((fixture) => fixture.id === match.id);
    const ownLastFixture = getLatestCompletedFixtureForTeam(nextSchedule, careerTeam, fixtureIndex);
    const opponentLastFixture = getLatestCompletedFixtureForTeam(nextSchedule, opponentName, fixtureIndex);
    const { xiIds: ownXIIds, roles: ownRoles } = prepareMatchXIAndRoles(userRoster, ownLastFixture, careerTeam);
    const { xiIds: opponentXIIds, roles: opponentRoles } = prepareMatchXIAndRoles(
      opponentRoster,
      opponentLastFixture,
      opponentName
    );

    dispatch(setCareerScheduleAction(nextSchedule));
    dispatch(setCareerPlayerStatsAction(nextStats));
    dispatch(setCareerDomesticTeamsAction(nextDomesticTeams));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: nextDomesticTeams,
          careerTeam,
          careerPlayerProfile,
        })
      )
    );
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, nextSchedule, nextDomesticTeams)));
    dispatch(setCareerMatchIndexAction(nextSchedule.findIndex((fixture) => fixture.id === match.id)));
    dispatch(resetMatchForCareerAction());
    dispatch(setCareerFormatAction(match.format || 't20'));
    dispatch(setMatchTypeKeyAction(formatKey));
    dispatch(setOwnTeamAction(careerTeam));
    dispatch(setOpponentTeamAction(opponentName));
    dispatch(setLocationCountryAction(careerDomesticCountry || ''));
    dispatch(setSelectedStadiumAction(''));
    dispatch(setTossWinnerAction(''));
    dispatch(setTossDecisionAction(''));
    dispatch(setTossCallAction(''));
    dispatch(setFirstBattingSideAction(''));
    dispatch(setOwnCustomPlayersAction(userRoster));
    dispatch(setOpponentCustomPlayersAction(opponentRoster));
    dispatch(setOwnPlayingXIAction(ownXIIds));
    dispatch(setOpponentPlayingXIAction(opponentXIIds));
    dispatch(setOwnTeamRolesAction(ownRoles));
    dispatch(setOpponentTeamRolesAction(opponentRoles));
    dispatch(setStageAction(matchStatusEnum.TossTime));
  };

const beginCareer = ({ seasonLength, playerProfile, domesticCountry, domesticTeams, globalPlayerPool, offers, countryList = [] }) => {
    if (!playerProfile?.name || !domesticCountry || !Array.isArray(domesticTeams) || domesticTeams.length < 2) return;

    const normalizedTeams = normalizeDomesticTeams(domesticTeams);
    const createdPlayer = buildCreatedCareerPlayer(playerProfile, domesticCountry);
    const auctionResult = runCareerAuction({
      domesticTeams: normalizedTeams,
      globalPlayerPool,
      countryRows: countryList,
      leagueCountry: domesticCountry,
      careerPlayer: createdPlayer,
    });
    const resolvedCareerTeam = auctionResult.careerTeam || '';
    if (!resolvedCareerTeam) {
      return;
    }

    const updatedTeams = auctionResult.domesticTeams || normalizedTeams;
    const nextPlayerProfile = {
      ...playerProfile,
      playerId: createdPlayer.id,
      abilityToPlayPaceBall: createdPlayer.abilityToPlayPaceBall,
      abilityToPlaySpinBall: createdPlayer.abilityToPlaySpinBall,
      battingAggresion: createdPlayer.battingAggresion,
      paceAbility: createdPlayer.paceAbility,
      spinAbility: createdPlayer.spinAbility,
      isWicketKeeper: createdPlayer.isWicketKeeper,
      playerType: createdPlayer.playerType,
      fitness: createdPlayer.fitness,
      morale: createdPlayer.morale,
      battingOrderCoeff: createdPlayer.battingOrderCoeff,
      currentValue: estimateCareerPlayerMarketValue({
        player: createdPlayer,
        seasonStats: null,
        currentAge: Number(playerProfile?.age || 18),
        currentValue: 0,
      }),
    };

    const schedule = buildAllCountryLeagueSchedules({
      allDomesticTeams: updatedTeams,
      userLeagueCountry: domesticCountry,
      seasonLength: seasonLength || 'standard',
      careerTeam: resolvedCareerTeam,
    });
    const initialStandings = buildCareerStandings(resolvedCareerTeam, schedule, updatedTeams);
    const firstPendingFixtureIndex = schedule.findIndex((fixture) => !fixture.isComplete);

    dispatch(setCareerTeamAction(resolvedCareerTeam));
    dispatch(setCareerPlayerProfileAction(nextPlayerProfile));
    dispatch(setCareerDomesticCountryAction(domesticCountry));
    dispatch(setCareerDomesticTeamsAction(updatedTeams));
    dispatch(setCareerGlobalPlayerPoolAction(auctionResult.globalPlayerPool || []));
    dispatch(setCareerAuctionSummaryAction(auctionResult.auctionSummary || null));
    dispatch(setCareerOffersAction(Array.isArray(offers) ? offers : []));
    dispatch(setCareerRetiredAction(false));
    dispatch(setCareerSeasonAction(1));
    dispatch(setCareerSeasonLengthAction(seasonLength || 'standard'));
    dispatch(setCareerFormatAction('t20'));
    dispatch(setCareerMatchIndexAction(firstPendingFixtureIndex >= 0 ? firstPendingFixtureIndex : 0));
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerStandingsAction(initialStandings));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setCareerSeasonHistoryAction([]));
    dispatch(setStageAction(matchStatusEnum.CareerAuction));
  };

const handleCareerContinueAfterAuction = () => {
    if (!careerTeam || !careerPlayerProfile?.name || !Array.isArray(careerSchedule) || !careerSchedule.length) {
      return;
    }

    const nextMatch = resolveNextCareerMatch(careerSchedule);
    dispatch(setCareerMatchIndexAction(nextMatch ? careerSchedule.findIndex((match) => match.id === nextMatch.id) : 0));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  return {
    launchCareerFixture,
    beginCareer,
    handleCareerContinueAfterAuction,
  };
};
