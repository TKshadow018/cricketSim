import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { createTeamManagementHandlers } from './controllerTeamManagement';

jest.mock('../../../../utils/speechUtils', () => ({
  announceTeamChoice: jest.fn(),
  speak: jest.fn(),
}));

const makePlayer = (id, overrides = {}) => ({
  id,
  name: `Player ${id}`,
  playerType: 'batsman',
  isWicketKeeper: false,
  paceAbility: 20,
  spinAbility: 15,
  abilityToPlayPaceBall: 65,
  abilityToPlaySpinBall: 60,
  ...overrides,
});

const makeHandlers = (overrides = {}) => {
  const actionNames = [
    'setTossDecisionAction',
    'setFirstBattingSideAction',
    'setStageAction',
    'setOwnPlayingXIAction',
    'setOwnBattingOrderIdsAction',
    'setOwnTeamRolesAction',
    'setOpponentPlayingXIAction',
    'setOpponentBattingOrderIdsAction',
    'setOpponentTeamRolesAction',
    'setOwnCustomPlayersAction',
    'setOpponentCustomPlayersAction',
  ];
  const actions = Object.fromEntries(
    actionNames.map((name) => [name, (payload) => ({ type: name, payload })])
  );
  const dispatch = jest.fn();
  const openInnings = jest.fn();
  const ownSelectedXIIds = ['own-1', 'own-2'];
  const opponentSelectedXIIds = ['opp-1', 'opp-2'];
  const availableOwnPlayers = [
    makePlayer('own-1'),
    makePlayer('own-2'),
    makePlayer('own-3'),
    ...Array.from({ length: 10 }, (_, index) => makePlayer(`own-${index + 4}`)),
  ];
  const availableOpponentPlayers = [
    makePlayer('opp-1'),
    makePlayer('opp-2'),
    makePlayer('opp-3', { isWicketKeeper: true, playerType: 'wicketkeeper' }),
    ...Array.from({ length: 10 }, (_, index) => makePlayer(`opp-${index + 4}`, { playerType: 'bowler pacer', paceAbility: 65 })),
  ];
  const args = {
    dispatch,
    userTeamName: 'Own Team',
    ownTeam: 'Own Team',
    opponentTeam: 'Opponent Team',
    gameMode: 'quick',
    openInnings,
    ownSelectedXIIds,
    ownBattingOrderIds: ownSelectedXIIds,
    availableOwnPlayers,
    ownSanitizedRoles: { captainId: 'own-1', viceCaptainId: 'own-2', wicketKeeperId: null },
    sanitizeRoles: jest.fn((roles, ids) => ({ ...roles, allowedIds: ids })),
    opponentSelectedXIIds,
    opponentBattingOrderIds: opponentSelectedXIIds,
    availableOpponentPlayers,
    opponentSanitizedRoles: { captainId: 'opp-1', viceCaptainId: 'opp-2', wicketKeeperId: null },
    ownSelectedXIPlayers: [makePlayer('own-1'), makePlayer('own-2'), makePlayer('own-keeper', { isWicketKeeper: true })],
    opponentSelectedXIPlayers: [makePlayer('opp-1'), makePlayer('opp-2'), makePlayer('opp-keeper', { isWicketKeeper: true })],
    ownCustomPlayers: [],
    opponentCustomPlayers: [],
    ownXIReady: false,
    opponentXIReady: false,
    ownRolesReady: false,
    opponentRolesReady: false,
    firstBattingSide: 'own',
    pickDefaultRoles: jest.fn((players, ids) => ({ captainId: ids[0] || null, selectedCount: players.length })),
    ...actions,
    ...overrides,
  };
  return { handlers: createTeamManagementHandlers(args), args, dispatch, openInnings };
};

