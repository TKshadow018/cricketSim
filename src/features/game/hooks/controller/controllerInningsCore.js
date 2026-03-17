import { speak } from '../../../../utils/speechUtils';
import { getNextBatterIndex, canSelectNextBatter, canSelectBowler, getMaxOversPerBowler } from '../../../../utils/simulatorUtils';
import { buildPreparedInnings } from '../../utils/controllerInningsSetupUtils';

export const getInningsContext = ({
  isFirstInnings,
  firstSide,
  firstBattingSide,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  isCurrentMatchUserInvolved,
  userTeamName,
}) => {
  const resolvedFirstSide = firstSide || firstBattingSide;
  const isOwnBatting = isFirstInnings ? resolvedFirstSide === 'own' : resolvedFirstSide !== 'own';
  const battingSide = isOwnBatting ? ownPlayers : opponentPlayers;
  const bowlingSide = isOwnBatting ? opponentPlayers : ownPlayers;
  const battingTeamName = isOwnBatting ? ownTeam : opponentTeam;
  const userPlayingThisMatch = isCurrentMatchUserInvolved;
  const isUserBatting = userPlayingThisMatch && battingTeamName === userTeamName;

  return {
    isOwnBatting,
    isUserBatting,
    isUserBowling: userPlayingThisMatch && !isUserBatting,
    battingSide,
    bowlingSide,
  };
};

export const updateInningsState = ({ isFirstInnings, firstInnings, secondInnings, setFirstInnings, setSecondInnings, updater }) => {
  const previous = isFirstInnings ? firstInnings : secondInnings;
  const nextState = typeof updater === 'function' ? updater(previous) : updater;

  if (isFirstInnings) {
    setFirstInnings(nextState);
    return;
  }

  setSecondInnings(nextState);
};

export const openInnings = ({
  firstSide,
  firstBattingSide,
  getContext,
  setFirstInnings,
  setSecondInnings,
  matchType,
  dispatch,
  setShowScoreboardAction,
  firstInningsTeamName,
  setStageAction,
  matchStatusEnum,
}) => {
  const resolvedFirstSide = firstSide || firstBattingSide;
  const firstContext = getContext(true, resolvedFirstSide);
  const secondContext = getContext(false, resolvedFirstSide);

  setFirstInnings(
    buildPreparedInnings({
      battingSide: firstContext.battingSide,
      bowlingSide: firstContext.bowlingSide,
      isUserBatting: firstContext.isUserBatting,
      isUserBowling: firstContext.isUserBowling,
      overs: matchType.over,
    })
  );
  setSecondInnings(
    buildPreparedInnings({
      battingSide: secondContext.battingSide,
      bowlingSide: secondContext.bowlingSide,
      isUserBatting: secondContext.isUserBatting,
      isUserBowling: secondContext.isUserBowling,
      overs: matchType.over,
    })
  );

  dispatch(setShowScoreboardAction(false));
  speak(`${firstInningsTeamName} will bat first.`);
  dispatch(setStageAction(matchStatusEnum.TeamOneBat));
};

export const handleSelectOpener = ({
  isFirstInnings,
  selectedIndex,
  getContext,
  updateState,
}) => {
  const { battingSide } = getContext(isFirstInnings);

  updateState(isFirstInnings, (previous) => {
    if (!previous.needsOpeners) {
      return previous;
    }

    let nextSelections;
    if (previous.openerSelections.includes(selectedIndex)) {
      nextSelections = previous.openerSelections.filter((index) => index !== selectedIndex);
    } else if (previous.openerSelections.length >= 2) {
      nextSelections = [previous.openerSelections[1], selectedIndex];
    } else {
      nextSelections = [...previous.openerSelections, selectedIndex];
    }

    if (nextSelections.length < 2) {
      return {
        ...previous,
        openerSelections: nextSelections,
        lastEvent: 'Choose two openers to begin batting.',
      };
    }

    const [strikerIndex, nonStrikerIndex] = nextSelections;
    const nextBatterIndex = getNextBatterIndex(battingSide, previous.outBatterIndices, [
      strikerIndex,
      nonStrikerIndex,
    ]);

    speak(`${battingSide[strikerIndex]?.name} and ${battingSide[nonStrikerIndex]?.name} will open.`);

    return {
      ...previous,
      needsOpeners: false,
      openerSelections: nextSelections,
      strikerIndex,
      nonStrikerIndex,
      nextBatterIndex,
      battingOrderIndices: [strikerIndex, nonStrikerIndex],
      lastEvent: `Openers set: ${battingSide[strikerIndex]?.name} and ${battingSide[nonStrikerIndex]?.name}.`,
    };
  });
};

export const handleSelectNextBatter = ({
  isFirstInnings,
  batterIndex,
  getContext,
  updateState,
}) => {
  const { battingSide } = getContext(isFirstInnings);

  updateState(isFirstInnings, (previous) => {
    if (!previous.waitingForNextBatter) {
      return previous;
    }

    if (!canSelectNextBatter(previous, batterIndex)) {
      return previous;
    }

    const occupied = [previous.nonStrikerIndex];
    const nextBatterIndex = getNextBatterIndex(battingSide, previous.outBatterIndices, [
      ...occupied,
      batterIndex,
    ]);

    speak(`${battingSide[batterIndex]?.name} comes in next.`);

    return {
      ...previous,
      waitingForNextBatter: false,
      strikerIndex: batterIndex,
      nextBatterIndex,
      battingOrderIndices: previous.battingOrderIndices.includes(batterIndex)
        ? previous.battingOrderIndices
        : [...previous.battingOrderIndices, batterIndex],
      lastEvent: `${battingSide[batterIndex]?.name} is the new batter.`,
    };
  });
};

export const handleSelectBowler = ({
  isFirstInnings,
  bowlerIndex,
  getContext,
  matchType,
  updateState,
}) => {
  const { bowlingSide } = getContext(isFirstInnings);
  const maxOversPerBowler = getMaxOversPerBowler(matchType.over);

  updateState(isFirstInnings, (previous) => {
    if (!previous.waitingForNextBowler) {
      return previous;
    }

    if (!canSelectBowler({ inningState: previous, bowlerIndex, maxOversPerBowler })) {
      return previous;
    }

    speak(`${bowlingSide[bowlerIndex]?.name} will bowl next.`);

    return {
      ...previous,
      waitingForNextBowler: false,
      currentBowlerIndex: bowlerIndex,
      lastEvent: `${bowlingSide[bowlerIndex]?.name} to bowl next.`,
    };
  });
};
