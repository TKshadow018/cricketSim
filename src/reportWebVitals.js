const loadWebVitals = () => import('web-vitals');

const reportWebVitals = (onPerfEntry, importWebVitals = loadWebVitals) => {
  if (typeof onPerfEntry === 'function') {
    importWebVitals().then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
