import { useMemo } from "react";
import { countries } from "../../../../gameData/countries";
import { countBowlingRolePlayers } from "../../../../gameData/playerTypes";
import { stadiums } from "../../../../gameData/stadiums";
import { getPlayersForNations, playerListForNation } from "../../../../gameData/playerListForNation";
import { matchTypeList } from "../../../../gameData/matchTypeList";
import { matchStatusEnum } from "../../../../gameData/matchStatusEnum";
import { MODE_TOURNAMENT, MODE_CAREER, buildPlayingXI, normalizePlayingXIIds, sanitizeRoles } from "../../utils/controllerCommonUtils";

const getSelectedXIPlayers = (availablePlayers, selectedIds, battingOrderIds) => {
  const selectedSet = new Set(selectedIds);
  const hasCompleteBattingOrder =
    selectedIds.length === 11 &&
    Array.isArray(battingOrderIds) &&
    battingOrderIds.length === 11 &&
    new Set(battingOrderIds).size === 11 &&
    battingOrderIds.every((id) => selectedSet.has(id));

  if (hasCompleteBattingOrder) {
    const playersById = new Map(availablePlayers.map((player) => [player.id, player]));
    return battingOrderIds.map((id) => playersById.get(id)).filter(Boolean);
  }

  return availablePlayers.filter((player) => selectedSet.has(player.id));
};

