import { announceTeamChoice, speak } from '../../../../utils/speechUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { selectAIPlayingXI } from '../../utils/controllerCommonUtils';
import { autoPositionPlayers } from '../../utils/autoPositionPlayers';

const reorderBattingOrder = (selectedIds, battingOrderIds, playerId, direction) => {
  if (direction !== -1 && direction !== 1) {
    return null;
  }

  const selectedOrder = [...new Set(selectedIds || [])];
  const selectedSet = new Set(selectedOrder);
  const nextOrder = (Array.isArray(battingOrderIds) ? battingOrderIds : [])
    .filter((id, index, order) => selectedSet.has(id) && order.indexOf(id) === index);
  selectedOrder.forEach((id) => {
    if (!nextOrder.includes(id)) {
      nextOrder.push(id);
    }
  });

  const currentIndex = nextOrder.indexOf(playerId);
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextOrder.length) {
    return null;
  }

  [nextOrder[currentIndex], nextOrder[targetIndex]] = [
    nextOrder[targetIndex],
    nextOrder[currentIndex],
  ];
  return nextOrder;
};

export const createTeamManagementHandlers = ({
  dispatch,
  userTeamName,
  ownTeam,
  gameMode,
  openInnings,
  setTossDecisionAction,
  setFirstBattingSideAction,
  setStageAction,
  setOwnPlayingXIAction,
  setOwnBattingOrderIdsAction,
  ownSelectedXIIds,
  ownBattingOrderIds,
  availableOwnPlayers,
  setOwnTeamRolesAction,
  ownSanitizedRoles,
  sanitizeRoles,
  setOpponentPlayingXIAction,
  setOpponentBattingOrderIdsAction,
  opponentSelectedXIIds,
  opponentBattingOrderIds,
  availableOpponentPlayers,
  setOpponentTeamRolesAction,
  opponentSanitizedRoles,
  ownSelectedXIPlayers,
  opponentSelectedXIPlayers,
  setOwnCustomPlayersAction,
  ownCustomPlayers,
  setOpponentCustomPlayersAction,
  opponentCustomPlayers,
  ownXIReady,
  opponentXIReady,
  ownBowlingRolesReady,
  opponentBowlingRolesReady,
  ownRolesReady,
  opponentRolesReady,
  firstBattingSide,
  pickDefaultRoles,
  opponentTeam,
}) => {
  const handleUserTossDecision = (decision) => {
    dispatch(setTossDecisionAction(decision));
    const userSide = userTeamName === ownTeam ? 'own' : 'opponent';
    const firstSide = decision === 'bat' ? userSide : userSide === 'own' ? 'opponent' : 'own';
    dispatch(setFirstBattingSideAction(firstSide));
    announceTeamChoice(userTeamName || ownTeam, decision);

    if (gameMode === 'tournament') {
      openInnings(firstSide);
      return;
    }

    dispatch(setStageAction(matchStatusEnum.ChooseOwnPlayingXI));
  };

  const moveOwnPlayerToXI = (playerId) => {
    if (ownSelectedXIIds.includes(playerId) || ownSelectedXIIds.length >= 11) {
      return;
    }

    dispatch(setOwnPlayingXIAction([...ownSelectedXIIds, playerId]));
    const player = availableOwnPlayers.find((item) => item.id === playerId);
    if (player) {
      speak(`${player.name} selected in ${ownTeam} playing eleven.`);
    }
  };

  const removeOwnPlayerFromXI = (playerId) => {
    if (!ownSelectedXIIds.includes(playerId)) {
      return;
    }

    const nextIds = ownSelectedXIIds.filter((id) => id !== playerId);
    dispatch(setOwnPlayingXIAction(nextIds));
    dispatch(setOwnTeamRolesAction(sanitizeRoles(ownSanitizedRoles, nextIds)));
    const player = availableOwnPlayers.find((item) => item.id === playerId);
    if (player) {
      speak(`${player.name} removed from ${ownTeam} playing eleven.`);
    }
  };

  const moveOpponentPlayerToXI = (playerId) => {
    if (opponentSelectedXIIds.includes(playerId) || opponentSelectedXIIds.length >= 11) {
      return;
    }

    dispatch(setOpponentPlayingXIAction([...opponentSelectedXIIds, playerId]));
    const player = availableOpponentPlayers.find((item) => item.id === playerId);
    if (player) {
      speak(`${player.name} selected in ${opponentTeam} playing eleven.`);
    }
  };

  const removeOpponentPlayerFromXI = (playerId) => {
    if (!opponentSelectedXIIds.includes(playerId)) {
      return;
    }

    const nextIds = opponentSelectedXIIds.filter((id) => id !== playerId);
    dispatch(setOpponentPlayingXIAction(nextIds));
    dispatch(setOpponentTeamRolesAction(sanitizeRoles(opponentSanitizedRoles, nextIds)));
    const player = availableOpponentPlayers.find((item) => item.id === playerId);
    if (player) {
      speak(`${player.name} removed from ${opponentTeam} playing eleven.`);
    }
  };

  const moveOwnPlayerInBattingOrder = (playerId, direction) => {
    const nextOrder = reorderBattingOrder(
      ownSelectedXIIds,
      ownBattingOrderIds,
      playerId,
      direction
    );
    if (nextOrder) {
      dispatch(setOwnBattingOrderIdsAction(nextOrder));
    }
  };

  const moveOpponentPlayerInBattingOrder = (playerId, direction) => {
    const nextOrder = reorderBattingOrder(
      opponentSelectedXIIds,
      opponentBattingOrderIds,
      playerId,
      direction
    );
    if (nextOrder) {
      dispatch(setOpponentBattingOrderIdsAction(nextOrder));
    }
  };

  const setOwnRole = (roleKey, playerId) => {
    const selectedMap = new Map(ownSelectedXIPlayers.map((player) => [player.id, player]));
    const targetPlayer = selectedMap.get(playerId);
    if (roleKey === 'wicketKeeperId' && playerId && !targetPlayer?.isWicketKeeper) {
      return;
    }

    const nextRoles = {
      ...ownSanitizedRoles,
      [roleKey]: playerId || null,
    };

    if (roleKey === 'captainId' && nextRoles.viceCaptainId === playerId) {
      nextRoles.viceCaptainId = null;
    }
    if (roleKey === 'viceCaptainId' && nextRoles.captainId === playerId) {
      nextRoles.captainId = null;
    }

    dispatch(setOwnTeamRolesAction(nextRoles));

    if (playerId) {
      const roleLabel =
        roleKey === 'captainId' ? 'captain' : roleKey === 'viceCaptainId' ? 'vice captain' : 'wicketkeeper';
      const player = ownSelectedXIPlayers.find((item) => item.id === playerId);
      if (player) {
        speak(`${player.name} selected as ${roleLabel} for ${ownTeam}.`);
      }
    }
  };

  const setOpponentRole = (roleKey, playerId) => {
    const selectedMap = new Map(opponentSelectedXIPlayers.map((player) => [player.id, player]));
    const targetPlayer = selectedMap.get(playerId);
    if (roleKey === 'wicketKeeperId' && playerId && !targetPlayer?.isWicketKeeper) {
      return;
    }

    const nextRoles = {
      ...opponentSanitizedRoles,
      [roleKey]: playerId || null,
    };

    if (roleKey === 'captainId' && nextRoles.viceCaptainId === playerId) {
      nextRoles.viceCaptainId = null;
    }
    if (roleKey === 'viceCaptainId' && nextRoles.captainId === playerId) {
      nextRoles.captainId = null;
    }

    dispatch(setOpponentTeamRolesAction(nextRoles));

    if (playerId) {
      const roleLabel =
        roleKey === 'captainId' ? 'captain' : roleKey === 'viceCaptainId' ? 'vice captain' : 'wicketkeeper';
      const player = opponentSelectedXIPlayers.find((item) => item.id === playerId);
      if (player) {
        speak(`${player.name} selected as ${roleLabel} for ${opponentTeam}.`);
      }
    }
  };

  const createCustomPlayer = (teamKey, payload) => {
    const targetPlayers = teamKey === 'own' ? availableOwnPlayers : availableOpponentPlayers;
    const targetIds = targetPlayers.map((player) => player.id || 0);
    const nextId = (targetIds.length ? Math.max(...targetIds) : 0) + 1;
    const customPlayer = {
      id: nextId,
      name: payload.name,
      abilityToPlayPaceBall: payload.abilityToPlayPaceBall,
      abilityToPlaySpinBall: payload.abilityToPlaySpinBall,
      battingAggresion: payload.battingAggresion,
      isWicketKeeper: !!payload.isWicketKeeper,
      spinAbility: payload.spinAbility,
      paceAbility: payload.paceAbility,
      currentMatch: {
        run: 0,
        ball: 0,
        isBatting: 0,
        b_run: 0,
        b_ball: 0,
        b_wkt: 0,
      },
    };

    if (teamKey === 'own') {
      const nextCustom = [...(ownCustomPlayers || []), customPlayer];
      dispatch(setOwnCustomPlayersAction(nextCustom));
      dispatch(setOwnPlayingXIAction([...ownSelectedXIIds, customPlayer.id].slice(0, 11)));
      speak(`${customPlayer.name} created and added to ${ownTeam}.`);
      return;
    }

    const nextCustom = [...(opponentCustomPlayers || []), customPlayer];
    dispatch(setOpponentCustomPlayersAction(nextCustom));
    dispatch(setOpponentPlayingXIAction([...opponentSelectedXIIds, customPlayer.id].slice(0, 11)));
    speak(`${customPlayer.name} created and added to ${opponentTeam}.`);
  };

  const autoPickOwnXI = () => {
    const nextIds = selectAIPlayingXI({ roster: availableOwnPlayers, requireBowlingQuota: true });
    dispatch(setOwnPlayingXIAction(nextIds));
    dispatch(setOwnTeamRolesAction(pickDefaultRoles(availableOwnPlayers, nextIds)));
  };

  const autoPickOpponentXI = () => {
    const nextIds = selectAIPlayingXI({ roster: availableOpponentPlayers, requireBowlingQuota: true });
    dispatch(setOpponentPlayingXIAction(nextIds));
    dispatch(setOpponentTeamRolesAction(pickDefaultRoles(availableOpponentPlayers, nextIds)));
  };

  const autoPositionOwnXI = () => {
    if (ownSelectedXIIds.length !== 11) {
      return;
    }

    const positionedPlayers = autoPositionPlayers(ownSelectedXIPlayers);
    dispatch(setOwnBattingOrderIdsAction(positionedPlayers.map((player) => player.id)));
  };

  const autoPositionOpponentXI = () => {
    if (opponentSelectedXIIds.length !== 11) {
      return;
    }

    const positionedPlayers = autoPositionPlayers(opponentSelectedXIPlayers);
    dispatch(setOpponentBattingOrderIdsAction(positionedPlayers.map((player) => player.id)));
  };

  const startMatchWithSelectedXI = () => {
    if (
      !ownXIReady ||
      !opponentXIReady ||
      !ownBowlingRolesReady ||
      !opponentBowlingRolesReady ||
      !ownRolesReady ||
      !opponentRolesReady
    ) {
      return;
    }

    openInnings(firstBattingSide);
  };

  return {
    handleUserTossDecision,
    moveOwnPlayerToXI,
    removeOwnPlayerFromXI,
    moveOpponentPlayerToXI,
    removeOpponentPlayerFromXI,
    moveOwnPlayerInBattingOrder,
    moveOpponentPlayerInBattingOrder,
    setOwnRole,
    setOpponentRole,
    createCustomPlayer,
    autoPickOwnXI,
    autoPickOpponentXI,
    autoPositionOwnXI,
    autoPositionOpponentXI,
    startMatchWithSelectedXI,
  };
};
