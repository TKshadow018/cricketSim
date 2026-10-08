import gameReducer, {
  setStage,
  setGameMode,
  setSeriesLength,
  setSeriesCurrentMatch,
  setSeriesResults,
  setOwnTeam,
  setOpponentTeam,
  setOwnPlayingXI,
  setOpponentPlayingXI,
  setOwnTeamRoles,
  setBattingIntent,
  setBowlingIntent,
  setFirstInnings,
  setSecondInnings,
  setShowScoreboard,
  toggleShowScoreboard,
  hydrateGameState,
  resetMatchRuntime,
  setTournamentUserTeam,
  setTournamentOpponentTeams,
  setTournamentMatches,
  setTournamentCurrentMatchId,
  setTournamentChampion,
  setMatchTypeKey,
  setLocationCountry,
  setSelectedStadium,
  setCommentator,
  setTossWinner,
  setTossDecision,
  setTossCall,
  setFirstBattingSide,
  setMatchCondition,
  setSeriesPlayerStats,
  setTournamentPlayerStats,
  buildInitialInnings,
} from './gameSlice';

const getInitialState = () => gameReducer(undefined, { type: '@@INIT' });

describe('gameSlice initial state', () => {
  it('has stage intro (0)', () => {
    expect(getInitialState().stage).toBe(0);
  });

  it('has gameMode "quick"', () => {
    expect(getInitialState().gameMode).toBe('quick');
  });

  it('has seriesLength 1', () => {
    expect(getInitialState().seriesLength).toBe(1);
  });

  it('has empty ownTeam string', () => {
    expect(getInitialState().ownTeam).toBe('');
  });

  it('has showScoreboard false', () => {
    expect(getInitialState().showScoreboard).toBe(false);
  });
});

describe('setStage', () => {
  it('updates stage', () => {
    expect(gameReducer(getInitialState(), setStage(5)).stage).toBe(5);
  });
});

describe('setGameMode', () => {
  it('updates gameMode', () => {
    expect(gameReducer(getInitialState(), setGameMode('series')).gameMode).toBe('series');
  });
});

describe('setSeriesLength', () => {
  it('updates seriesLength', () => {
    expect(gameReducer(getInitialState(), setSeriesLength(5)).seriesLength).toBe(5);
  });

  it('clamps to 1 for invalid values', () => {
    expect(gameReducer(getInitialState(), setSeriesLength(0)).seriesLength).toBe(1);
    expect(gameReducer(getInitialState(), setSeriesLength(-3)).seriesLength).toBe(1);
    expect(gameReducer(getInitialState(), setSeriesLength('abc')).seriesLength).toBe(1);
  });
});

describe('setSeriesCurrentMatch', () => {
  it('updates seriesCurrentMatch', () => {
    expect(gameReducer(getInitialState(), setSeriesCurrentMatch(3)).seriesCurrentMatch).toBe(3);
  });

  it('clamps to 1 for invalid values', () => {
    expect(gameReducer(getInitialState(), setSeriesCurrentMatch(0)).seriesCurrentMatch).toBe(1);
  });
});

describe('setSeriesResults', () => {
  it('sets results array', () => {
    const results = [{ winnerTeam: 'India' }];
    expect(gameReducer(getInitialState(), setSeriesResults(results)).seriesResults).toEqual(results);
  });

  it('defaults to empty array for non-array', () => {
    expect(gameReducer(getInitialState(), setSeriesResults('invalid')).seriesResults).toEqual([]);
  });
});

describe('setOwnTeam', () => {
  it('sets ownTeam and resets XI/roles/custom players', () => {
    const state = {
      ...getInitialState(),
      ownTeam: 'OldTeam',
      ownPlayingXI: ['p1', 'p2'],
      ownCustomPlayers: [{ id: 'custom1' }],
      ownTeamRoles: { captainId: 'p1', viceCaptainId: 'p2', wicketKeeperId: 'p3' },
    };
    const next = gameReducer(state, setOwnTeam('India'));
    expect(next.ownTeam).toBe('India');
    expect(next.ownPlayingXI).toEqual([]);
    expect(next.ownCustomPlayers).toEqual([]);
    expect(next.ownTeamRoles.captainId).toBeNull();
  });
});

