import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Wave } from 'react-animated-text';

const weatherIcons = {
  sunny: '☀️',
  rainy: '🌧️',
  cloudy: '☁️',
  windy: '💨',
  stormy: '⛈️',
};

const weatherImageByType = {
  sunny: '/asset/img/icon/waether/sun.png',
  rainy: '/asset/img/icon/waether/rainy.png',
  cloudy: '/asset/img/icon/waether/cloudy.png',
  windy: '/asset/img/icon/waether/windy.png',
  stormy: '/asset/img/icon/waether/stormy.png',
};

const pitchIcons = {
  grassy: '🌱',
  dusty: '🏜️',
  dead: '🧱',
  sporting: '🏏',
  dry: '🌤️',
};

const outfieldIcons = {
  lushGreen: '🟢',
  fastAndHard: '⚡',
  wetWithDew: '💧',
  dryAndPatchy: '🟤',
};

const formatConditionLabel = (value = '') =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

function TossStage({ onChooseCall, matchCondition, selectedCall }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="sim-toss-panel">
      <div className="sim-wave-title sim-toss-title">
        {prefersReducedMotion ? 'TOSS TIME' : <Wave text="TOSS TIME" effect="stretch" effectChange={1.2} effectDuration={0.7} />}
      </div>
      <p>Select Crown or Dollar to perform toss.</p>
      <div className="sim-toss-icons sim-toss-buttons">
        <button
          className={selectedCall === 'crown' ? 'active' : ''}
          onClick={() => onChooseCall('crown')}
        >
          <motion.img
            src="/asset/img/icon/crown.png"
            alt="crown"
            animate={prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
            transition={{ repeat: prefersReducedMotion ? 0 : Infinity, duration: prefersReducedMotion ? 0 : 1.5 }}
          />
        </button>
        <button
          className={selectedCall === 'dollar' ? 'active' : ''}
          onClick={() => onChooseCall('dollar')}
        >
          <motion.img
            src="/asset/img/icon/money.png"
            alt="money"
            animate={prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
            transition={{ repeat: prefersReducedMotion ? 0 : Infinity, duration: prefersReducedMotion ? 0 : 1.5, delay: prefersReducedMotion ? 0 : 0.3 }}
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
          <h4>{weatherIcons[matchCondition.weather]} Weather</h4>
          <p>{formatConditionLabel(matchCondition.weather)}</p>
        </div>
        <div className="sim-condition-card">
          <img src="/asset/img/icon/conditions/pitch-512.svg" alt="pitch" className="sim-condition-icon" />
          <h4>{pitchIcons[matchCondition.pitch]} Pitch</h4>
          <p>{formatConditionLabel(matchCondition.pitch)}</p>
        </div>
        <div className="sim-condition-card">
          <img src="/asset/img/icon/conditions/outfield-512.svg" alt="outfield" className="sim-condition-icon" />
          <h4>{outfieldIcons[matchCondition.outfield]} Outfield</h4>
          <p>{formatConditionLabel(matchCondition.outfield)}</p>
        </div>
      </div>
    </div>
  );
}

export default TossStage;
