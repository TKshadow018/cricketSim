const pendingSaves = new Map();

export const queueAutoSave = (key, write) => {
  const previous = pendingSaves.get(key);
  const next = previous ? previous.then(write, write) : Promise.resolve().then(write);
  pendingSaves.set(key, next);
  const clear = () => {
    if (pendingSaves.get(key) === next) pendingSaves.delete(key);
  };
  next.then(clear, clear);
  return next;
};
