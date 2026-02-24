import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../components/ui/AppButton';
import { logoutUser } from '../features/auth/authThunks';
import { useLocalization } from '../localization/LocalizationProvider';
import CricketSimulator from '../features/game/CricketSimulator';
import { matchTypeList } from '../gameData/matchTypeList';
import { getPlayersForNations } from '../gameData/playerListForNation';
import { outfieldType, pitchType } from '../gameData/matchCondition';
import { battingAction, bowlingAction } from '../gameData/actionType';
import { matchStatusEnum } from '../gameData/matchStatusEnum';
import TeamNameWithFlag from '../features/game/components/TeamNameWithFlag';
import { listRecentMatchHistory } from '../firebase/firestoreService';

const baseMatchWeights = {
  micro: { 0: 10, 1: 20, 2: 20, 3: 3, 4: 20, 6: 15, wide: 1, nb: 1, W: 10 },
  mini: { 0: 15, 1: 25, 2: 15, 3: 4, 4: 17, 6: 12, wide: 1, nb: 1, W: 10 },
  t10: { 0: 20, 1: 25, 2: 15, 3: 5, 4: 15, 6: 10, wide: 1, nb: 1, W: 8 },
  t20: { 0: 25, 1: 25, 2: 15, 3: 5, 4: 12, 6: 8, wide: 1, nb: 1, W: 7 },
  ODI: { 0: 50, 1: 22, 2: 10, 3: 3, 4: 7, 6: 3, wide: 1, nb: 1, W: 3 },
  test: { 0: 65, 1: 17, 2: 8, 3: 1, 4: 5, 6: 1, wide: 1, nb: 1, W: 1 },
};