describe('toss and match-start handling', () => {
  test('resolves user toss decisions for own and opponent sides', () => {
    const bat = makeHandlers();
    bat.handlers.handleUserTossDecision('bat');
    expect(bat.dispatch).toHaveBeenCalledWith({ type: 'setTossDecisionAction', payload: 'bat' });
    expect(bat.dispatch).toHaveBeenCalledWith({ type: 'setFirstBattingSideAction', payload: 'own' });
    expect(bat.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.ChooseOwnPlayingXI,
    });

    const bowl = makeHandlers({ userTeamName: 'Opponent Team' });
    bowl.handlers.handleUserTossDecision('bowl');
    expect(bowl.dispatch).toHaveBeenCalledWith({ type: 'setFirstBattingSideAction', payload: 'own' });

    const tournament = makeHandlers({ gameMode: 'tournament' });
    tournament.handlers.handleUserTossDecision('bowl');
    expect(tournament.openInnings).toHaveBeenCalledWith('opponent');
    expect(tournament.dispatch).not.toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.ChooseOwnPlayingXI,
    });
  });

  test('starts innings only when both XIs and role selections are ready', () => {
    const incomplete = makeHandlers({ ownXIReady: true, opponentXIReady: true, ownRolesReady: true });
    incomplete.handlers.startMatchWithSelectedXI();
    expect(incomplete.openInnings).not.toHaveBeenCalled();

    const ready = makeHandlers({
      ownXIReady: true,
      opponentXIReady: true,
      ownRolesReady: true,
      opponentRolesReady: true,
      firstBattingSide: 'opponent',
    });
    ready.handlers.startMatchWithSelectedXI();
    expect(ready.openInnings).toHaveBeenCalledWith('opponent');
  });
});

