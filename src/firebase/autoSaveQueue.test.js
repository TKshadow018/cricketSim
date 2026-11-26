import { queueAutoSave } from './autoSaveQueue';

test('autosave writes for the same document are ordered while other documents proceed', async () => {
  const calls = [];
  let release;
  const first = queueAutoSave('one', () => new Promise((resolve) => {
    calls.push('first');
    release = resolve;
  }));
  const second = queueAutoSave('one', () => { calls.push('second'); });
  const independent = queueAutoSave('two', () => { calls.push('independent'); });
  await independent;
  expect(calls).toEqual(['first', 'independent']);
  release();
  await Promise.all([first, second]);
  expect(calls).toEqual(['first', 'independent', 'second']);
});

test('a failed write is reported and does not prevent the next queued save', async () => {
  const first = queueAutoSave('failure', () => Promise.reject(new Error('offline')));
  const second = queueAutoSave('failure', () => 'saved');
  await expect(first).rejects.toThrow('offline');
  await expect(second).resolves.toBe('saved');
});