describe('setOpponentTeam', () => {
  it('sets opponentTeam and resets XI/roles/custom players', () => {
    const state = {
      ...getInitialState(),
      opponentTeam: 'OldTeam',
      opponentPlayingXI: ['p5'],
      opponentCustomPlayers: [{ id: 'cx' }],
      opponentTeamRoles: { captainId: 'p5', viceCaptainId: null, wicketKeeperId: null },
    };
    const next = gameReducer(state, setOpponentTeam('Australia'));
    expect(next.opponentTeam).toBe('Australia');
    expect(next.opponentPlayingXI).toEqual([]);
    expect(next.opponentCustomPlayers).toEqual([]);
    expect(next.opponentTeamRoles.captainId).toBeNull();
  });
});

describe('setOwnPlayingXI', () => {
  it('sets ownPlayingXI', () => {
    const xi = ['p1', 'p2', 'p3'];
    expect(gameReducer(getInitialState(), setOwnPlayingXI(xi)).ownPlayingXI).toEqual(xi);
  });

  it('defaults to empty array for non-array', () => {
    expect(gameReducer(getInitialState(), setOwnPlayingXI(null)).ownPlayingXI).toEqual([]);
  });
});

describe('setOpponentPlayingXI', () => {
  it('sets opponentPlayingXI', () => {
    const xi = ['p4', 'p5'];
    expect(gameReducer(getInitialState(), setOpponentPlayingXI(xi)).opponentPlayingXI).toEqual(xi);
  });
});

describe('setOwnTeamRoles', () => {
  it('sets captainId, viceCaptainId, wicketKeeperId', () => {
    const roles = { captainId: 'p1', viceCaptainId: 'p2', wicketKeeperId: 'p3' };
    const next = gameReducer(getInitialState(), setOwnTeamRoles(roles));
    expect(next.ownTeamRoles).toEqual(roles);
  });

  it('defaults to null fields for missing payload', () => {
    const next = gameReducer(getInitialState(), setOwnTeamRoles(null));
    expect(next.ownTeamRoles.captainId).toBeNull();
  });
});

describe('setBattingIntent / setBowlingIntent', () => {
  it('sets battingIntent', () => {
    expect(gameReducer(getInitialState(), setBattingIntent(3)).battingIntent).toBe(3);
  });

  it('sets bowlingIntent', () => {
    expect(gameReducer(getInitialState(), setBowlingIntent(1)).bowlingIntent).toBe(1);
  });
});

describe('setShowScoreboard / toggleShowScoreboard', () => {
  it('sets showScoreboard to true', () => {
    expect(gameReducer(getInitialState(), setShowScoreboard(true)).showScoreboard).toBe(true);
  });

  it('toggles showScoreboard', () => {
    const state = { ...getInitialState(), showScoreboard: false };
    expect(gameReducer(state, toggleShowScoreboard()).showScoreboard).toBe(true);
    const state2 = { ...getInitialState(), showScoreboard: true };
    expect(gameReducer(state2, toggleShowScoreboard()).showScoreboard).toBe(false);
  });
});

describe('setFirstInnings / setSecondInnings', () => {
  it('replaces firstInnings', () => {
    const innings = { ...buildInitialInnings(), score: 150 };
    expect(gameReducer(getInitialState(), setFirstInnings(innings)).firstInnings.score).toBe(150);
  });

  it('replaces secondInnings', () => {
    const innings = { ...buildInitialInnings(), wickets: 7 };
    expect(gameReducer(getInitialState(), setSecondInnings(innings)).secondInnings.wickets).toBe(7);
  });
});

describe('tournament actions', () => {
  it('setTournamentUserTeam sets the value', () => {
    expect(gameReducer(getInitialState(), setTournamentUserTeam('India')).tournamentUserTeam).toBe('India');
  });

  it('setTournamentUserTeam defaults to empty string for falsy', () => {
    expect(gameReducer(getInitialState(), setTournamentUserTeam(null)).tournamentUserTeam).toBe('');
  });

  it('setTournamentOpponentTeams sets the array', () => {
    const teams = ['Australia', 'England'];
    expect(gameReducer(getInitialState(), setTournamentOpponentTeams(teams)).tournamentOpponentTeams).toEqual(teams);
  });

  it('setTournamentMatches sets the array', () => {
    const matches = [{ id: 'R1-M1' }];
    expect(gameReducer(getInitialState(), setTournamentMatches(matches)).tournamentMatches).toEqual(matches);
  });

  it('setTournamentCurrentMatchId sets the value', () => {
    expect(gameReducer(getInitialState(), setTournamentCurrentMatchId('R1-M1')).tournamentCurrentMatchId).toBe('R1-M1');
  });

  it('setTournamentChampion sets the value', () => {
    expect(gameReducer(getInitialState(), setTournamentChampion('India')).tournamentChampion).toBe('India');
  });
});

