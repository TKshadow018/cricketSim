import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { buildInitialInnings, buildRandomMatchCondition, resetMatchRuntime } from '../../gameSlice';
import { announceTeamChoice, speak } from '../../../../utils/speechUtils';
import { randomKey, MODE_QUICK, MODE_SERIES, MODE_TOURNAMENT } from '../../utils/controllerCommonUtils';
import { weather } from '../../../../gameData/matchCondition';
import { getOpponentDecision } from '../../../../utils/simulatorUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { ensureTournamentNextRound, resolveWinnerFromScores } from '../../utils/controllerTournamentUtils';
import { mergePlayerStatsForCurrentMatch } from '../../utils/controllerCareerUtils';

export const createCompetitionHandlers = ({
  dispatch,
  gameMode,
  ownTeam,
  opponentTeam,
  userTeamName,
  firstBattingSide,
  openInnings,
  setTossDecisionAction,
  setFirstBattingSideAction,
  setStageAction,
  ownSelectedXIIds,
  opponentSelectedXIIds,
  availableOwnPlayers,
  availableOpponentPlayers,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  setOwnPlayingXIAction,
  setOpponentPlayingXIAction,
  setOwnTeamRolesAction,
  setOpponentTeamRolesAction,
  sanitizeRoles,
  pickDefaultRoles,
  ownSelectedXIPlayers,
  opponentSelectedXIPlayers,
  setOwnCustomPlayersAction,
  setOpponentCustomPlayersAction,
  ownCustomPlayers,
  opponentCustomPlayers,
  ownXIReady,
  opponentXIReady,
  ownRolesReady,
  opponentRolesReady,
  setOwnTeamAction,
  setOpponentTeamAction,
  setBattingIntentAction,
  setBowlingIntentAction,
  setFirstInningsAction,
  setSecondInningsAction,
  setShowScoreboardAction,
  setTournamentCurrentMatchIdAction,
  tournamentResultCommitSignatureRef,
  tournamentPlayerStats,
  firstInnings,
  secondInnings,
  firstInningsTeamName,
  secondInningsTeamName,
  tournamentCurrentMatchId,
  tournamentMatches,
  resultSummary,
  setTournamentMatchesAction,
  setTournamentPlayerStatsAction,
  seriesPlayerStats,
  seriesCurrentMatch,
  seriesResultCommitSignatureRef,
  seriesResults,
  setSeriesResultsAction,
  setSeriesPlayerStatsAction,
  setTossWinnerAction,
  setTossCallAction,
  setMatchConditionAction,
  seriesCurrent,
  seriesLength,
  setSeriesCurrentMatchAction,
  setTournamentChampionAction,
  setAutoSimMode,
  tournamentUserTeam,
  tournamentOpponentTeams,
  stage,
  matchCondition,
  selectedStadium,
  venueStadiums,
}) => {
  const handleUserTossDecision = (decision) => {
    dispatch(setTossDecisionAction(decision));
    const userSide = userTeamName === ownTeam ? 'own' : 'opponent';
    const firstSide = decision === 'bat' ? userSide : userSide === 'own' ? 'opponent' : 'own';
    dispatch(setFirstBattingSideAction(firstSide));
    announceTeamChoice(userTeamName || ownTeam, decision);

    if (gameMode === MODE_TOURNAMENT) {
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
    const nextIds = availableOwnPlayers.slice(0, 11).map((player) => player.id);
    dispatch(setOwnPlayingXIAction(nextIds));
    dispatch(setOwnTeamRolesAction(pickDefaultRoles(availableOwnPlayers, nextIds)));
  };

  const autoPickOpponentXI = () => {
    const nextIds = availableOpponentPlayers.slice(0, 11).map((player) => player.id);
    dispatch(setOpponentPlayingXIAction(nextIds));
    dispatch(setOpponentTeamRolesAction(pickDefaultRoles(availableOpponentPlayers, nextIds)));
  };

  const startMatchWithSelectedXI = () => {
    if (!ownXIReady || !opponentXIReady || !ownRolesReady || !opponentRolesReady) {
      return;
    }

    openInnings(firstBattingSide);
  };

  const prepareTournamentMatch = (match) => {
    if (!match?.teamA || !match?.teamB) {
      return;
    }

    dispatch(setOwnTeamAction(match.teamA));
    dispatch(setOpponentTeamAction(match.teamB));
    dispatch(setOwnPlayingXIAction([]));
    dispatch(setOpponentPlayingXIAction([]));
    dispatch(setOwnTeamRolesAction({ captainId: null, viceCaptainId: null, wicketKeeperId: null }));
    dispatch(setOpponentTeamRolesAction({ captainId: null, viceCaptainId: null, wicketKeeperId: null }));
    dispatch(setBattingIntentAction(battingAction.normal));
    dispatch(setBowlingIntentAction(bowlingAction.normal));
    dispatch(setFirstInningsAction(buildInitialInnings()));
    dispatch(setSecondInningsAction(buildInitialInnings()));
    dispatch(setShowScoreboardAction(false));
    dispatch(setTournamentCurrentMatchIdAction(match.id));
    tournamentResultCommitSignatureRef.current = '';
  };

  const resolveStadiumCondition = (stadiumName, weatherKey = randomKey(weather)) => {
    const selected = (venueStadiums || []).find((stadiumItem) => stadiumItem?.name === stadiumName);
    return {
      weather: weatherKey || randomKey(weather) || 'sunny',
      pitch: selected?.pitchType || 'sporting',
      outfield: selected?.outfieldType || 'lushGreen',
    };
  };

  const matchPrimaryAction = () => {
    if (gameMode === MODE_QUICK) {
      dispatch(resetMatchRuntime());
      return;
    }

    if (gameMode === MODE_TOURNAMENT) {
      const winnerTeam = resolveWinnerFromScores({
        firstInnings,
        secondInnings,
        firstInningsTeamName,
        secondInningsTeamName,
        tieAs: firstInningsTeamName,
      });

      const updatedMatches = (tournamentMatches || []).map((match) =>
        match.id === tournamentCurrentMatchId
          ? {
              ...match,
              winnerTeam,
              summary: resultSummary,
              firstInningsScore: firstInnings.score,
              firstInningsWickets: firstInnings.wickets,
              secondInningsScore: secondInnings.score,
              secondInningsWickets: secondInnings.wickets,
              isComplete: true,
            }
          : match
      );

      const mergedMatches = ensureTournamentNextRound(updatedMatches);
      dispatch(setTournamentMatchesAction(mergedMatches));
      dispatch(
        setTournamentPlayerStatsAction(
          mergePlayerStatsForCurrentMatch({
            existingStats: tournamentPlayerStats,
            firstBattingSide,
            ownPlayers: availableOwnPlayers,
            opponentPlayers: availableOpponentPlayers,
            ownTeam,
            opponentTeam,
            firstInnings,
            secondInnings,
          })
        )
      );

      const pending = mergedMatches.find((match) => !match.isComplete && match.teamA && match.teamB);
      if (!pending) {
        const finals = mergedMatches
          .filter((match) => match.isComplete)
          .sort((left, right) => right.round - left.round || right.matchNumber - left.matchNumber);
        dispatch(setTournamentChampionAction(finals[0]?.winnerTeam || ''));
        dispatch(setStageAction(matchStatusEnum.TournamentChampion));
      } else {
        prepareTournamentMatch(pending);
        dispatch(setStageAction(matchStatusEnum.TossTime));
      }
      return;
    }

    const winnerTeam =
      secondInnings.score > firstInnings.score
        ? secondInningsTeamName
        : secondInnings.score < firstInnings.score
          ? firstInningsTeamName
          : 'Tie';

    dispatch(
      setSeriesResultsAction([
        ...(seriesResults || []),
        {
          matchNumber: seriesCurrentMatch,
          firstInningsTeamName,
          secondInningsTeamName,
          firstInningsScore: firstInnings.score,
          firstInningsWickets: firstInnings.wickets,
          firstInningsBalls: firstInnings.balls,
          secondInningsScore: secondInnings.score,
          secondInningsWickets: secondInnings.wickets,
          secondInningsBalls: secondInnings.balls,
          summary: resultSummary,
          winnerTeam,
        },
      ])
    );

    if (seriesCurrentMatch >= seriesLength) {
      dispatch(setStageAction(matchStatusEnum.SeriesSummary));
      return;
    }

    dispatch(setSeriesCurrentMatchAction(seriesCurrentMatch + 1));
    dispatch(setTossWinnerAction(''));
    dispatch(setTossDecisionAction(''));
    dispatch(setTossCallAction(''));
    dispatch(setFirstBattingSideAction(''));
    dispatch(setMatchConditionAction(buildRandomMatchCondition()));
    dispatch(setBattingIntentAction(battingAction.normal));
    dispatch(setBowlingIntentAction(bowlingAction.normal));
    dispatch(setFirstInningsAction(buildInitialInnings()));
    dispatch(setSecondInningsAction(buildInitialInnings()));
    dispatch(setShowScoreboardAction(false));
    dispatch(setStageAction(matchStatusEnum.TossTime));
  };

  const resetMatch = () => {
    seriesResultCommitSignatureRef.current = '';
    tournamentResultCommitSignatureRef.current = '';
    setAutoSimMode(null);
    dispatch(resetMatchRuntime());
  };

  const setSelectedStadium = (value) => {
    const nextCondition = resolveStadiumCondition(value, matchCondition.weather);
    dispatch(setMatchConditionAction(nextCondition));
  };

  const handleTossCall = (call) => {
    const nextCondition = resolveStadiumCondition(selectedStadium, randomKey(weather));
    dispatch(setMatchConditionAction(nextCondition));
    dispatch(setTossCallAction(call));

    const tossFace = Math.random() > 0.5 ? 'crown' : 'dollar';
    const userWins = tossFace === call;
    const userSideTeam = userTeamName || ownTeam;
    const opponentSideTeam = userSideTeam === ownTeam ? opponentTeam : ownTeam;
    const winner = userWins ? userSideTeam : opponentSideTeam;

    dispatch(setTossWinnerAction(winner));
    if (userWins) {
      dispatch(setTossDecisionAction('bat'));
      dispatch(setFirstBattingSideAction(userSideTeam === ownTeam ? 'own' : 'opponent'));
    } else {
      const decision = getOpponentDecision(nextCondition);
      dispatch(setTossDecisionAction(decision));
      dispatch(
        setFirstBattingSideAction(
          decision === 'bat'
            ? (opponentSideTeam === ownTeam ? 'own' : 'opponent')
            : (userSideTeam === ownTeam ? 'own' : 'opponent')
        )
      );
      speak(`${winner} won toss and chose to ${decision} first.`);
    }

    dispatch(setStageAction(matchStatusEnum.TossResult));
  };

  return {
    handleUserTossDecision,
    moveOwnPlayerToXI,
    removeOwnPlayerFromXI,
    moveOpponentPlayerToXI,
    removeOpponentPlayerFromXI,
    setOwnRole,
    setOpponentRole,
    createCustomPlayer,
    autoPickOwnXI,
    autoPickOpponentXI,
    startMatchWithSelectedXI,
    prepareTournamentMatch,
    matchPrimaryAction,
    resetMatch,
    setSelectedStadium,
    handleTossCall,
  };
};
