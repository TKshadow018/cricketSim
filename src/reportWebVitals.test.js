import reportWebVitals from './reportWebVitals';

test('does not load web-vitals without a function callback', () => {
  const importWebVitals = jest.fn();
  reportWebVitals(undefined, importWebVitals);
  reportWebVitals({}, importWebVitals);
  expect(importWebVitals).not.toHaveBeenCalled();
});

test('registers every measurement when given a function callback', async () => {
  const callback = jest.fn();
  const metrics = Object.fromEntries(
    ['getCLS', 'getFID', 'getFCP', 'getLCP', 'getTTFB'].map((name) => [name, jest.fn()])
  );
  const importWebVitals = jest.fn().mockResolvedValue(metrics);

  reportWebVitals(callback, importWebVitals);
  expect(importWebVitals).toHaveBeenCalledTimes(1);
  await Promise.resolve();
  expect(Object.values(metrics).every((measure) => measure.mock.calls[0]?.[0] === callback)).toBe(true);

  reportWebVitals(callback);
});
