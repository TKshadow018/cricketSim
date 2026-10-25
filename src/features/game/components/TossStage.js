import React from 'react';

const weatherImageByType = {
  sunny: '/asset/img/icon/waether/sun.png',
  rainy: '/asset/img/icon/waether/rainy.png',
  cloudy: '/asset/img/icon/waether/cloudy.png',
  windy: '/asset/img/icon/waether/windy.png',
  stormy: '/asset/img/icon/waether/stormy.png',
};

const formatConditionLabel = (value = '') =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

function TossStage({ onChooseCall, matchCondition, selectedCall }) {
  return (
    <div className="sim-toss-panel">
      <p>Select Crown or Dollar to perform toss.</p>
      <div className="sim-toss-icons sim-toss-buttons">
        <button
          type="button"
          aria-label="Call crown"
          aria-pressed={selectedCall === 'crown'}
          className={selectedCall === 'crown' ? 'active' : ''}
          onClick={() => onChooseCall('crown')}
        >
          <img
            src="/asset/img/icon/crown.png"
            alt="crown"
          />
        </button>
        <button
          type="button"
          aria-label="Call dollar"
          aria-pressed={selectedCall === 'dollar'}
          className={selectedCall === 'dollar' ? 'active' : ''}
          onClick={() => onChooseCall('dollar')}
        >
          <img
            src="/asset/img/icon/money.png"
            alt="money"
          />
        </button>
      </div>

      <div className="sim-condition-grid">
        <div className="sim-condition-card">
          <img
            src={weatherImageByType[matchCondition.weather] || '/asset/img/icon/conditions/weather-512.svg'}
            alt="weather"
            className="sim-condition-icon"
          />
          <h4>Weather</h4>
          <p>{formatConditionLabel(matchCondition.weather)}</p>
        </div>
        <div className="sim-condition-card">
          <img src="/asset/img/icon/conditions/pitch-512.svg" alt="pitch" className="sim-condition-icon" />
          <h4>Pitch</h4>
          <p>{formatConditionLabel(matchCondition.pitch)}</p>
        </div>
        <div className="sim-condition-card">
          <img src="/asset/img/icon/conditions/outfield-512.svg" alt="outfield" className="sim-condition-icon" />
          <h4>Outfield</h4>
          <p>{formatConditionLabel(matchCondition.outfield)}</p>
        </div>
      </div>
    </div>
  );
}

export default TossStage;
