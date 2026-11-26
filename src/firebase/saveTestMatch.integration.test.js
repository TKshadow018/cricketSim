/** @jest-environment node */
import { CompressionStream, DecompressionStream } from 'stream/web';
import { simulateHeadlessTestMatch } from '../features/game/utils/headlessTestMatch';
import { decodeSavePayload, encodeSavePayload } from './saveCompression';

beforeAll(() => {
  global.CompressionStream = CompressionStream;
  global.DecompressionStream = DecompressionStream;
});

test('a complete seeded Test can be saved below the Firestore safety limit and restored', async () => {
  const roster = (team) => Array.from({ length: 11 }, (_, index) => ({
    id: `${team}-${index}`,
    name: `${team} ${index}`,
    battingOrderCoeff: 100 - index,
    abilityToPlayPaceBall: 70,
    abilityToPlaySpinBall: 70,
    paceAbility: index < 6 ? 70 : 20,
    spinAbility: 20,
    isWicketKeeper: index === 10,
  }));
  const match = simulateHeadlessTestMatch({
    teamA: 'A', teamB: 'B', playersA: roster('A'), playersB: roster('B'), seed: 104, days: 5,
  });
  const payload = { title: 'Test match', gameState: { ruleset: 'realism', testMatch: match.testMatch } };
  const encoded = await encodeSavePayload(payload);
  expect(encoded.compressedGameState.encoding).toBe('gzip-base64-v1');
  expect(Buffer.byteLength(JSON.stringify(encoded))).toBeLessThan(900000);
  expect(await decodeSavePayload(encoded)).toEqual(payload);
});
