/** @jest-environment node */
import { CompressionStream, DecompressionStream } from 'stream/web';
import { decodeSavePayload, encodeSavePayload } from './saveCompression';

beforeAll(() => {
  global.CompressionStream = CompressionStream;
  global.DecompressionStream = DecompressionStream;
});

test('large Unicode match states round-trip through a compact save payload', async () => {
  const gameState = {
    team: 'বাংলা XI',
    testMatch: {
      deliveryEvents: Array.from({ length: 5000 }, (_, index) => ({
        over: Math.floor(index / 6),
        striker: 'A very long player name',
        result: index % 4,
      })),
    },
  };
  const payload = { title: 'Test match', stage: 11, gameState };
  const encoded = await encodeSavePayload(payload);
  expect(encoded.gameState).toBeNull();
  expect(encoded.compressedGameState.encoding).toBe('gzip-base64-v1');
  expect(Buffer.byteLength(JSON.stringify(encoded))).toBeLessThan(900000);
  expect(await decodeSavePayload(encoded)).toEqual(payload);
});

test('small and legacy saves remain readable, while unsupported compression is explicit', async () => {
  const payload = { title: 'Old save', gameState: { score: 9 } };
  expect(await decodeSavePayload(payload)).toEqual(payload);
  expect(await decodeSavePayload(await encodeSavePayload(payload))).toEqual(payload);
  await expect(decodeSavePayload({ gameState: null, compressedGameState: { encoding: 'unknown', data: 'x' } }))
    .rejects.toThrow('Unsupported save compression');
});

test('large saves fail clearly if the browser lacks compression support', async () => {
  const original = global.CompressionStream;
  delete global.CompressionStream;
  try {
    await expect(encodeSavePayload({ gameState: { history: 'x'.repeat(250000) } }))
      .rejects.toThrow('compression support');
  } finally {
    global.CompressionStream = original;
  }
});

test('small legacy saves work without TextEncoder and large ones report the limitation', async () => {
  const original = global.TextEncoder;
  delete global.TextEncoder;
  try {
    const payload = { gameState: { score: 9 } };
    expect(await decodeSavePayload(await encodeSavePayload(payload))).toEqual(payload);
    await expect(encodeSavePayload({ gameState: { history: 'x'.repeat(250000) } }))
      .rejects.toThrow('text encoding support');
  } finally {
    global.TextEncoder = original;
  }
});
