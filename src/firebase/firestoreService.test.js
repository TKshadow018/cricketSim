describe('firestoreService debug mode', () => {
  const originalNodeEnv = process.env.NODE_ENV;

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
    process.env.NODE_ENV = originalNodeEnv;
    process.env.REACT_APP_DEBUG = 'true';
    delete process.env.REACT_APP_DEBUG_MODE;
  });

  afterEach(() => {
    delete process.env.REACT_APP_DEBUG;
    delete process.env.REACT_APP_DEBUG_MODE;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
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

  test('stores career autosaves in local storage with a unique saved-games id', async () => {
    process.env.REACT_APP_DEBUG = '';
    process.env.REACT_APP_DEBUG_MODE = 'true';
    const service = loadModule();

    await service.upsertCareerAutoSave('debug-local-user', {
      title: 'Career auto save',
      stage: 'career',
      gameState: { season: 1 },
    });

    const careerAutoSave = await service.getCareerAutoSave('debug-local-user');

    expect(careerAutoSave).toMatchObject({
      id: 'career-autosave',
      storageId: 'autosave',
      sourceCollection: 'careerSaves',
      title: 'Career auto save',
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

  test('handles missing ids, corrupt JSON, invalid timestamps, and unavailable local storage', async () => {
    const service = loadModule();
    const storageKey = 'cricket-sim-debug-storage';

    expect(await service.getUserProfile('')).toBeNull();
    await service.upsertUserProfile('', { displayName: 'Ignored' });
    expect(await service.createGameSave('', { title: 'Ignored' })).toBeNull();
    expect(await service.createMatchHistoryEntry('', {})).toBeNull();
    expect(await service.createCareerSave('', {})).toBeNull();
    expect(await service.saveCareerSeasonHistory('', {})).toBeNull();
    await service.removeGameSave('', 'missing');
    await service.removeCareerSave('', 'missing');
    await service.upsertAutoGameSave('', {});
    await service.upsertCareerAutoSave('', {});

    window.localStorage.setItem(storageKey, '{bad json');
    expect(await service.listGameSaves('debug-local-user')).toEqual([]);
    window.localStorage.setItem(storageKey, JSON.stringify({ users: [] }));
    expect(await service.getUserProfile('debug-local-user')).toBeNull();
    expect(await service.listRecentMatchHistory('user-valid', 'invalid')).toEqual([]);

    window.localStorage.setItem(storageKey, JSON.stringify({
      users: { partial: { profile: null } },
    }));
    expect(await service.listGameSaves('partial')).toEqual([]);
    expect(await service.listCareerSaves('partial')).toEqual([]);
    expect(await service.listRecentMatchHistory('partial', undefined)).toEqual([]);
    expect(await service.getAutoGameSave('partial')).toBeNull();
    expect(await service.getCareerAutoSave('partial')).toBeNull();

    const gameSave = await service.createGameSave('user-valid', { title: 'Remove me' });
    await service.removeGameSave('user-valid', gameSave.id);
    const careerSave = await service.createCareerSave('user-valid', { title: 'Season' });
    expect(await service.listCareerSaves('user-valid')).toHaveLength(1);
    await service.removeCareerSave('user-valid', careerSave.id);
    await service.saveCareerSeasonHistory('user-valid', { season: 1 });

    const windowDescriptor = Object.getOwnPropertyDescriptor(global, 'window');
    delete global.window;
    try {
      expect(await service.getUserProfile('user-without-window')).toBeNull();
      await service.upsertUserProfile('user-without-window', { displayName: 'Not saved' });
      expect(await service.listRecentMatchHistory('user-without-window')).toEqual([]);
    } finally {
      if (windowDescriptor) {
        Object.defineProperty(global, 'window', windowDescriptor);
      }
    }
  });

  test('uses Firestore for profile, game-save, and match-history operations outside debug mode', async () => {
    process.env.REACT_APP_DEBUG = '';
    const service = loadModule();
    const sdk = jest.requireMock('firebase/firestore');
    sdk.collection.mockImplementation((...args) => ({ kind: 'collection', args }));
    sdk.doc.mockImplementation((...args) => ({ kind: 'document', args }));
    sdk.query.mockImplementation((...args) => ({ kind: 'query', args }));
    sdk.orderBy.mockReturnValue({ order: 'updatedAt-desc' });
    sdk.limit.mockImplementation((value) => ({ limit: value }));
    sdk.serverTimestamp.mockReturnValue('server-time');
    sdk.setDoc.mockResolvedValue(undefined);
    sdk.deleteDoc.mockResolvedValue(undefined);
    sdk.addDoc.mockResolvedValue({ id: 'created-doc' });
    const doc = (id, data, exists = true) => ({ id, data: () => data, exists: () => exists });
    sdk.getDoc
      .mockResolvedValueOnce(doc('user-1', { displayName: 'Player' }))
      .mockResolvedValueOnce(doc('autosave', null, false))
      .mockResolvedValueOnce(doc('autosave', { title: 'Auto save' }))
      .mockResolvedValueOnce(doc('career-autosave', null, false))
      .mockResolvedValueOnce(doc('', { title: 'Career auto', storageId: '' }))
      .mockResolvedValueOnce(doc('missing-user', null, false));
    sdk.getDocs
      .mockResolvedValueOnce({ docs: [{ id: 'manual', data: () => ({ title: 'Manual' }) }, { id: 'autosave', data: () => ({}) }] })
      .mockResolvedValueOnce({ docs: [{ id: 'history', data: () => ({ ownTeam: 'Falcons' }) }] })
      .mockResolvedValueOnce({ docs: [{ id: 'career', data: () => ({ title: 'Career' }) }, { id: 'autosave', data: () => ({}) }] });

    expect(await service.getUserProfile('user-1')).toEqual({ displayName: 'Player' });
    await service.upsertUserProfile('user-1', { displayName: 'Updated' });
    expect(await service.listGameSaves('user-1')).toEqual([{ id: 'manual', title: 'Manual' }]);
    expect(sdk.limit).toHaveBeenCalledWith(6);
    expect(await service.createGameSave('user-1', { title: 'Saved' })).toEqual({ id: 'created-doc' });
    await service.removeGameSave('user-1', 'manual');
    expect(await service.getAutoGameSave('user-1')).toBeNull();
    expect(await service.getAutoGameSave('user-1')).toEqual({ id: 'autosave', title: 'Auto save' });
    await service.upsertAutoGameSave('user-1', { title: 'Updated auto' });
    expect(await service.createMatchHistoryEntry('user-1', { ownTeam: 'Falcons' })).toEqual({ id: 'created-doc' });
    expect(await service.listRecentMatchHistory('user-1', 100)).toEqual([{ id: 'history', ownTeam: 'Falcons' }]);
    expect(sdk.limit).toHaveBeenCalledWith(25);
    expect(await service.listCareerSaves('user-1')).toEqual([
      { id: 'career', title: 'Career', storageId: 'career', sourceCollection: 'careerSaves' },
    ]);
    expect(sdk.limit).toHaveBeenCalledWith(10);
    expect(await service.getCareerAutoSave('user-1')).toBeNull();
    expect(await service.getCareerAutoSave('user-1')).toMatchObject({
      id: 'career-autosave',
      storageId: 'autosave',
      sourceCollection: 'careerSaves',
    });
    expect(await service.getUserProfile('missing-user')).toBeNull();

    expect(await service.createCareerSave('user-1', { title: 'Career' })).toEqual({ id: 'created-doc' });
    await service.removeCareerSave('user-1', 'career');
    await service.upsertCareerAutoSave('user-1', { title: 'Career auto' });
    expect(await service.saveCareerSeasonHistory('user-1', { season: 1 })).toEqual({ id: 'created-doc' });
    expect(sdk.addDoc).toHaveBeenCalledTimes(4);
    expect(sdk.setDoc).toHaveBeenCalledTimes(3);
    expect(sdk.deleteDoc).toHaveBeenCalledTimes(2);
  });
});
