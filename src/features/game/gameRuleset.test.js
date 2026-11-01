import reducer, { hydrateGameState, resetMatchRuntime, setMatchRandom, setRuleset } from './gameSlice';

test('ruleset selection persists and legacy saves load with arcade rules', () => {
  const initial = reducer(undefined, { type: '@@init' });
  expect(initial.ruleset).toBe('arcade');
  const realism = reducer(initial, setRuleset('realism'));
  expect(realism.ruleset).toBe('realism');
  expect(reducer(initial, hydrateGameState(realism)).ruleset).toBe('realism');
  expect(reducer(realism, hydrateGameState({ stage: 0 })).ruleset).toBe('arcade');
  expect(reducer(realism, setRuleset('arcade')).ruleset).toBe('arcade');
});

test('invalid ruleset choices are rejected rather than silently changed', () => {
  const initial = reducer(undefined, { type: '@@init' });
  expect(() => reducer(initial, setRuleset('unknown'))).toThrow();
});

test('match random state survives save hydration and resets for a fresh match', () => {
  const initial = reducer(undefined, { type: '@@init' });
  const random = { seed: 1, state: 42, algorithm: 'mulberry32-v1', engineVersion: 'match-engine-v1' };
  const started = reducer(initial, setMatchRandom(random));
  expect(reducer(initial, hydrateGameState(started)).matchRandom).toEqual(random);
  expect(reducer(started, hydrateGameState({ stage: 0 })).matchRandom).toBeNull();
  expect(reducer(started, resetMatchRuntime()).matchRandom).toBeNull();
});

test('legacy saves preserve available delivery history without claiming a complete ledger', () => {
  const initial = reducer(undefined, { type: '@@init' });
  const recent = [{ token: '4', runs: 4, isLegalDelivery: true }];
  const loaded = reducer(initial, hydrateGameState({ firstInnings: { balls: 42, ballHistory: recent } }));
  expect(loaded.firstInnings.deliveryEvents).toEqual(recent);
  expect(loaded.firstInnings.historyComplete).toBe(false);
  expect(loaded.firstInnings).toMatchObject({ byes: 0, legByes: 0 });
  expect(initial.firstInnings.historyComplete).toBe(true);
});