const abilityShiftByDiff = (difference) => {
  if (difference > 50) return { 0: -10, 1: 4, 2: 2, 3: 1, 4: 4, 6: 2, wide: 0, nb: 0, W: -3 };
  if (difference > 20) return { 0: -7, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, wide: 0, nb: 0, W: -2 };
  if (difference > 5) return { 0: -4, 1: 2, 2: 1, 3: 0, 4: 2, 6: 0, wide: 0, nb: 0, W: -1 };
  if (difference < -50) return { 0: 20, 1: -12, 2: -5, 3: -2, 4: -4, 6: -2, wide: 0, nb: 0, W: 5 };
  if (difference < -20) return { 0: 7, 1: -4, 2: -1, 3: -1, 4: -2, 6: -1, wide: 0, nb: 0, W: 2 };
  if (difference < -5) return { 0: 5, 1: -2, 2: -1, 3: 0, 4: -2, 6: -1, wide: 0, nb: 0, W: 1 };
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

const battingLabels = {
  [battingAction.defence]: 'Defend',
  [battingAction.hitBig]: 'Hit Big',
  [battingAction.normal]: 'Normal',
  [battingAction.superShot]: 'Super Shot',
  [battingAction.freeHit]: 'Free Hit',
};

const bowlingLabels = {
  [bowlingAction.normal]: 'Normal',
  [bowlingAction.tryForWicket]: 'Wicket Ball',
  [bowlingAction.saveRun]: 'Save Run',
  [bowlingAction.specialBowl]: 'Special Ball',
};

const outcomeOrder = ['0', '1', '2', '3', '4', '6', 'wide', 'nb', 'W'];

const normalizeSelectedXIPlayers = (allPlayers, selectedIds) => {
  const validIds = new Set((allPlayers || []).map((player) => player.id));
  const normalizedIds = Array.from(new Set((selectedIds || []).filter((id) => validIds.has(id)))).slice(0, 11);
  return normalizedIds
    .map((id) => (allPlayers || []).find((player) => player.id === id))
    .filter(Boolean);
};

const classifyPlayer = (player) => {
  const pace = player?.paceAbility || 0;
  const spin = player?.spinAbility || 0;
  const batCombined = (player?.abilityToPlayPaceBall || 0) + (player?.abilityToPlaySpinBall || 0);

  if (player?.isWicketKeeper) {
    return 'wicketkeeper';
  }

  if (pace > 50 && pace > spin && batCombined < 100) {
    return 'pacer';
  }

  if (spin > 50 && pace < spin && batCombined < 100) {
    return 'spinner';
  }

  if (batCombined > 100 && spin < 50 && pace < 50) {
    return 'batsman';
  }

  if (batCombined > 100 && (pace > 50 || spin > 50)) {
    return 'allrounder';
  }

  return 'none';
};

const buildComposition = (selectedPlayers) => {
  const counts = {
    batsman: 0,
    allrounder: 0,
    pacer: 0,
    spinner: 0,
    wicketkeeper: 0,
    none: 0,
  };

  (selectedPlayers || []).forEach((player) => {
    const category = classifyPlayer(player);
    if (category in counts) {
      counts[category] += 1;
    }
  });

  return counts;
};

const buildAdminMatrix = (gameState) => {
  const matchType = matchTypeList[gameState.matchTypeKey] || matchTypeList.t20;
  const { ownPlayers: fullOwnPlayers, opponentPlayers: fullOpponentPlayers } = getPlayersForNations(
    gameState.ownTeam,
    gameState.opponentTeam
  );

  const normalizePlayingXI = (allPlayers, selectedIds) => {
    const validIds = new Set(allPlayers.map((player) => player.id));
    const normalizedIds = Array.from(new Set((selectedIds || []).filter((id) => validIds.has(id)))).slice(0, 11);
    const finalIds = normalizedIds.length === 11 ? normalizedIds : allPlayers.slice(0, 11).map((player) => player.id);
    const byId = new Map(allPlayers.map((player) => [player.id, player]));
    return finalIds.map((id) => byId.get(id)).filter(Boolean);
  };

  const ownPlayers = normalizePlayingXI(
    [...fullOwnPlayers, ...((gameState.ownCustomPlayers || []))],
    gameState.ownPlayingXI
  );
  const opponentPlayers = normalizePlayingXI(
    [...fullOpponentPlayers, ...((gameState.opponentCustomPlayers || []))],
    gameState.opponentPlayingXI
  );
  const isFirst = gameState.stage !== matchStatusEnum.TeamTwoBat;
  const innings = isFirst ? gameState.firstInnings : gameState.secondInnings;
  const isOwnBatting = isFirst ? gameState.firstBattingSide === 'own' : gameState.firstBattingSide !== 'own';
  const battingSide = isOwnBatting ? ownPlayers : opponentPlayers;
  const bowlingSide = isOwnBatting ? opponentPlayers : ownPlayers;
  const striker = battingSide[innings?.strikerIndex ?? -1];
  const bowler = bowlingSide[innings?.currentBowlerIndex ?? -1];
  const battingRoles = isOwnBatting ? gameState.ownTeamRoles : gameState.opponentTeamRoles;
  const bowlingRoles = isOwnBatting ? gameState.opponentTeamRoles : gameState.ownTeamRoles;
  const bowlingTeamName = isOwnBatting ? gameState.opponentTeam : gameState.ownTeam;

  const isPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
  const pitchProfile = pitchType[gameState.matchCondition?.pitch] || pitchType.sporting;
  const outfieldProfile = outfieldType[gameState.matchCondition?.outfield] || outfieldType.lushGreen;
  const weatherKey = gameState.matchCondition?.weather;

  const applyDelta = (weights, delta) => {
    if (!delta) return;
    Object.entries(delta).forEach(([key, value]) => {
      weights[key] = (weights[key] || 0) + value;
    });
  };

  const toPercentAdjusted = (value, percent) => value + value * percent;

  const activeMatchTypeKey = (() => {
    const isTestLike = ['test', 'practiceTestMicro', 'practiceTestMini'].includes(gameState.matchTypeKey);
    if (isTestLike) return 'test';
    const order = ['micro', 'mini', 't10', 't20', 'ODI'];
    const currentIndex = Math.max(0, order.indexOf(gameState.matchTypeKey));
    const remainingOvers = Math.max(0, matchType.over - Math.floor((innings?.balls || 0) / 6));
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

  const abilityForPaceBase = (striker?.abilityToPlayPaceBall || 50) + (pitchProfile.goodForBatting || 0);
  const abilityForSpinBase = (striker?.abilityToPlaySpinBall || 50) + (pitchProfile.goodForBatting || 0);
  const bowlerPaceBase = (bowler?.paceAbility || 40) + (pitchProfile.goodForPaceBowling || 0);
  const bowlerSpinBase = (bowler?.spinAbility || 35) + (pitchProfile.goodForSpinBowling || 0);

  let battingPaceAbility = abilityForPaceBase;
  let battingSpinAbility = abilityForSpinBase;
  let bowlingPaceAbility = bowlerPaceBase;
  let bowlingSpinAbility = bowlerSpinBase;

  if (bowlingTeamName && bowlingTeamName === gameState.locationCountry) {
    bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, 0.05);
    bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, 0.05);
  }

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

  const battingAbility = striker ? (isPaceBowler ? battingPaceAbility : battingSpinAbility) : 0;
  const bowlingAbility = bowler ? (isPaceBowler ? bowlingPaceAbility : bowlingSpinAbility) : 0;
  const abilityDifference = battingAbility - bowlingAbility;

  if (striker?.id && battingRoles?.captainId === striker.id) {
    applyDelta(weights, { 0: -3, 1: 3 });
  }

  if (striker?.id && battingRoles?.viceCaptainId === striker.id) {
    applyDelta(weights, { 0: -1, 1: 1 });
  }

  if (bowler?.id && bowlingRoles?.captainId === bowler.id) {
    applyDelta(weights, { 0: 3, 1: -3 });
  }

  if (bowler?.id && bowlingRoles?.viceCaptainId === bowler.id) {
    applyDelta(weights, { 0: 1, 1: -1 });
  }

  if (striker && bowler) {
    applyDelta(weights, abilityShiftByDiff(abilityDifference));
  }

  const isUserBatting = isOwnBatting;
  const isUserBowling = !isOwnBatting;
  const appliedBattingIntent = isUserBatting && innings?.freeHitArmed ? battingAction.freeHit : gameState.battingIntent;

  if (isUserBatting) applyDelta(weights, battingIntentShift[appliedBattingIntent]);
  if (isUserBowling) applyDelta(weights, bowlingIntentShift[gameState.bowlingIntent]);

  const normalized = {};
  outcomeOrder.forEach((outcome) => {
    normalized[outcome] = Math.max(0, Math.round(weights[outcome] || 0));
  });

  if (appliedBattingIntent === battingAction.freeHit) {
    normalized.W = 0;
  }

  const nonDotTotal = outcomeOrder
    .filter((item) => item !== '0')
    .reduce((sum, item) => sum + normalized[item], 0);
  normalized['0'] = Math.max(0, 100 - nonDotTotal);

  return {
    isOwnBatting,
    strikerName: striker?.name || '-',
    bowlerName: bowler?.name || '-',
    battingAbility: Math.round(battingAbility),
    bowlingAbility: Math.round(bowlingAbility),
    abilityDifference: Math.round(abilityDifference),
    bowlingType: isPaceBowler ? 'Pace' : 'Spin',
    battingIntentLabel: battingLabels[appliedBattingIntent] || 'Normal',
    bowlingIntentLabel: bowlingLabels[gameState.bowlingIntent] || 'Normal',
    factors: {
      weather: gameState.matchCondition?.weather || '-',
      pitch: gameState.matchCondition?.pitch || '-',
      outfield: gameState.matchCondition?.outfield || '-',
      battingSupport: pitchProfile.goodForBatting,
      paceSupport: pitchProfile.goodForPaceBowling,
      spinSupport: pitchProfile.goodForSpinBowling,
      boundaryScoring: outfieldProfile.boundaryScoring,
      phase: Math.max(0, matchType.over - Math.floor((innings?.balls || 0) / 6)) < matchType.over * 0.15
        ? 'Death Phase'
        : 'Normal Phase',
      oversLeft: Math.max(0, matchType.over - Math.floor((innings?.balls || 0) / 6)),
    },
    rows: outcomeOrder.map((key) => ({ key, value: normalized[key] || 0 })),
  };
};

function DashboardPage() {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  const game = useSelector((state) => state.game);
  const { t } = useLocalization();
  const [recentMatchHistory, setRecentMatchHistory] = React.useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false);

  const adminEmail = (process.env.REACT_APP_FIREBASE_ADMIN_EMAIL || '').trim().toLowerCase();
  const isAdmin = !!adminEmail && (user?.email || '').toLowerCase() === adminEmail;
  const isMatrixStage = [matchStatusEnum.TeamOneBat, matchStatusEnum.TeamTwoBat].includes(game.stage);
  const isSelectionProfileStage = [
    matchStatusEnum.ChooseOwnPlayingXI,
    matchStatusEnum.ChooseOpponentPlayingXI,
  ].includes(game.stage);
  const adminMatrix = React.useMemo(() => (isAdmin ? buildAdminMatrix(game) : null), [game, isAdmin]);
  const selectedMatchType = matchTypeList[game.matchTypeKey];
  const { ownPlayers: ownNationPlayers, opponentPlayers: opponentNationPlayers } = getPlayersForNations(
    game.ownTeam,
    game.opponentTeam
  );
  const ownAllPlayers = [...(ownNationPlayers || []), ...(game.ownCustomPlayers || [])];
  const opponentAllPlayers = [...(opponentNationPlayers || []), ...(game.opponentCustomPlayers || [])];
  const ownSelectedPlayers = normalizeSelectedXIPlayers(ownAllPlayers, game.ownPlayingXI);
  const opponentSelectedPlayers = normalizeSelectedXIPlayers(opponentAllPlayers, game.opponentPlayingXI);
  const ownComposition = buildComposition(ownSelectedPlayers);
  const opponentComposition = buildComposition(opponentSelectedPlayers);

  const loadRecentHistory = React.useCallback(async () => {
    if (!user?.uid) {
      setRecentMatchHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    try {
      const history = await listRecentMatchHistory(user.uid, 10);
      setRecentMatchHistory(Array.isArray(history) ? history.slice(0, 10) : []);
    } catch {
      setRecentMatchHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    loadRecentHistory();
  }, [loadRecentHistory]);

  React.useEffect(() => {
    if (game.stage !== matchStatusEnum.MatchEnd) {
      return;
    }

    const timer = setTimeout(() => {
      loadRecentHistory();
    }, 650);

    return () => clearTimeout(timer);
  }, [game.stage, loadRecentHistory]);

  const formatHistoryDate = (value) => {
    if (value?.toDate) {
      return value.toDate().toLocaleString();
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }

    return 'Recently finished';
  };

  const oversFromBalls = (balls = 0) => `${Math.floor((Number(balls) || 0) / 6)}.${(Number(balls) || 0) % 6}`;

  const onLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <main className="dashboard-page game-dashboard-page dashboard-shell">
      <header className="dashboard-navbar">
        <div>
          <p className="dashboard-kicker">{t('dashboard.kicker')}</p>
          <h1 className="dashboard-title">
            {t('dashboard.welcome', { name: user?.displayName || t('dashboard.fallbackName') })}
          </h1>
        </div>
        <AppButton
          text={t('dashboard.logout')}
          variant="secondary"
          onClick={onLogout}
          isLoading={isLoading}
          fullWidth={false}
        />
      </header>

      <div className="dashboard-main-grid">
        <aside className="dashboard-sidebar dashboard-sidebar-left">
          {isAdmin && isMatrixStage ? (
            <>
              <h3>Admin Matrix</h3>
              <p>Role: {adminMatrix?.isOwnBatting ? 'User Batting' : 'User Bowling'}</p>
              <p>Striker: {adminMatrix?.strikerName}</p>
              <p>Bowler: {adminMatrix?.bowlerName}</p>
              <p>Bat Intent: {adminMatrix?.battingIntentLabel}</p>
              <p>Bowl Intent: {adminMatrix?.bowlingIntentLabel}</p>
              <div className="admin-matrix-table">
                {adminMatrix?.rows.map((row) => (
                  <div key={row.key} className="admin-matrix-row">
                    <span>{row.key}</span>
                    <strong>{row.value}%</strong>
                  </div>
                ))}
              </div>

              <h3 className="admin-matrix-subhead">Ability Snapshot</h3>
              <div className="admin-matrix-table">
                <div className="admin-matrix-row">
                  <span>Bowling Type</span>
                  <strong>{adminMatrix?.bowlingType}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Batsman Ability</span>
                  <strong>{adminMatrix?.battingAbility}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Bowler Ability</span>
                  <strong>{adminMatrix?.bowlingAbility}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Ability Difference</span>
                  <strong>{adminMatrix?.abilityDifference}</strong>
                </div>
              </div>

              <h3 className="admin-matrix-subhead">Performance Factors</h3>
              <div className="admin-matrix-table">
                <div className="admin-matrix-row">
                  <span>Weather</span>
                  <strong>{adminMatrix?.factors?.weather}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Pitch</span>
                  <strong>{adminMatrix?.factors?.pitch}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Outfield</span>
                  <strong>{adminMatrix?.factors?.outfield}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Pitch Batting Support</span>
                  <strong>{adminMatrix?.factors?.battingSupport}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Pitch Pace Support</span>
                  <strong>{adminMatrix?.factors?.paceSupport}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Pitch Spin Support</span>
                  <strong>{adminMatrix?.factors?.spinSupport}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Boundary Scoring</span>
                  <strong>{adminMatrix?.factors?.boundaryScoring}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Match Phase</span>
                  <strong>{adminMatrix?.factors?.phase}</strong>
                </div>
                <div className="admin-matrix-row">
                  <span>Overs Left</span>
                  <strong>{adminMatrix?.factors?.oversLeft}</strong>
                </div>
              </div>

              {isSelectionProfileStage ? (
                <>
                  <h3 className="admin-matrix-subhead">Selection Profile</h3>
                  <div className="admin-matrix-table">
                    <div className="admin-matrix-row">
                      <span><TeamNameWithFlag teamName={game.ownTeam} /> selected</span>
                      <strong>{ownSelectedPlayers.length}/11</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Batsman</span>
                      <strong>{ownComposition.batsman}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Allrounder</span>
                      <strong>{ownComposition.allrounder}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Pacer</span>
                      <strong>{ownComposition.pacer}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Spinner</span>
                      <strong>{ownComposition.spinner}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Wicketkeeper</span>
                      <strong>{ownComposition.wicketkeeper}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>None</span>
                      <strong>{ownComposition.none}</strong>
                    </div>
                  </div>

                  <div className="admin-matrix-table">
                    <div className="admin-matrix-row">
                      <span><TeamNameWithFlag teamName={game.opponentTeam} /> selected</span>
                      <strong>{opponentSelectedPlayers.length}/11</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Batsman</span>
                      <strong>{opponentComposition.batsman}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Allrounder</span>
                      <strong>{opponentComposition.allrounder}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Pacer</span>
                      <strong>{opponentComposition.pacer}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Spinner</span>
                      <strong>{opponentComposition.spinner}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>Wicketkeeper</span>
                      <strong>{opponentComposition.wicketkeeper}</strong>
                    </div>
                    <div className="admin-matrix-row">
                      <span>None</span>
                      <strong>{opponentComposition.none}</strong>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : isAdmin ? (
            <>
              <h3>Admin Matrix</h3>
              <p>Matrix is visible only during TeamOneBat or TeamTwoBat stages.</p>
              <p>Start or load an innings to see live probabilities and factors.</p>

              {isSelectionProfileStage ? (
                <>
                  <h3 className="admin-matrix-subhead">Selection Profile</h3>
                  <div className="admin-matrix-table">
                    <div className="admin-matrix-row">
                      <span><TeamNameWithFlag teamName={game.ownTeam} /> selected</span>
                      <strong>{ownSelectedPlayers.length}/11</strong>
                    </div>
                    <div className="admin-matrix-row"><span>Batsman</span><strong>{ownComposition.batsman}</strong></div>
                    <div className="admin-matrix-row"><span>Allrounder</span><strong>{ownComposition.allrounder}</strong></div>
                    <div className="admin-matrix-row"><span>Pacer</span><strong>{ownComposition.pacer}</strong></div>
                    <div className="admin-matrix-row"><span>Spinner</span><strong>{ownComposition.spinner}</strong></div>
                    <div className="admin-matrix-row"><span>Wicketkeeper</span><strong>{ownComposition.wicketkeeper}</strong></div>
                    <div className="admin-matrix-row"><span>None</span><strong>{ownComposition.none}</strong></div>
                  </div>

                  <div className="admin-matrix-table">
                    <div className="admin-matrix-row">
                      <span><TeamNameWithFlag teamName={game.opponentTeam} /> selected</span>
                      <strong>{opponentSelectedPlayers.length}/11</strong>
                    </div>
                    <div className="admin-matrix-row"><span>Batsman</span><strong>{opponentComposition.batsman}</strong></div>
                    <div className="admin-matrix-row"><span>Allrounder</span><strong>{opponentComposition.allrounder}</strong></div>
                    <div className="admin-matrix-row"><span>Pacer</span><strong>{opponentComposition.pacer}</strong></div>
                    <div className="admin-matrix-row"><span>Spinner</span><strong>{opponentComposition.spinner}</strong></div>
                    <div className="admin-matrix-row"><span>Wicketkeeper</span><strong>{opponentComposition.wicketkeeper}</strong></div>
                    <div className="admin-matrix-row"><span>None</span><strong>{opponentComposition.none}</strong></div>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <>
              <h3>Quick Panel</h3>
              <p>Use setup stages, choose strategies, and simulate ball-by-ball.</p>
              <p>Desktop layout keeps controls and match board visible together.</p>

              {isSelectionProfileStage ? (
                <>
                  <h3 className="admin-matrix-subhead">Selection Profile</h3>
                  <div className="admin-matrix-table">
                    <div className="admin-matrix-row">
                      <span><TeamNameWithFlag teamName={game.ownTeam} /> selected</span>
                      <strong>{ownSelectedPlayers.length}/11</strong>
                    </div>
                    <div className="admin-matrix-row"><span>Batsman</span><strong>{ownComposition.batsman}</strong></div>
                    <div className="admin-matrix-row"><span>Allrounder</span><strong>{ownComposition.allrounder}</strong></div>
                    <div className="admin-matrix-row"><span>Pacer</span><strong>{ownComposition.pacer}</strong></div>
                    <div className="admin-matrix-row"><span>Spinner</span><strong>{ownComposition.spinner}</strong></div>
                    <div className="admin-matrix-row"><span>Wicketkeeper</span><strong>{ownComposition.wicketkeeper}</strong></div>
                    <div className="admin-matrix-row"><span>None</span><strong>{ownComposition.none}</strong></div>
                  </div>

                  <div className="admin-matrix-table">
                    <div className="admin-matrix-row">
                      <span><TeamNameWithFlag teamName={game.opponentTeam} /> selected</span>
                      <strong>{opponentSelectedPlayers.length}/11</strong>
                    </div>
                    <div className="admin-matrix-row"><span>Batsman</span><strong>{opponentComposition.batsman}</strong></div>
                    <div className="admin-matrix-row"><span>Allrounder</span><strong>{opponentComposition.allrounder}</strong></div>
                    <div className="admin-matrix-row"><span>Pacer</span><strong>{opponentComposition.pacer}</strong></div>
                    <div className="admin-matrix-row"><span>Spinner</span><strong>{opponentComposition.spinner}</strong></div>
                    <div className="admin-matrix-row"><span>Wicketkeeper</span><strong>{opponentComposition.wicketkeeper}</strong></div>
                    <div className="admin-matrix-row"><span>None</span><strong>{opponentComposition.none}</strong></div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </aside>

        <section className="dashboard-center">
          <section className="dashboard-card game-dashboard-card">
            <CricketSimulator />
          </section>
        </section>

        <aside className="dashboard-sidebar dashboard-sidebar-right">
          <h3>Match Notes</h3>
          {selectedMatchType?.nameKey ? <p>Format: {selectedMatchType.nameKey.toUpperCase()}</p> : null}
          {game.ownTeam || game.opponentTeam ? (
            <p>
              Teams:{' '}
              {game.ownTeam ? <TeamNameWithFlag teamName={game.ownTeam} /> : null}
              {game.ownTeam && game.opponentTeam ? ' vs ' : null}
              {game.opponentTeam ? <TeamNameWithFlag teamName={game.opponentTeam} /> : null}
            </p>
          ) : null}
          {game.locationCountry ? <p>Location Country: {game.locationCountry}</p> : null}
          {game.selectedStadium ? <p>Stadium: {game.selectedStadium}</p> : null}
          {game.matchCondition?.weather ? <p>Weather: {game.matchCondition.weather}</p> : null}
          {game.matchCondition?.pitch ? <p>Pitch: {game.matchCondition.pitch}</p> : null}
          {game.matchCondition?.outfield ? <p>Outfield: {game.matchCondition.outfield}</p> : null}
          {game.tossWinner ? (
            <p>
              Toss Winner: <TeamNameWithFlag teamName={game.tossWinner} />
            </p>
          ) : null}
          {game.tossDecision ? <p>Toss Decision: {game.tossDecision}</p> : null}

          {game.stage === matchStatusEnum.intro ? (
            <>
              <h3 className="admin-matrix-subhead">Recent Match History (Last 10)</h3>
              {isHistoryLoading ? <p>Loading history...</p> : null}
              {!isHistoryLoading && !recentMatchHistory.length ? <p>No completed matches saved yet.</p> : null}
              {!isHistoryLoading && recentMatchHistory.length ? (
                <div className="dashboard-history-list">
                  {recentMatchHistory.map((entry) => (
                    <div key={entry.id} className="admin-matrix-row dashboard-history-item">
                      <div>
                        <strong>
                          <TeamNameWithFlag teamName={entry.ownTeam} showDashForEmpty /> vs{' '}
                          <TeamNameWithFlag teamName={entry.opponentTeam} showDashForEmpty />
                        </strong>
                        <p>
                          {entry.firstInningsTeamName}: {entry.firstInningsScore}/{entry.firstInningsWickets}
                          {' '}({oversFromBalls(entry.firstInningsBalls)}) • {entry.secondInningsTeamName}: {entry.secondInningsScore}/
                          {entry.secondInningsWickets} ({oversFromBalls(entry.secondInningsBalls)})
                        </p>
                        <p>{entry.summary || 'Result saved'}</p>
                        <small>{formatHistoryDate(entry.updatedAt)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

export default DashboardPage;
