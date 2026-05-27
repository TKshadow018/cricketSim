describe('firestoreService debug mode', () => {
  const loadModule = () => {
    jest.doMock('./config', () => ({ db: {} }));
    jest.doMock('firebase/firestore', () => ({
      addDoc: jest.fn(),
      collection: jest.fn(),
      deleteDoc: jest.fn(),
      doc: jest.fn(),
      getDoc: jest.fn(),
      getDocs: jest.fn(),
      limit: jest.fn(),
      orderBy: jest.fn(),
      query: jest.fn(),
      serverTimestamp: jest.fn(),
      setDoc: jest.fn(),
    }));

    return require('./firestoreService');
  };

  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
    process.env.REACT_APP_DEBUG = 'true';
  });

  afterEach(() => {
    delete process.env.REACT_APP_DEBUG;
  });

  test('stores manual saves and autosaves in local storage during debug mode', async () => {
    const service = loadModule();

    await service.createGameSave('debug-local-user', {
      title: 'Manual save',
      stage: 'intro',
      gameState: { innings: 1 },
    });
    await service.upsertAutoGameSave('debug-local-user', {
      title: 'Auto save',
      stage: 'mid-match',
      gameState: { innings: 2 },
    });

    const saves = await service.listGameSaves('debug-local-user');
    const autoSave = await service.getAutoGameSave('debug-local-user');

    expect(saves).toHaveLength(1);
    expect(saves[0]).toMatchObject({
      title: 'Manual save',
      stage: 'intro',
    });
    expect(autoSave).toMatchObject({
      id: 'autosave',
      title: 'Auto save',
      isAutoSave: true,
    });
  });

  test('stores match history locally during debug mode', async () => {
    const service = loadModule();

    await service.createMatchHistoryEntry('debug-local-user', {
      ownTeam: 'India',
      opponentTeam: 'Australia',
      summary: 'India won by 5 wickets',
    });
    await service.createMatchHistoryEntry('debug-local-user', {
      ownTeam: 'England',
      opponentTeam: 'Pakistan',
      summary: 'England won by 12 runs',
    });

    const history = await service.listRecentMatchHistory('debug-local-user', 2);

    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.summary)).toEqual(
      expect.arrayContaining(['India won by 5 wickets', 'England won by 12 runs'])
    );
  });

  test('falls back to an empty debug store for malformed users payload', async () => {
    window.localStorage.setItem('cricket-sim-debug-storage', JSON.stringify({ users: true }));
    const service = loadModule();

    await expect(
      service.createGameSave('debug-local-user', {
        title: 'Recovered save',
        stage: 'intro',
        gameState: { innings: 1 },
      })
    ).resolves.toMatchObject({ id: expect.any(String) });
  });
});
