jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));
jest.mock('./reportWebVitals', () => jest.fn());
jest.mock('./App', () => () => null);
jest.mock('./app/store', () => ({ store: {} }));

test('mounts the root application with Redux, localization, and browser routing providers', () => {
  document.body.innerHTML = '<div id="root"></div>';
  let createRoot;
  let reportWebVitals;

  jest.isolateModules(() => {
    createRoot = require('react-dom/client').createRoot;
    reportWebVitals = require('./reportWebVitals');
    require('./index');
  });

  expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
  expect(createRoot.mock.results[0].value.render).toHaveBeenCalledTimes(1);
  expect(reportWebVitals).toHaveBeenCalledTimes(1);
});
