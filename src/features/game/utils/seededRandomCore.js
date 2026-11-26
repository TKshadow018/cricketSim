const createSeededRandom = (initialState) => {
  if (!Number.isInteger(initialState) || initialState < 0 || initialState > 0xffffffff) {
    throw new RangeError('Random state must be an unsigned 32-bit integer');
  }
  let state = initialState;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    getState: () => state,
  };
};

module.exports = { createSeededRandom };