export function useControllerDerivedState({
  stage,
  gameMode,
  tournamentUserTeam,
  matchTypeKey,
  ownTeam,
  opponentTeam,
  ownPlayingXI,
  opponentPlayingXI,
  ownBattingOrderIds,
  opponentBattingOrderIds,
  ownCustomPlayers,
  opponentCustomPlayers,
  ownTeamRoles,
  opponentTeamRoles,
  locationCountry,
  tossWinner,
  firstBattingSide,
  careerTeam,
  careerDomesticTeams,
}) {
const countryList = useMemo(
    () => Object.values(countries).sort((a, b) => a.current_ranking - b.current_ranking),
    []
  );

const fallbackPlayers = useMemo(
    () => Object.values(playerListForNation).find((players) => Array.isArray(players) && players.length > 0) || [],
    []
  );

const matchType = matchTypeList[matchTypeKey] || matchTypeList.t20;

const maxBalls = matchType.over * 6;

const careerDomesticRosterMap = useMemo(() => {
    const map = {};
    (careerDomesticTeams || []).forEach((team) => {
      if (team?.name) {
        map[team.name] = Array.isArray(team.players) ? team.players : [];
      }
    });
    return map;
  }, [careerDomesticTeams]);

const countryRoster = getPlayersForNations(ownTeam, opponentTeam);

const careerOwnPlayers = careerDomesticRosterMap[ownTeam] || [];

const careerOpponentPlayers = careerDomesticRosterMap[opponentTeam] || [];

const fullOwnPlayers = gameMode === MODE_CAREER && careerOwnPlayers.length > 0 ? careerOwnPlayers : countryRoster.ownPlayers;

const fullOpponentPlayers =
    gameMode === MODE_CAREER && careerOpponentPlayers.length > 0
      ? careerOpponentPlayers
      : countryRoster.opponentPlayers;

const availableOwnPlayers =
    fullOwnPlayers.length > 0
      ? [...fullOwnPlayers, ...(Array.isArray(ownCustomPlayers) ? ownCustomPlayers : [])]
      : fallbackPlayers;

const availableOpponentPlayers =
    fullOpponentPlayers.length > 0
      ? [...fullOpponentPlayers, ...(Array.isArray(opponentCustomPlayers) ? opponentCustomPlayers : [])]
      : fallbackPlayers;

const ownPlayers = buildPlayingXI(availableOwnPlayers, ownPlayingXI, ownBattingOrderIds);

const opponentPlayers = buildPlayingXI(availableOpponentPlayers, opponentPlayingXI, opponentBattingOrderIds);

const ownSelectedXIIds = normalizePlayingXIIds(availableOwnPlayers, ownPlayingXI);

const opponentSelectedXIIds = normalizePlayingXIIds(availableOpponentPlayers, opponentPlayingXI);

const ownSelectedXIPlayers = getSelectedXIPlayers(
    availableOwnPlayers,
    ownSelectedXIIds,
    ownBattingOrderIds
  );

const opponentSelectedXIPlayers = getSelectedXIPlayers(
    availableOpponentPlayers,
    opponentSelectedXIIds,
    opponentBattingOrderIds
  );

const ownAvailablePool = availableOwnPlayers.filter((player) => !ownSelectedXIIds.includes(player.id));

const opponentAvailablePool = availableOpponentPlayers.filter(
    (player) => !opponentSelectedXIIds.includes(player.id)
  );

const ownSanitizedRoles = sanitizeRoles(ownTeamRoles, ownSelectedXIIds);

const opponentSanitizedRoles = sanitizeRoles(opponentTeamRoles, opponentSelectedXIIds);

const ownXIReady = ownSelectedXIIds.length === 11;

const opponentXIReady = opponentSelectedXIIds.length === 11;

const ownBowlingRolesReady =
    gameMode === MODE_CAREER || countBowlingRolePlayers(ownSelectedXIPlayers) >= 5;

const opponentBowlingRolesReady =
    gameMode === MODE_CAREER || countBowlingRolePlayers(opponentSelectedXIPlayers) >= 5;

const ownRolesReady =
    !!ownSanitizedRoles.captainId &&
    !!ownSanitizedRoles.viceCaptainId &&
    ownSanitizedRoles.captainId !== ownSanitizedRoles.viceCaptainId &&
    ownSelectedXIPlayers.some(
      (player) => player.id === ownSanitizedRoles.wicketKeeperId && player.isWicketKeeper
    );

const opponentRolesReady =
    !!opponentSanitizedRoles.captainId &&
    !!opponentSanitizedRoles.viceCaptainId &&
    opponentSanitizedRoles.captainId !== opponentSanitizedRoles.viceCaptainId &&
    opponentSelectedXIPlayers.some(
      (player) => player.id === opponentSanitizedRoles.wicketKeeperId && player.isWicketKeeper
    );

const venueStadiums = stadiums[locationCountry] || [];

const userTeamName = gameMode === MODE_TOURNAMENT ? tournamentUserTeam : gameMode === MODE_CAREER ? careerTeam : ownTeam;

const isCurrentMatchUserInvolved =
    !!userTeamName && (ownTeam === userTeamName || opponentTeam === userTeamName);

const isUserWinner = tossWinner === userTeamName;

const firstInningsTeamName = firstBattingSide === 'own' ? ownTeam : opponentTeam;

const secondInningsTeamName = firstBattingSide === 'own' ? opponentTeam : ownTeam;

const isGameInProgress =
    stage === matchStatusEnum.TeamOneBat ||
    stage === matchStatusEnum.TeamTwoBat ||
    stage === matchStatusEnum.TossResult ||
    stage === matchStatusEnum.ChooseOwnPlayingXI ||
    stage === matchStatusEnum.ChooseOpponentPlayingXI ||
    stage === matchStatusEnum.CareerSeasonSchedule;

  return {
    countryList,
    fallbackPlayers,
    matchType,
    maxBalls,
    careerDomesticRosterMap,
    countryRoster,
    careerOwnPlayers,
    careerOpponentPlayers,
    fullOwnPlayers,
    fullOpponentPlayers,
    availableOwnPlayers,
    availableOpponentPlayers,
    ownPlayers,
    opponentPlayers,
    ownSelectedXIIds,
    opponentSelectedXIIds,
    ownSelectedXIPlayers,
    opponentSelectedXIPlayers,
    ownAvailablePool,
    opponentAvailablePool,
    ownSanitizedRoles,
    opponentSanitizedRoles,
    ownXIReady,
    opponentXIReady,
    ownBowlingRolesReady,
    opponentBowlingRolesReady,
    ownRolesReady,
    opponentRolesReady,
    venueStadiums,
    userTeamName,
    isCurrentMatchUserInvolved,
    isUserWinner,
    firstInningsTeamName,
    secondInningsTeamName,
    isGameInProgress,
  };
}