describe('team XI and role management', () => {
  test('adds and removes selected players while synchronizing sanitized roles', () => {
    const { handlers, args, dispatch } = makeHandlers();
    handlers.moveOwnPlayerToXI('own-3');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: ['own-1', 'own-2', 'own-3'] });
    handlers.moveOwnPlayerToXI('own-1');
    expect(dispatch).toHaveBeenCalledTimes(1);

    handlers.removeOwnPlayerFromXI('missing');
    expect(dispatch).toHaveBeenCalledTimes(1);
    handlers.removeOwnPlayerFromXI('own-1');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: ['own-2'] });
    expect(args.sanitizeRoles).toHaveBeenCalledWith(args.ownSanitizedRoles, ['own-2']);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { ...args.ownSanitizedRoles, allowedIds: ['own-2'] },
    });

    handlers.moveOpponentPlayerToXI('opp-3');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOpponentPlayingXIAction',
      payload: ['opp-1', 'opp-2', 'opp-3'],
    });
    handlers.removeOpponentPlayerFromXI('opp-2');
    expect(args.sanitizeRoles).toHaveBeenCalledWith(args.opponentSanitizedRoles, ['opp-1']);
  });

  test('moves selected players up and down in both batting orders', () => {
    const ownOrder = ['own-1', 'own-2', 'own-3'];
    const opponentOrder = ['opp-1', 'opp-2', 'opp-3'];
    const { handlers, dispatch } = makeHandlers({
      ownSelectedXIIds: ownOrder,
      ownBattingOrderIds: ownOrder,
      opponentSelectedXIIds: opponentOrder,
      opponentBattingOrderIds: opponentOrder,
    });

    handlers.moveOwnPlayerInBattingOrder('own-3', -1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnBattingOrderIdsAction',
      payload: ['own-1', 'own-3', 'own-2'],
    });

    handlers.moveOpponentPlayerInBattingOrder('opp-1', 1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOpponentBattingOrderIdsAction',
      payload: ['opp-2', 'opp-1', 'opp-3'],
    });
  });

  test('does not move a batting-order player beyond the first or last position', () => {
    const order = ['own-1', 'own-2', 'own-3'];
    const { handlers, dispatch } = makeHandlers({
      ownSelectedXIIds: order,
      ownBattingOrderIds: order,
    });

    handlers.moveOwnPlayerInBattingOrder('own-1', -1);
    handlers.moveOwnPlayerInBattingOrder('own-3', 1);

    expect(dispatch).not.toHaveBeenCalled();
  });

  test('rejects non-keeper wicketkeeper assignments and clears duplicate captain roles', () => {
    const { handlers, dispatch } = makeHandlers();
    handlers.setOwnRole('wicketKeeperId', 'own-1');
    expect(dispatch).not.toHaveBeenCalled();

    handlers.setOwnRole('captainId', 'own-2');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: 'own-2', viceCaptainId: null, wicketKeeperId: null },
    });

    handlers.setOwnRole('viceCaptainId', 'own-1');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: null, viceCaptainId: 'own-1', wicketKeeperId: null },
    });

    handlers.setOwnRole('wicketKeeperId', 'own-keeper');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: 'own-1', viceCaptainId: 'own-2', wicketKeeperId: 'own-keeper' },
    });

    handlers.setOpponentRole('wicketKeeperId', 'opp-1');
    expect(dispatch).toHaveBeenCalledTimes(3);
    handlers.setOpponentRole('captainId', 'opp-2');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOpponentTeamRolesAction',
      payload: { captainId: 'opp-2', viceCaptainId: null, wicketKeeperId: null },
    });
  });

  test('creates custom players, auto-picks XIs, and caps manual selections at eleven', () => {
    const { handlers, dispatch } = makeHandlers({
      ownSelectedXIIds: Array.from({ length: 11 }, (_, index) => `selected-${index}`),
      availableOwnPlayers: [makePlayer(10), makePlayer(13)],
    });
    handlers.moveOwnPlayerToXI('own-3');
    expect(dispatch).not.toHaveBeenCalled();

    handlers.createCustomPlayer('own', {
      name: 'Custom One',
      abilityToPlayPaceBall: 70,
      abilityToPlaySpinBall: 65,
      battingAggresion: 75,
      isWicketKeeper: true,
      spinAbility: 30,
      paceAbility: 40,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnCustomPlayersAction',
      payload: [expect.objectContaining({ id: 14, name: 'Custom One', isWicketKeeper: true, currentMatch: expect.any(Object) })],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setOwnPlayingXIAction',
      payload: [...Array.from({ length: 11 }, (_, index) => `selected-${index}`)],
    });

    const opponentCustom = makeHandlers({
      opponentSelectedXIIds: [],
      availableOpponentPlayers: [makePlayer(8), makePlayer(12)],
    });
    opponentCustom.handlers.createCustomPlayer('opponent', { name: 'Guest Player' });
    expect(opponentCustom.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentCustomPlayersAction',
      payload: [expect.objectContaining({ id: 13, name: 'Guest Player' })],
    });

    const autoPick = makeHandlers();
    autoPick.handlers.autoPickOwnXI();
    expect(autoPick.dispatch).toHaveBeenCalledWith({
      type: 'setOwnPlayingXIAction',
      payload: expect.arrayContaining(['own-1', 'own-11']),
    });
    expect(autoPick.dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: expect.objectContaining({ selectedCount: 13 }),
    });
    autoPick.handlers.autoPickOpponentXI();
    expect(autoPick.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentPlayingXIAction',
      payload: expect.any(Array),
    });
    expect(autoPick.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentTeamRolesAction',
      payload: expect.any(Object),
    });
  });

  test('adds and removes opponent players and permits absent player metadata', () => {
    const added = makeHandlers({
      opponentSelectedXIIds: [],
      availableOpponentPlayers: [],
    });
    added.handlers.moveOpponentPlayerToXI('new-id');
    expect(added.dispatch).toHaveBeenCalledWith({ type: 'setOpponentPlayingXIAction', payload: ['new-id'] });

    const removed = makeHandlers({
      opponentSelectedXIIds: ['new-id'],
      availableOpponentPlayers: [],
    });
    removed.handlers.removeOpponentPlayerFromXI('new-id');
    expect(removed.dispatch).toHaveBeenCalledWith({ type: 'setOpponentPlayingXIAction', payload: [] });
  });

  test('covers empty-team role, selection, and custom-player fallbacks', () => {
    const empty = makeHandlers({
      userTeamName: '',
      ownSelectedXIIds: [],
      availableOwnPlayers: [],
      ownSelectedXIPlayers: [],
      ownCustomPlayers: null,
      ownSanitizedRoles: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
      opponentSelectedXIIds: [],
      availableOpponentPlayers: [],
      opponentSelectedXIPlayers: [
        makePlayer('opponent-keeper', { isWicketKeeper: true }),
        makePlayer('opponent-captain'),
      ],
      opponentCustomPlayers: null,
      opponentSanitizedRoles: {
        captainId: 'opponent-captain',
        viceCaptainId: null,
        wicketKeeperId: null,
      },
    });

    empty.handlers.handleUserTossDecision('bat');
    expect(empty.dispatch).toHaveBeenCalledWith({ type: 'setTossDecisionAction', payload: 'bat' });
    expect(jest.requireMock('../../../../utils/speechUtils').announceTeamChoice).toHaveBeenCalledWith('Own Team', 'bat');

    empty.handlers.moveOwnPlayerToXI('absent');
    empty.handlers.removeOwnPlayerFromXI('absent');
    empty.handlers.setOwnRole('captainId', 'not-selected');
    empty.handlers.setOwnRole('captainId', null);
    empty.handlers.createCustomPlayer('own', { name: 'First Custom' });
    expect(empty.dispatch).toHaveBeenCalledWith({
      type: 'setOwnCustomPlayersAction',
      payload: [expect.objectContaining({ id: 1, name: 'First Custom' })],
    });

    const missingOwnMetadata = makeHandlers({
      ownSelectedXIIds: ['missing-player'],
      availableOwnPlayers: [],
    });
    missingOwnMetadata.handlers.removeOwnPlayerFromXI('missing-player');
    expect(missingOwnMetadata.dispatch).toHaveBeenCalledWith({
      type: 'setOwnPlayingXIAction',
      payload: [],
    });

    empty.handlers.moveOpponentPlayerToXI('absent');
    empty.handlers.removeOpponentPlayerFromXI('absent');
    empty.handlers.setOpponentRole('viceCaptainId', 'opponent-captain');
    empty.handlers.setOpponentRole('wicketKeeperId', 'opponent-keeper');
    empty.handlers.setOpponentRole('captainId', 'not-selected');
    empty.handlers.setOpponentRole('captainId', null);
    empty.handlers.createCustomPlayer('opponent', { name: 'First Guest' });
    expect(empty.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentCustomPlayersAction',
      payload: [expect.objectContaining({ id: 1, name: 'First Guest' })],
    });

    const zeroIdRoster = makeHandlers({
      availableOwnPlayers: [makePlayer(0)],
      ownCustomPlayers: null,
    });
    zeroIdRoster.handlers.createCustomPlayer('own', { name: 'Zero-ID Roster Custom' });
    expect(zeroIdRoster.dispatch).toHaveBeenCalledWith({
      type: 'setOwnCustomPlayersAction',
      payload: [expect.objectContaining({ id: 1 })],
    });

    const opponentFull = makeHandlers({
      opponentSelectedXIIds: Array.from({ length: 11 }, (_, index) => `opp-${index}`),
    });
    opponentFull.handlers.moveOpponentPlayerToXI('new-opponent');
    expect(opponentFull.dispatch).not.toHaveBeenCalled();

    const duplicateOpponent = makeHandlers();
    duplicateOpponent.handlers.moveOpponentPlayerToXI('opp-1');
    expect(duplicateOpponent.dispatch).not.toHaveBeenCalled();
  });
});
