import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../components/ui/AppButton';
import { logoutUser } from '../features/auth/authThunks';
import { useLocalization } from '../localization/LocalizationProvider';
import CricketSimulator from '../features/game/CricketSimulator';
import { matchTypeList } from '../gameData/matchTypeList';
import { getPlayersForNations } from '../gameData/playerListForNation';
import { matchStatusEnum } from '../gameData/matchStatusEnum';
import TeamNameWithFlag from '../features/game/components/TeamNameWithFlag';
import { listRecentMatchHistory } from '../firebase/firestoreService';
import { normalizeSelectedXIPlayers, buildComposition, buildAdminMatrix } from './dashboardUtils';

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
