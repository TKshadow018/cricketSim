const encoding = 'gzip-base64-v1';
const compressionThreshold = 200000;
const maxStoredBytes = 900000;
const maxDecodedBytes = 32 * 1024 * 1024;

const transformBytes = async (input, StreamClass, limit) => {
  const stream = new StreamClass('gzip');
  const reader = stream.readable.getReader();
  const writer = stream.writable.getWriter();
  const read = async () => {
    const chunks = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new Error('The saved match exceeds the supported size.');
      }
      chunks.push(value);
    }
    const result = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((chunk) => {
      result.set(chunk, offset);
      offset += chunk.length;
    });
    return result;
  };
  const write = async () => {
    await writer.write(input);
    await writer.close();
  };
  const [result] = await Promise.all([read(), write()]);
  return result;
};

const toBase64 = (bytes) => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  }
  return btoa(binary);
};

const fromBase64 = (value) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

export const encodeSavePayload = async (payload) => {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'gameState') || payload.gameState == null) return payload;
  const json = JSON.stringify(payload.gameState);
  if (typeof json !== 'string') throw new Error('The match state cannot be serialized.');
  if (json.length * 3 < compressionThreshold) return { ...payload, compressedGameState: null };
  if (typeof TextEncoder !== 'function') {
    throw new Error('Saving this large match requires browser text encoding support.');
  }
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > maxDecodedBytes) throw new Error('The saved match exceeds the supported size.');
  if (bytes.length < compressionThreshold) return { ...payload, compressedGameState: null };
  if (typeof CompressionStream !== 'function') {
    throw new Error('Saving this large match requires browser compression support.');
  }
  const compressed = await transformBytes(bytes, CompressionStream, maxStoredBytes);
  const result = {
    ...payload,
    gameState: null,
    compressedGameState: { encoding, data: toBase64(compressed) },
  };
  if (new TextEncoder().encode(JSON.stringify(result)).length > maxStoredBytes) {
    throw new Error('The saved match is too large to store.');
  }
  return result;
};

export const decodeSavePayload = async (payload) => {
  if (!payload || payload.compressedGameState === undefined) return payload;
  const { compressedGameState, ...plain } = payload;
  if (compressedGameState === null) return plain;
  if (compressedGameState?.encoding !== encoding || typeof compressedGameState.data !== 'string') {
    throw new Error('Unsupported save compression.');
  }
  if (typeof DecompressionStream !== 'function') {
    throw new Error('Loading this match requires browser decompression support.');
  }
  const decoded = await transformBytes(fromBase64(compressedGameState.data), DecompressionStream, maxDecodedBytes);
  return { ...plain, gameState: JSON.parse(new TextDecoder().decode(decoded)) };
};
