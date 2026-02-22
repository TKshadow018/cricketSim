import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { countries } from '../../../gameData/countries';
import { stadiums } from '../../../gameData/stadiums';
import { playerListForNation } from '../../../gameData/playerListForNation';
import { matchTypeList } from '../../../gameData/matchTypeList';
import { outfieldType, pitchType } from '../../../gameData/matchCondition';
import { runVoice } from '../../../gameData/runVoice';
import { outVoice } from '../../../gameData/outVoice';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import {
  buildInitialInnings,
  buildRandomMatchCondition,
  resetMatchRuntime,
  setBattingIntent as setBattingIntentAction,
  setBowlingIntent as setBowlingIntentAction,
  setCommentator as setCommentatorAction,
  setFirstBattingSide as setFirstBattingSideAction,
  setFirstInnings as setFirstInningsAction,
  setLocationCountry as setLocationCountryAction,
  setMatchCondition as setMatchConditionAction,
  setMatchTypeKey as setMatchTypeKeyAction,
  setOpponentTeam as setOpponentTeamAction,
  setOwnTeam as setOwnTeamAction,
  setSecondInnings as setSecondInningsAction,
  setSelectedStadium as setSelectedStadiumAction,
  setShowScoreboard as setShowScoreboardAction,
  setStage as setStageAction,
  setTossCall as setTossCallAction,
  setTossDecision as setTossDecisionAction,
  setTossWinner as setTossWinnerAction,
  toggleShowScoreboard,
} from '../gameSlice';
import {
  announceTarget,
  announceTeamChoice,
  ballByBallCommentry,
  getAvailableVoices,
  setPreferredVoice,
  speak,
} from '../../../utils/speechUtils';
import {
  battingActionList,
  bowlingActionList,
  canSelectBowler,
  canSelectNextBatter,
  createBattingStats,
  createBowlingStats,
  formatBallProgress,
  getMaxOversPerBowler,
  getNextBatterIndex,
  getOpponentDecision,
  getTopOpenerIndices,
  isEligibleBowler,
  isInningsReadyForNextBall,
  matchVisual,
  oversDisplay,
  randomFrom,
  replaceName,
  resolveResultSummary,
  stageOrder,
} from '../../../utils/simulatorUtils';

// Builds a normalized scoreboard object from innings state and derived view rows.
const buildScorecard = (inningsName, inningsState, inningsView, overText) => ({
  title: inningsName,
  line: `${inningsName} ${inningsState.score}/${inningsState.wickets}`,
  overs: overText,
  battingRows: inningsView.battingRows,
  bowlingRows: inningsView.bowlingRows,
});

const baseMatchWeights = {
  micro: { 0: 10, 1: 20, 2: 20, 3: 3, 4: 20, 6: 15, wide: 1, nb: 1, W: 10 },
  mini: { 0: 15, 1: 25, 2: 15, 3: 4, 4: 17, 6: 12, wide: 1, nb: 1, W: 10 },
  t10: { 0: 20, 1: 25, 2: 15, 3: 5, 4: 15, 6: 10, wide: 1, nb: 1, W: 8 },
  t20: { 0: 25, 1: 25, 2: 15, 3: 5, 4: 12, 6: 8, wide: 1, nb: 1, W: 7 },
  ODI: { 0: 50, 1: 22, 2: 10, 3: 3, 4: 7, 6: 3, wide: 1, nb: 1, W: 3 },
  test: { 0: 65, 1: 17, 2: 8, 3: 1, 4: 5, 6: 1, wide: 1, nb: 1, W: 1 },
};

const abilityShiftByDiff = (difference) => {
  if (difference > 50) {
    return { 0: -10, 1: 4, 2: 2, 3: 1, 4: 4, 6: 2, wide: 0, nb: 0, W: -3 };
  }

  if (difference > 20) {
    return { 0: -7, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, wide: 0, nb: 0, W: -2 };
  }

  if (difference > 5) {
    return { 0: -4, 1: 2, 2: 1, 3: 0, 4: 2, 6: 0, wide: 0, nb: 0, W: -1 };
  }

  if (difference < -50) {
    return { 0: 20, 1: -12, 2: -5, 3: -2, 4: -4, 6: -2, wide: 0, nb: 0, W: 5 };
  }

  if (difference < -20) {
    return { 0: 7, 1: -4, 2: -1, 3: -1, 4: -2, 6: -1, wide: 0, nb: 0, W: 2 };
  }

  if (difference < -5) {
    return { 0: 5, 1: -2, 2: -1, 3: 0, 4: -2, 6: -1, wide: 0, nb: 0, W: 1 };
  }

  return null;
};

const battingIntentShift = {
  [battingAction.defence]: { 0: 15, 1: -4, 2: -2, 3: -1, 4: -4, 6: -2, wide: 0, nb: 0, W: -2 },
  [battingAction.hitBig]: { 0: -10, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, wide: 0, nb: 0, W: 1 },
  [battingAction.superShot]: { 0: -15, 1: 5, 2: 3, 3: 0, 4: 3, 6: 2, wide: 0, nb: 0, W: 2 },
};

const bowlingIntentShift = {
  [bowlingAction.saveRun]: { 0: 20, 1: -8, 2: -3, 3: -1, 4: -4, 6: -2, wide: 0, nb: 0, W: -2 },
  [bowlingAction.tryForWicket]: { 0: -15, 1: 4, 2: 2, 3: 1, 4: 4, 6: 1, wide: 0, nb: 0, W: 3 },
  [bowlingAction.specialBowl]: { 0: -4, 1: -5, 2: -2, 3: -1, 4: 2, 6: 1, wide: 1, nb: 1, W: 7 },
};