describe('match setup actions', () => {
  it('setMatchTypeKey updates matchTypeKey', () => {
    expect(gameReducer(getInitialState(), setMatchTypeKey('t20')).matchTypeKey).toBe('t20');
  });

  it('setLocationCountry updates locationCountry', () => {
    expect(gameReducer(getInitialState(), setLocationCountry('India')).locationCountry).toBe('India');
  });

  it('setSelectedStadium updates selectedStadium', () => {
    expect(gameReducer(getInitialState(), setSelectedStadium('Eden Gardens')).selectedStadium).toBe('Eden Gardens');
  });

  it('setCommentator updates commentator', () => {
    expect(gameReducer(getInitialState(), setCommentator('Ravi Shastri')).commentator).toBe('Ravi Shastri');
  });

  it('setTossWinner updates tossWinner', () => {
    expect(gameReducer(getInitialState(), setTossWinner('India')).tossWinner).toBe('India');
  });

  it('setTossDecision updates tossDecision', () => {
    expect(gameReducer(getInitialState(), setTossDecision('bat')).tossDecision).toBe('bat');
  });

  it('setTossCall updates tossCall', () => {
    expect(gameReducer(getInitialState(), setTossCall('heads')).tossCall).toBe('heads');
  });

  it('setFirstBattingSide updates firstBattingSide', () => {
    expect(gameReducer(getInitialState(), setFirstBattingSide('own')).firstBattingSide).toBe('own');
  });

  it('setMatchCondition updates matchCondition', () => {
    const cond = { weather: 'sunny', pitch: 'dead', outfield: 'fastAndHard' };
    expect(gameReducer(getInitialState(), setMatchCondition(cond)).matchCondition).toEqual(cond);
  });
});

describe('setSeriesPlayerStats / setTournamentPlayerStats', () => {
  it('sets seriesPlayerStats', () => {
    const stats = { 'India::p1::Alice': { runs: 50 } };
    expect(gameReducer(getInitialState(), setSeriesPlayerStats(stats)).seriesPlayerStats).toEqual(stats);
  });

  it('defaults seriesPlayerStats to {} for non-object', () => {
    expect(gameReducer(getInitialState(), setSeriesPlayerStats(null)).seriesPlayerStats).toEqual({});
  });

  it('sets tournamentPlayerStats', () => {
    const stats = { key: { runs: 100 } };
    expect(gameReducer(getInitialState(), setTournamentPlayerStats(stats)).tournamentPlayerStats).toEqual(stats);
  });
});

describe('hydrateGameState', () => {
  it('merges payload into state', () => {
    const payload = { ownTeam: 'India', seriesLength: 3 };
    const next = gameReducer(getInitialState(), hydrateGameState(payload));
    expect(next.ownTeam).toBe('India');
    expect(next.seriesLength).toBe(3);
  });

  it('preserves existing state for missing keys', () => {
    const next = gameReducer(getInitialState(), hydrateGameState({ ownTeam: 'India' }));
    expect(next.opponentTeam).toBe('');
  });

  it('handles null payload gracefully', () => {
    const next = gameReducer(getInitialState(), hydrateGameState(null));
    expect(next.ownTeam).toBe('');
  });

  it('migrates legacy stage numbers when ownPlayingXI is absent', () => {
    const payload = { stage: 9 }; // no ownPlayingXI → should migrate to 11
    const next = gameReducer(getInitialState(), hydrateGameState(payload));
    expect(next.stage).toBe(11);
  });

  it('does not migrate stage when ownPlayingXI is present', () => {
    const payload = { stage: 9, ownPlayingXI: [] };
    const next = gameReducer(getInitialState(), hydrateGameState(payload));
    expect(next.stage).toBe(9);
  });

  it('merges firstInnings on top of buildInitialInnings defaults', () => {
    const payload = { firstInnings: { score: 200 } };
    const next = gameReducer(getInitialState(), hydrateGameState(payload));
    expect(next.firstInnings.score).toBe(200);
    expect(next.firstInnings.wickets).toBe(0); // preserved default
  });
});

describe('resetMatchRuntime', () => {
  it('resets all fields back to initial values', () => {
    const modified = gameReducer(getInitialState(), setOwnTeam('India'));
    const reset = gameReducer(modified, resetMatchRuntime());
    expect(reset.ownTeam).toBe('');
    expect(reset.stage).toBe(0);
    expect(reset.gameMode).toBe('quick');
    expect(reset.seriesLength).toBe(1);
    expect(reset.showScoreboard).toBe(false);
  });
});