export function useCricketSimulatorController() {
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);
  const {
    stage,
    matchTypeKey,
    ownTeam,
    opponentTeam,
    locationCountry,
    commentator,
    tossWinner,
    firstBattingSide,
    matchCondition,
    battingIntent,
    bowlingIntent,
    firstInnings,
    secondInnings,
  } = game;

  const [availableVoices, setAvailableVoices] = useState([]);

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
  const ownPlayers = playerListForNation[ownTeam] || fallbackPlayers;
  const opponentPlayers = playerListForNation[opponentTeam] || fallbackPlayers;
  const venueStadiums = stadiums[locationCountry] || [];

  const isUserWinner = tossWinner === ownTeam;
  const firstInningsTeamName = firstBattingSide === 'own' ? ownTeam : opponentTeam;
  const secondInningsTeamName = firstBattingSide === 'own' ? opponentTeam : ownTeam;

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return undefined;
    }

    // Loads available voices, removes duplicates, and auto-selects a default commentator.
    const syncVoices = () => {
      const voices = getAvailableVoices();
      const uniqueVoices = voices.filter(
        (voice, index, array) => array.findIndex((item) => item.name === voice.name) === index
      );
      setAvailableVoices(uniqueVoices);
      if (!commentator && uniqueVoices.length > 0) {
        dispatch(setCommentatorAction(uniqueVoices[0].name));
        setPreferredVoice(uniqueVoices[0].name);
      }
    };

    syncVoices();
    window.speechSynthesis.onvoiceschanged = syncVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [commentator, dispatch]);

  // Resolves batting/bowling sides and user role for the requested innings.
  const getInningsContext = (isFirstInnings, firstSide = firstBattingSide) => {
    const isOwnBatting = isFirstInnings ? firstSide === 'own' : firstSide !== 'own';
    const battingSide = isOwnBatting ? ownPlayers : opponentPlayers;
    const bowlingSide = isOwnBatting ? opponentPlayers : ownPlayers;

    return {
      isOwnBatting,
      isUserBatting: isOwnBatting,
      isUserBowling: !isOwnBatting,
      battingSide,
      bowlingSide,
    };
  };

  // Redux setter helper for first innings state.
  const setFirstInnings = (value) => dispatch(setFirstInningsAction(value));
  // Redux setter helper for second innings state.
  const setSecondInnings = (value) => dispatch(setSecondInningsAction(value));

  // Applies functional or direct updates to the target innings state.
  const updateInningsState = (isFirstInnings, updater) => {
    const previous = isFirstInnings ? firstInnings : secondInnings;
    const nextState = typeof updater === 'function' ? updater(previous) : updater;

    if (isFirstInnings) {
      setFirstInnings(nextState);
      return;
    }

    setSecondInnings(nextState);
  };

  // Creates initial innings runtime state including opener/bowler preconditions.
  const buildPreparedInnings = ({ battingSide, bowlingSide, isUserBatting, isUserBowling }) => {
    const innings = buildInitialInnings();
    innings.battingStats = createBattingStats(battingSide);
    innings.bowlingStats = createBowlingStats(bowlingSide);
    const eligibleBowlerIndices = bowlingSide
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => isEligibleBowler(player))
      .map(({ index }) => index);

    if (isUserBatting) {
      innings.needsOpeners = true;
      innings.lastEvent = 'Choose your opening pair.';
    } else {
      const [strikerIndex, nonStrikerIndex] = getTopOpenerIndices(battingSide);
      innings.strikerIndex = strikerIndex;
      innings.nonStrikerIndex = nonStrikerIndex;
      innings.battingOrderIndices = Array.from(
        new Set([strikerIndex, nonStrikerIndex].filter((index) => index !== null && index !== undefined))
      );
      innings.nextBatterIndex = getNextBatterIndex(battingSide, [], [strikerIndex, nonStrikerIndex]);
    }

    if (isUserBowling) {
      if (eligibleBowlerIndices.length > 0) {
        innings.waitingForNextBowler = true;
        innings.currentBowlerIndex = null;
        innings.lastEvent = isUserBatting ? innings.lastEvent : 'Choose your opening bowler.';
      } else {
        innings.waitingForNextBowler = false;
        innings.currentBowlerIndex = getBestEligibleBowlerIndex(bowlingSide);
      }
    } else {
      innings.waitingForNextBowler = false;
      const openingBowlerIndex = selectComputerBowler({
        inningState: innings,
        bowlingSide,
        previousBowlerIndex: null,
      });
      innings.currentBowlerIndex = openingBowlerIndex ?? getBestEligibleBowlerIndex(bowlingSide);
    }

    return innings;
  };

  // Returns best available eligible bowler index and never selects a non-bowler.
  const getBestEligibleBowlerIndex = (players = [], excludeIndex = null) => {
    const eligibleIndices = players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => isEligibleBowler(player))
      .map(({ index }) => index);

    if (!eligibleIndices.length) {
      return null;
    }

    const rankedIndices = [...eligibleIndices].sort((left, right) => {
      const leftScore = (players[left]?.paceAbility || 0) + (players[left]?.spinAbility || 0);
      const rightScore = (players[right]?.paceAbility || 0) + (players[right]?.spinAbility || 0);
      return rightScore - leftScore;
    });

    const withoutExcluded = rankedIndices.find((index) => index !== excludeIndex);
    return withoutExcluded ?? rankedIndices[0];
  };

  // Chooses computer bowler with first-four-over pattern and hard validity checks.
  const selectComputerBowler = ({ inningState, bowlingSide, previousBowlerIndex }) => {
    const maxOversPerBowler = getMaxOversPerBowler(matchType.over);
    const completedOverBowlerIndices = inningState.completedOverBowlerIndices || [];
    const nextOverNumber = completedOverBowlerIndices.length + 1;

    const underLimitIndices = bowlingSide
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => isEligibleBowler(player))
      .filter(({ index }) => {
        const balls = inningState.bowlingStats[index]?.balls || 0;
        return Math.floor(balls / 6) < maxOversPerBowler;
      })
      .map(({ index }) => index);

    const validBowlerIndices = underLimitIndices.filter((index) => index !== previousBowlerIndex);

    if (!validBowlerIndices.length) {
      if (underLimitIndices.length) {
        return underLimitIndices[Math.floor(Math.random() * underLimitIndices.length)];
      }

      return null;
    }

    const randomFromIndices = (indices) => indices[Math.floor(Math.random() * indices.length)];
    const paceCandidates = validBowlerIndices.filter((index) => {
      const player = bowlingSide[index];
      return (player?.paceAbility || 0) >= 30 && (player?.paceAbility || 0) >= (player?.spinAbility || 0);
    });

    const bowlerOne = completedOverBowlerIndices[0];
    const bowlerTwo = completedOverBowlerIndices[1];
    const thirdOverBowler = completedOverBowlerIndices[2];

    if (nextOverNumber === 1) {
      if (paceCandidates.length) {
        return randomFromIndices(paceCandidates);
      }
      return randomFromIndices(validBowlerIndices);
    }

    if (nextOverNumber === 2) {
      const pool = validBowlerIndices.filter((index) => index !== bowlerOne);
      return pool.length ? randomFromIndices(pool) : randomFromIndices(validBowlerIndices);
    }

    if (nextOverNumber === 3) {
      const roll = Math.floor(Math.random() * 3) + 1;
      if ((roll === 2 || roll === 3) && validBowlerIndices.includes(bowlerOne)) {
        return bowlerOne;
      }
      const alternatives = validBowlerIndices.filter((index) => index !== bowlerOne && index !== bowlerTwo);
      if (alternatives.length) {
        return randomFromIndices(alternatives);
      }
      return randomFromIndices(validBowlerIndices);
    }

    if (nextOverNumber === 4) {
      const roll = Math.floor(Math.random() * 4) + 1;
      if ((roll === 2 || roll === 3) && validBowlerIndices.includes(bowlerTwo)) {
        return bowlerTwo;
      }
      if (roll === 1) {
        const alternatives = validBowlerIndices.filter(
          (index) => index !== thirdOverBowler && index !== bowlerTwo
        );
        if (alternatives.length) {
          return randomFromIndices(alternatives);
        }
      }
      return randomFromIndices(validBowlerIndices);
    }

    return randomFromIndices(validBowlerIndices);
  };

  // Moves to the next pre-defined stage in the stage order list.
  const goToNextStage = () => {
    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex < stageOrder.length - 1) {
      dispatch(setStageAction(stageOrder[currentIndex + 1]));
    }
  };

  // Initializes both innings based on toss result and jumps to first-innings stage.
  const openInnings = (firstSide = firstBattingSide) => {
    const firstContext = getInningsContext(true, firstSide);
    const secondContext = getInningsContext(false, firstSide);

    setFirstInnings(
      buildPreparedInnings({
        battingSide: firstContext.battingSide,
        bowlingSide: firstContext.bowlingSide,
        isUserBatting: firstContext.isUserBatting,
        isUserBowling: firstContext.isUserBowling,
      })
    );
    setSecondInnings(
      buildPreparedInnings({
        battingSide: secondContext.battingSide,
        bowlingSide: secondContext.bowlingSide,
        isUserBatting: secondContext.isUserBatting,
        isUserBowling: secondContext.isUserBowling,
      })
    );

    dispatch(setShowScoreboardAction(false));
    speak(`${firstInningsTeamName} will bat first.`);
    dispatch(setStageAction(matchStatusEnum.TeamOneBat));
  };

  // Handles opener selection flow until two openers are finalized.
  const handleSelectOpener = (isFirstInnings, selectedIndex) => {
    const { battingSide } = getInningsContext(isFirstInnings);

    updateInningsState(isFirstInnings, (previous) => {
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

  // Handles incoming batter selection after a wicket for user-batting innings.
  const handleSelectNextBatter = (isFirstInnings, batterIndex) => {
    const { battingSide } = getInningsContext(isFirstInnings);

    updateInningsState(isFirstInnings, (previous) => {
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

  // Handles next bowler selection while enforcing over-based constraints.
  const handleSelectBowler = (isFirstInnings, bowlerIndex) => {
    const { bowlingSide } = getInningsContext(isFirstInnings);
    const maxOversPerBowler = getMaxOversPerBowler(matchType.over);

    updateInningsState(isFirstInnings, (previous) => {
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

  // Simulates one-ball outcome using player abilities, intents, and match conditions.
  const resolveOutcome = (striker, bowler, inningState, isUserBatting, isUserBowling) => {
    const outcomes = ['0', '1', '2', '3', '4', '6', 'wide', 'nb', 'W'];
    const weatherKey = matchCondition.weather;
    const pitchProfile = pitchType[matchCondition.pitch] || pitchType.sporting;
    const outfieldProfile = outfieldType[matchCondition.outfield] || outfieldType.lushGreen;
    const isPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
    const bowlingAbility = isPaceBowler ? bowler?.paceAbility || 0 : bowler?.spinAbility || 0;
    const appliedBattingIntent =
      isUserBatting && inningState.freeHitArmed ? battingAction.freeHit : battingIntent;
    const appliedBowlingIntent = bowlingIntent;

    const applyDelta = (weights, delta) => {
      if (!delta) {
        return;
      }

      Object.entries(delta).forEach(([key, value]) => {
        weights[key] = (weights[key] || 0) + value;
      });
    };

    const toPercentAdjusted = (value, percent) => value + value * percent;

    const abilityForPaceBase = (striker?.abilityToPlayPaceBall || 50) + (pitchProfile.goodForBatting || 0);
    const abilityForSpinBase = (striker?.abilityToPlaySpinBall || 50) + (pitchProfile.goodForBatting || 0);
    const bowlerPaceBase = (bowler?.paceAbility || 40) + (pitchProfile.goodForPaceBowling || 0);
    const bowlerSpinBase = (bowler?.spinAbility || 35) + (pitchProfile.goodForSpinBowling || 0);

    let battingPaceAbility = abilityForPaceBase;
    let battingSpinAbility = abilityForSpinBase;
    let bowlingPaceAbility = bowlerPaceBase;
    let bowlingSpinAbility = bowlerSpinBase;

    if (weatherKey === 'rainy') {
      battingPaceAbility = toPercentAdjusted(battingPaceAbility, -0.05);
      battingSpinAbility = toPercentAdjusted(battingSpinAbility, -0.05);
      bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, 0.05);
      bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, 0.05);
    } else if (weatherKey === 'windy') {
      battingPaceAbility = toPercentAdjusted(battingPaceAbility, 0.1);
      battingSpinAbility = toPercentAdjusted(battingSpinAbility, 0.1);
      bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, -0.05);
      bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, -0.05);
    } else if (weatherKey === 'stormy') {
      battingPaceAbility = toPercentAdjusted(battingPaceAbility, -0.05);
      battingSpinAbility = toPercentAdjusted(battingSpinAbility, -0.05);
      bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, 0.02);
      bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, 0.02);
    }

    const activeMatchTypeKey = (() => {
      const isTestLike = ['test', 'practiceTestMicro', 'practiceTestMini'].includes(matchTypeKey);
      if (isTestLike) {
        return 'test';
      }

      const order = ['micro', 'mini', 't10', 't20', 'ODI'];
      const currentIndex = Math.max(0, order.indexOf(matchTypeKey));
      const remainingOvers = Math.max(0, matchType.over - Math.floor(inningState.balls / 6));
      if (remainingOvers < matchType.over * 0.15 && currentIndex > 0) {
        return order[currentIndex - 1];
      }

      return order[currentIndex] || 't20';
    })();

    const weights = { ...(baseMatchWeights[activeMatchTypeKey] || baseMatchWeights.t20) };

    if (outfieldProfile.boundaryScoring < 4) {
      weights['6'] -= 1;
      weights['4'] -= 1;
      weights['0'] += 2;
    } else if (outfieldProfile.boundaryScoring >= 6 && outfieldProfile.boundaryScoring < 8) {
      weights['4'] += 1;
      weights['0'] -= 1;
    } else if (outfieldProfile.boundaryScoring >= 8) {
      weights['6'] += 1;
      weights['4'] += 2;
      weights['0'] -= 3;
    }

    const battingAbility = isPaceBowler ? battingPaceAbility : battingSpinAbility;
    const bowlingMatchAbility = isPaceBowler ? bowlingPaceAbility : bowlingSpinAbility;
    const abilityDifference = battingAbility - bowlingMatchAbility;
    applyDelta(weights, abilityShiftByDiff(abilityDifference));

    if (isUserBatting) {
      applyDelta(weights, battingIntentShift[appliedBattingIntent]);
    }

    if (isUserBowling) {
      applyDelta(weights, bowlingIntentShift[appliedBowlingIntent]);
    }

    const normalized = {};
    outcomes.forEach((outcome) => {
      normalized[outcome] = Math.max(0, Math.round(weights[outcome] || 0));
    });

    if (appliedBattingIntent === battingAction.freeHit) {
      normalized.W = 0;
    }

    const nonDotTotal = outcomes
      .filter((outcome) => outcome !== '0')
      .reduce((sum, outcome) => sum + normalized[outcome], 0);
    normalized['0'] = Math.max(0, 100 - nonDotTotal);

    const total = outcomes.reduce((sum, outcome) => sum + normalized[outcome], 0);
    if (total < 100) {
      normalized['0'] += 100 - total;
    }
    if (total > 100) {
      normalized['0'] = Math.max(0, normalized['0'] - (total - 100));
    }

    const outcomePossibilityArray = [];
    outcomes.forEach((token) => {
      for (let index = 0; index < normalized[token]; index += 1) {
        outcomePossibilityArray.push(token);
      }
    });

    while (outcomePossibilityArray.length < 100) {
      outcomePossibilityArray.push('0');
    }
    if (outcomePossibilityArray.length > 100) {
      outcomePossibilityArray.length = 100;
    }

    const randomIndex = Math.floor(Math.random() * 100);
    const selected = outcomePossibilityArray[randomIndex] || '0';
    if (selected === 'W') {
      return { token: selected, isWicket: true, runs: 0, isLegalDelivery: true, extraRuns: 0 };
    }
    if (selected === 'wide') {
      return { token: selected, isWicket: false, runs: 0, isLegalDelivery: false, extraRuns: 1 };
    }
    if (selected === 'nb') {
      return { token: selected, isWicket: false, runs: 0, isLegalDelivery: false, extraRuns: 1 };
    }

    return {
      token: selected,
      isWicket: false,
      runs: Number(selected),
      isLegalDelivery: true,
      extraRuns: 0,
      strikerAbilityAgainstBowling: battingAbility,
      bowlerAbility: bowlingAbility,
    };
  };

  // Checks if super shot can be used for the current striker with match and over caps.
  const canUseSuperShot = ({ striker, bowler, inningState }) => {
    if (!striker || !bowler) {
      return false;
    }

    const isPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
    const relevantAbility = isPaceBowler ? striker?.abilityToPlayPaceBall || 0 : striker?.abilityToPlaySpinBall || 0;
    const availableShots = 3 + (inningState.superShotBonus || 0) - (inningState.superShotUsedMatch || 0);

    return relevantAbility > 70 && availableShots > 0 && (inningState.superShotUsedInOver || 0) < 1;
  };

  // Checks if special ball can be used by current bowler with caps and earned bonuses.
  const canUseSpecialBall = ({ bowler, inningState }) => {
    if (!bowler) {
      return false;
    }

    const hasAbility = (bowler?.paceAbility || 0) > 70 || (bowler?.spinAbility || 0) > 70;
    const availableBalls = 3 + (inningState.specialBallBonus || 0) - (inningState.specialBallUsedMatch || 0);
    return hasAbility && availableBalls > 0 && (inningState.specialBallUsedInOver || 0) < 1;
  };

  // Processes a single delivery, updates innings state, and transitions stages when needed.
  const processDelivery = (isFirstInnings) => {
    const inningState = isFirstInnings ? firstInnings : secondInnings;
    const { isOwnBatting, isUserBatting, isUserBowling, battingSide, bowlingSide } =
      getInningsContext(isFirstInnings);

    if (!battingSide.length || !bowlingSide.length) {
      return;
    }

    if (
      inningState.needsOpeners ||
      inningState.waitingForNextBatter ||
      inningState.waitingForNextBowler ||
      inningState.strikerIndex === null ||
      inningState.nonStrikerIndex === null
    ) {
      return;
    }

    if (inningState.balls >= maxBalls || inningState.wickets >= 10) {
      dispatch(setStageAction(isFirstInnings ? matchStatusEnum.TeamTwoBat : matchStatusEnum.MatchEnd));
      return;
    }

    const striker = battingSide[inningState.strikerIndex];
    const partner = battingSide[inningState.nonStrikerIndex];
    const fallbackBowlerIndex = getBestEligibleBowlerIndex(bowlingSide, inningState.lastOverBowlerIndex);
    const hasAssignedBowler = inningState.currentBowlerIndex !== null && inningState.currentBowlerIndex !== undefined;
    const currentBowlerIndex = hasAssignedBowler
      ? inningState.currentBowlerIndex
      : isUserBowling
        ? null
        : selectComputerBowler({
            inningState,
            bowlingSide,
            previousBowlerIndex: inningState.lastOverBowlerIndex,
          });

    if (currentBowlerIndex === null || currentBowlerIndex === undefined) {
      return;
    }

    const bowler =
      bowlingSide[currentBowlerIndex] ||
      (fallbackBowlerIndex === null || fallbackBowlerIndex === undefined
        ? null
        : bowlingSide[fallbackBowlerIndex]);

    if (!bowler) {
      return;
    }

    const wasFreeHit = isUserBatting && inningState.freeHitArmed;
    const usedSuperShot = isUserBatting && battingIntent === battingAction.superShot;
    const usedSpecialBall = isUserBowling && bowlingIntent === bowlingAction.specialBowl;
    const outcome = resolveOutcome(striker, bowler, inningState, isUserBatting, isUserBowling);
    const nextBalls = inningState.balls + (outcome.isLegalDelivery ? 1 : 0);
    const ballTag = formatBallProgress(nextBalls);

    let nextScore = inningState.score + (outcome.extraRuns || 0);
    let nextWickets = inningState.wickets;
    let nextStrikerIndex = inningState.strikerIndex;
    let nextNonStrikerIndex = inningState.nonStrikerIndex;
    let nextBatterIndex = inningState.nextBatterIndex;
    let nextBattingOrderIndices = [...(inningState.battingOrderIndices || [])];
    let nextOutBatterIndices = [...inningState.outBatterIndices];
    let nextWaitingForNextBatter = inningState.waitingForNextBatter;
    let nextCurrentBowlerIndex = currentBowlerIndex;
    let nextWaitingForNextBowler = false;
    let nextNoBalls = inningState.noBalls || 0;
    let nextWides = inningState.wides || 0;
    let nextFreeHitArmed = inningState.freeHitArmed || false;
    let nextSuperShotUsedInOver = inningState.superShotUsedInOver || 0;
    let nextSuperShotUsedMatch = inningState.superShotUsedMatch || 0;
    let nextSuperShotBonus = inningState.superShotBonus || 0;
    let nextSpecialBallUsedInOver = inningState.specialBallUsedInOver || 0;
    let nextSpecialBallUsedMatch = inningState.specialBallUsedMatch || 0;
    let nextSpecialBallBonus = inningState.specialBallBonus || 0;
    let nextCompletedOverBowlerIndices = [...(inningState.completedOverBowlerIndices || [])];
    const nextBattingStats = [...inningState.battingStats];
    const nextBowlingStats = [...inningState.bowlingStats];
    let eventLine = '';
    let deliveryCommentary = '';

    const strikerStats = nextBattingStats[inningState.strikerIndex] || {
      runs: 0,
      balls: 0,
      isOut: false,
      outByBowler: '',
      outAtScore: '',
      outAtBall: '',
    };
    if (outcome.isLegalDelivery) {
      nextBattingStats[inningState.strikerIndex] = {
        ...strikerStats,
        balls: (strikerStats.balls || 0) + 1,
      };
    }

    const bowlerStats = nextBowlingStats[currentBowlerIndex] || { balls: 0, runsConceded: 0, wickets: 0 };
    nextBowlingStats[currentBowlerIndex] = {
      ...bowlerStats,
      balls: (bowlerStats.balls || 0) + (outcome.isLegalDelivery ? 1 : 0),
      runsConceded: (bowlerStats.runsConceded || 0) + (outcome.extraRuns || 0),
    };

    if (outcome.token === 'wide') {
      nextWides += 1;
      eventLine = `${striker?.name || 'Batsman'} leaves it. Wide ball signaled.`;
      deliveryCommentary = `${ballTag} ${eventLine}`;
      if (usedSpecialBall) {
        nextSpecialBallUsedInOver += 1;
        nextSpecialBallUsedMatch += 1;
      }
    } else if (outcome.token === 'nb') {
      nextNoBalls += 1;
      nextFreeHitArmed = true;
      eventLine = `${bowler?.name || 'Bowler'} oversteps. No ball and free hit next.`;
      deliveryCommentary = `${ballTag} ${eventLine}`;
      if (usedSpecialBall) {
        nextSpecialBallUsedInOver += 1;
        nextSpecialBallUsedMatch += 1;
      }
    } else if (outcome.isWicket) {
      const outType = Math.floor(Math.random() * outVoice.length);
      eventLine =
        ballByBallCommentry(striker?.name, outType, false, partner?.name) ||
        replaceName(randomFrom(outVoice[outType]), striker?.name, partner?.name);
      deliveryCommentary = `${ballTag} ${eventLine}`;
      nextWickets += 1;
      nextOutBatterIndices = [...nextOutBatterIndices, inningState.strikerIndex];

      nextBattingStats[inningState.strikerIndex] = {
        ...nextBattingStats[inningState.strikerIndex],
        isOut: true,
        outByBowler: bowler?.name || 'Unknown',
        outAtScore: `${nextScore}/${nextWickets}`,
        outAtBall: formatBallProgress(nextBalls),
      };
      nextBowlingStats[currentBowlerIndex] = {
        ...nextBowlingStats[currentBowlerIndex],
        wickets: (nextBowlingStats[currentBowlerIndex]?.wickets || 0) + 1,
      };

      if (usedSuperShot) {
        nextSuperShotUsedInOver += 1;
        nextSuperShotUsedMatch += 1;
      }

      if (usedSpecialBall) {
        nextSpecialBallUsedInOver += 1;
        nextSpecialBallUsedMatch += 1;
      }

      if (isUserBowling) {
        nextSpecialBallBonus += 1;
      }

      const replacementIndex = getNextBatterIndex(battingSide, nextOutBatterIndices, [nextNonStrikerIndex]);

      if (replacementIndex !== -1 && nextWickets < 10) {
        if (isUserBatting) {
          nextStrikerIndex = null;
          nextWaitingForNextBatter = true;
          eventLine = `${eventLine} Choose the next batsman.`;
          nextBatterIndex = getNextBatterIndex(battingSide, nextOutBatterIndices, [nextNonStrikerIndex]);
        } else {
          nextStrikerIndex = replacementIndex;
          if (!nextBattingOrderIndices.includes(replacementIndex)) {
            nextBattingOrderIndices = [...nextBattingOrderIndices, replacementIndex];
          }
          nextBatterIndex = getNextBatterIndex(battingSide, nextOutBatterIndices, [
            nextNonStrikerIndex,
            replacementIndex,
          ]);
        }
      } else {
        nextWickets = 10;
        nextStrikerIndex = null;
      }
    } else {
      nextScore += outcome.runs;
      eventLine =
        ballByBallCommentry(striker?.name, outcome.runs, true, partner?.name) ||
        replaceName(randomFrom(runVoice[outcome.runs]), striker?.name, partner?.name);
      deliveryCommentary = `${ballTag} ${eventLine}`;

      nextBattingStats[inningState.strikerIndex] = {
        ...nextBattingStats[inningState.strikerIndex],
        runs: (nextBattingStats[inningState.strikerIndex]?.runs || 0) + outcome.runs,
      };
      nextBowlingStats[currentBowlerIndex] = {
        ...nextBowlingStats[currentBowlerIndex],
        runsConceded: (nextBowlingStats[currentBowlerIndex]?.runsConceded || 0) + outcome.runs,
      };

      if (outcome.runs === 6 && isUserBatting) {
        nextSuperShotBonus += 1;
      }

      if (usedSuperShot) {
        nextSuperShotUsedInOver += 1;
        nextSuperShotUsedMatch += 1;
      }

      if (usedSpecialBall) {
        nextSpecialBallUsedInOver += 1;
        nextSpecialBallUsedMatch += 1;
      }

      if (outcome.runs % 2 === 1) {
        const temp = nextStrikerIndex;
        nextStrikerIndex = nextNonStrikerIndex;
        nextNonStrikerIndex = temp;
      }
    }

    if (wasFreeHit && outcome.token !== 'nb') {
      nextFreeHitArmed = false;
    }

    if (outcome.isLegalDelivery && nextBalls % 6 === 0 && !nextWaitingForNextBatter) {
      nextCompletedOverBowlerIndices = [...nextCompletedOverBowlerIndices, currentBowlerIndex];
      const temp = nextStrikerIndex;
      nextStrikerIndex = nextNonStrikerIndex;
      nextNonStrikerIndex = temp;
      nextSuperShotUsedInOver = 0;
      nextSpecialBallUsedInOver = 0;

      if (isUserBowling) {
        const hasEligibleBowler = bowlingSide.some(isEligibleBowler);
        if (hasEligibleBowler) {
          nextWaitingForNextBowler = true;
          nextCurrentBowlerIndex = null;
          eventLine = `${eventLine} Over complete. Choose next bowler.`;
        } else {
          nextWaitingForNextBowler = false;
          nextCurrentBowlerIndex = getBestEligibleBowlerIndex(bowlingSide, currentBowlerIndex);
        }
      } else {
        nextCurrentBowlerIndex = selectComputerBowler({
          inningState: {
            ...inningState,
            balls: nextBalls,
            bowlingStats: nextBowlingStats,
            completedOverBowlerIndices: nextCompletedOverBowlerIndices,
          },
          bowlingSide,
          previousBowlerIndex: currentBowlerIndex,
        });
      }
    }

    const nextState = {
      ...inningState,
      score: nextScore,
      wickets: nextWickets,
      balls: nextBalls,
      wides: nextWides,
      noBalls: nextNoBalls,
      strikerIndex: nextStrikerIndex,
      nonStrikerIndex: nextNonStrikerIndex,
      nextBatterIndex,
      battingOrderIndices: nextBattingOrderIndices,
      outBatterIndices: nextOutBatterIndices,
      waitingForNextBatter: nextWaitingForNextBatter,
      currentBowlerIndex: nextCurrentBowlerIndex,
      lastOverBowlerIndex:
        nextBalls % 6 === 0 && !nextWaitingForNextBatter
          ? currentBowlerIndex
          : inningState.lastOverBowlerIndex,
      waitingForNextBowler: nextWaitingForNextBowler,
      battingStats: nextBattingStats,
      bowlingStats: nextBowlingStats,
      freeHitArmed: nextFreeHitArmed,
      superShotUsedInOver: nextSuperShotUsedInOver,
      superShotUsedMatch: nextSuperShotUsedMatch,
      superShotBonus: nextSuperShotBonus,
      specialBallUsedInOver: nextSpecialBallUsedInOver,
      specialBallUsedMatch: nextSpecialBallUsedMatch,
      specialBallBonus: nextSpecialBallBonus,
      completedOverBowlerIndices: nextCompletedOverBowlerIndices,
      lastEvent: eventLine,
      commentary: [deliveryCommentary, ...inningState.commentary].filter(Boolean).slice(0, 10),
    };

    if (isUserBatting && nextState.freeHitArmed && battingIntent !== battingAction.freeHit) {
      dispatch(setBattingIntentAction(battingAction.freeHit));
    }

    if (isUserBatting && !nextState.freeHitArmed && battingIntent === battingAction.freeHit) {
      dispatch(setBattingIntentAction(battingAction.normal));
    }

    if (isUserBatting && battingIntent === battingAction.superShot) {
      const nextCanUseSuperShot = canUseSuperShot({
        striker: battingSide[nextState.strikerIndex],
        bowler: bowlingSide[nextState.currentBowlerIndex ?? currentBowlerIndex],
        inningState: nextState,
      });

      if (!nextCanUseSuperShot) {
        dispatch(setBattingIntentAction(battingAction.normal));
      }
    }

    if (isUserBowling && bowlingIntent === bowlingAction.specialBowl) {
      const nextCanUseSpecialBall = canUseSpecialBall({
        bowler: bowlingSide[nextState.currentBowlerIndex ?? currentBowlerIndex],
        inningState: nextState,
      });

      if (!nextCanUseSpecialBall) {
        dispatch(setBowlingIntentAction(bowlingAction.normal));
      }
    }

    if (isFirstInnings) {
      setFirstInnings(nextState);
      if (nextBalls >= maxBalls || nextWickets >= 10) {
        announceTarget(isOwnBatting ? opponentTeam : ownTeam, nextScore);
        dispatch(setStageAction(matchStatusEnum.TeamTwoBat));
      }
      return;
    }

    setSecondInnings(nextState);
    if (nextScore > firstInnings.score || nextBalls >= maxBalls || nextWickets >= 10) {
      dispatch(setStageAction(matchStatusEnum.MatchEnd));
    }
  };

  // Builds UI-ready view models (candidates, score rows, and readiness flags) for an innings.
  const buildInningsViewModel = (isFirstInnings, inningState) => {
    const { isUserBatting, isUserBowling, battingSide, bowlingSide } = getInningsContext(isFirstInnings);
    const maxOversPerBowler = getMaxOversPerBowler(matchType.over);
    const striker =
      inningState.strikerIndex === null || inningState.strikerIndex === undefined
        ? null
        : battingSide[inningState.strikerIndex];
    const currentBowler =
      inningState.currentBowlerIndex === null || inningState.currentBowlerIndex === undefined
        ? null
        : bowlingSide[inningState.currentBowlerIndex];
    const canUseCurrentSuperShot = canUseSuperShot({
      striker,
      bowler: currentBowler,
      inningState,
    });
    const canUseCurrentSpecialBall = canUseSpecialBall({
      bowler: currentBowler,
      inningState,
    });

    const battingActionOptions = battingActionList.map((action) => {
      if (action.key === battingAction.freeHit) {
        const enabled = !!inningState.freeHitArmed;
        return {
          ...action,
          disabled: !enabled,
          reason: enabled ? '' : 'Available only after a no-ball',
        };
      }

      if (inningState.freeHitArmed) {
        return {
          ...action,
          disabled: action.key !== battingAction.freeHit,
          reason: action.key !== battingAction.freeHit ? 'Free hit required this ball' : '',
        };
      }

      if (action.key === battingAction.superShot) {
        return {
          ...action,
          disabled: !canUseCurrentSuperShot,
          reason: canUseCurrentSuperShot
            ? ''
            : 'Needs ability > 70, max 1 per over, and available credits',
        };
      }

      return { ...action, disabled: false, reason: '' };
    });

    const bowlingActionOptions = bowlingActionList.map((action) => {
      if (action.key === bowlingAction.specialBowl) {
        return {
          ...action,
          disabled: !canUseCurrentSpecialBall,
          reason: canUseCurrentSpecialBall
            ? ''
            : 'Needs pace/spin > 70, max 1 per over, and available credits',
        };
      }

      return { ...action, disabled: false, reason: '' };
    });

    const openerCandidates = battingSide.map((player, index) => ({ index, name: player.name }));

    const nextBatterCandidates = battingSide.map((player, index) => {
      const isOut = inningState.outBatterIndices.includes(index);
      const isCurrent = index === inningState.strikerIndex || index === inningState.nonStrikerIndex;
      const disabled = isOut || isCurrent;

      return {
        index,
        name: player.name,
        disabled,
        reason: isOut ? 'Already out' : isCurrent ? 'Currently batting' : '',
      };
    });

    const bowlerCandidates = bowlingSide
      .map((player, index) => ({
        index,
        name: player.name,
        paceAbility: player?.paceAbility || 0,
        spinAbility: player?.spinAbility || 0,
        balls: inningState.bowlingStats[index]?.balls || 0,
        wasLastOver: inningState.lastOverBowlerIndex === index,
      }))
      .filter((player) => isEligibleBowler(player))
      .map(({ index, name, balls, wasLastOver }) => {
        const completedOvers = Math.floor(balls / 6);
        const hitOverLimit = completedOvers >= maxOversPerBowler;
        const disabled = wasLastOver || hitOverLimit;

        return {
          index,
          name,
          disabled,
          reason: wasLastOver
            ? 'Bowled last over'
            : hitOverLimit
              ? `Over limit reached (${maxOversPerBowler})`
              : '',
        };
      });

    const validOrderedIndices = (inningState.battingOrderIndices || []).filter(
      (index) => Number.isInteger(index) && index >= 0 && index < battingSide.length
    );
    const battingDisplayOrder = [
      ...validOrderedIndices,
      ...battingSide.map((_, index) => index).filter((index) => !validOrderedIndices.includes(index)),
    ];

    const battingRows = battingDisplayOrder.map((index) => {
      const player = battingSide[index];
      if (!player) {
        return null;
      }
      const stat = inningState.battingStats[index] || {
        runs: 0,
        balls: 0,
        isOut: false,
        outByBowler: '',
        outAtScore: '',
        outAtBall: '',
      };
      const strikeRate = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(2) : '0.00';
      const isCurrent = index === inningState.strikerIndex || index === inningState.nonStrikerIndex;

      return {
        name: player.name,
        runs: stat.runs,
        balls: stat.balls,
        strikeRate,
        dismissal: stat.isOut
          ? `b ${stat.outByBowler || 'Unknown'} @ ${stat.outAtScore || '-'} (${stat.outAtBall || '-'})`
          : stat.balls > 0 || isCurrent
            ? 'Not Out'
            : 'Yet to bat',
        isNotOut: !stat.isOut && (stat.balls > 0 || isCurrent),
      };
    }).filter(Boolean);

    const bowlingRows = bowlingSide.map((player, index) => {
      const stat = inningState.bowlingStats[index] || { balls: 0, runsConceded: 0, wickets: 0 };
      const overs = `${Math.floor(stat.balls / 6)}.${stat.balls % 6}`;
      const economy = stat.balls > 0 ? (stat.runsConceded / (stat.balls / 6)).toFixed(2) : '0.00';
      const avgPerWicket = stat.wickets > 0 ? (stat.runsConceded / stat.wickets).toFixed(2) : '-';

      return {
        name: player.name,
        overs,
        runsConceded: stat.runsConceded,
        economy,
        avgPerWicket,
        wickets: stat.wickets,
        isCurrent: index === inningState.currentBowlerIndex,
      };
    }).filter((row) => row.overs !== '0.0');

    return {
      isUserBatting,
      isUserBowling,
      openerCandidates,
      nextBatterCandidates,
      bowlerCandidates,
      battingActionOptions,
      bowlingActionOptions,
      battingRows,
      bowlingRows,
      strikerName:
        inningState.strikerIndex === null ? '' : battingSide[inningState.strikerIndex]?.name || '',
      nonStrikerName:
        inningState.nonStrikerIndex === null ? '' : battingSide[inningState.nonStrikerIndex]?.name || '',
      currentBowlerName:
        inningState.currentBowlerIndex === null
          ? ''
          : bowlingSide[inningState.currentBowlerIndex]?.name || '',
      canPlayNextBall:
        battingSide.length > 0 &&
        bowlingSide.length > 0 &&
        isInningsReadyForNextBall(inningState, maxBalls),
    };
  };

  const firstInningsView = buildInningsViewModel(true, firstInnings);
  const secondInningsView = buildInningsViewModel(false, secondInnings);

  const resultSummary = useMemo(
    () =>
      resolveResultSummary({
        firstInningsScore: firstInnings.score,
        secondInningsScore: secondInnings.score,
        secondInningsWickets: secondInnings.wickets,
        firstInningsTeamName,
        secondInningsTeamName,
      }),
    [
      firstInnings.score,
      firstInningsTeamName,
      secondInnings.score,
      secondInnings.wickets,
      secondInningsTeamName,
    ]
  );

  useEffect(() => {
    if (stage === matchStatusEnum.MatchEnd) {
      speak(resultSummary);
    }
  }, [resultSummary, stage]);

  // Applies toss decision when the user wins and starts innings setup.
  const handleUserTossDecision = (decision) => {
    dispatch(setTossDecisionAction(decision));
    const firstSide = decision === 'bat' ? 'own' : 'opponent';
    dispatch(setFirstBattingSideAction(firstSide));
    announceTeamChoice(ownTeam, decision);
    openInnings(firstSide);
  };

  // Announces forced user role when opponent wins toss and decides first action.
  const handleOpponentWonFlow = (decision, winner) => {
    const remaining = decision === 'bat' ? 'bowl' : 'bat';
    speak(`${winner} chose to ${decision} first. You must ${remaining} first.`);
  };

  // Resolves toss call, condition generation, toss winner, and toss-result stage state.
  const handleTossCall = (call) => {
    const nextCondition = buildRandomMatchCondition();
    dispatch(setMatchConditionAction(nextCondition));
    dispatch(setTossCallAction(call));

    const tossFace = Math.random() > 0.5 ? 'crown' : 'dollar';
    const userWins = tossFace === call;
    const winner = userWins ? ownTeam : opponentTeam;

    dispatch(setTossWinnerAction(winner));
    speak(
      `Match condition: ${nextCondition.weather} weather, ${nextCondition.pitch} pitch, ${nextCondition.outfield} outfield.`
    );

    if (userWins) {
      dispatch(setTossDecisionAction('bat'));
      dispatch(setFirstBattingSideAction('own'));
      speak(`Toss result is ${tossFace}. You won the toss. Choose bat or bowl.`);
    } else {
      const decision = getOpponentDecision(nextCondition);
      dispatch(setTossDecisionAction(decision));
      dispatch(setFirstBattingSideAction(decision === 'bat' ? 'opponent' : 'own'));
      handleOpponentWonFlow(decision, winner);
    }

    dispatch(setStageAction(matchStatusEnum.TossResult));
  };

  // Sets batting intent only when currently allowed for the active user-batting innings.
  const handleSetBattingIntent = (value) => {
    const activeView = firstInningsView.isUserBatting ? firstInningsView : secondInningsView;
    const targetAction = activeView.battingActionOptions.find((action) => action.key === value);
    if (!targetAction || targetAction.disabled) {
      return;
    }

    dispatch(setBattingIntentAction(value));
  };

  // Sets bowling intent only when currently allowed for the active user-bowling innings.
  const handleSetBowlingIntent = (value) => {
    const activeView = firstInningsView.isUserBowling ? firstInningsView : secondInningsView;
    const targetAction = activeView.bowlingActionOptions.find((action) => action.key === value);
    if (!targetAction || targetAction.disabled) {
      return;
    }

    dispatch(setBowlingIntentAction(value));
  };

  // Builds scorecard payload for first-innings UI blocks.
  const buildTeamOneScorecard = () => ({
    currentInnings: buildScorecard(
      `${firstInningsTeamName} Innings`,
      firstInnings,
      firstInningsView,
      oversDisplay(firstInnings.balls)
    ),
    previousInnings: null,
  });

  // Builds scorecard payload for second-innings UI blocks including previous innings.
  const buildTeamTwoScorecard = () => ({
    currentInnings: buildScorecard(
      `${secondInningsTeamName} Innings`,
      secondInnings,
      secondInningsView,
      oversDisplay(secondInnings.balls)
    ),
    previousInnings: buildScorecard(
      `${firstInningsTeamName} Innings`,
      firstInnings,
      firstInningsView,
      oversDisplay(firstInnings.balls)
    ),
  });

  return {
    game,
    availableVoices,
    countryList,
    matchType,
    venueStadiums,
    stageOrder,
    matchVisual,
    firstInningsTeamName,
    secondInningsTeamName,
    isUserWinner,
    firstInningsView,
    secondInningsView,
    teamOneFinal: `${firstInningsTeamName} ${firstInnings.score}/${firstInnings.wickets}`,
    teamTwoFinal: `${secondInningsTeamName} ${secondInnings.score}/${secondInnings.wickets}`,
    resultSummary,
    goToNextStage,
    toggleScoreboard: () => dispatch(toggleShowScoreboard()),
    setMatchTypeKey: (value) => dispatch(setMatchTypeKeyAction(value)),
    setOwnTeam: (value) => dispatch(setOwnTeamAction(value)),
    setOpponentTeam: (value) => dispatch(setOpponentTeamAction(value)),
    setLocationCountry: (value) => dispatch(setLocationCountryAction(value)),
    setSelectedStadium: (value) => dispatch(setSelectedStadiumAction(value)),
    setCommentator: (value) => dispatch(setCommentatorAction(value)),
    setBattingIntent: handleSetBattingIntent,
    setBowlingIntent: handleSetBowlingIntent,
    setPreferredVoice,
    speak,
    processDelivery,
    handleSelectOpener,
    handleSelectNextBatter,
    handleSelectBowler,
    handleTossCall,
    handleUserTossDecision,
    resetMatch: () => dispatch(resetMatchRuntime()),
    oversDisplay,
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
  };
}
