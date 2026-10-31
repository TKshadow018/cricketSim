import React from 'react';
import { skillApplyTimeEnum } from '../gameData/skillApplyTimeEnum';

const scopeLabels = {
  batting: 'Striker',
  bowling: 'Bowler',
  fullTeamBatting: 'Team batting',
  fullTeamBowling: 'Team bowling',
};

const timingLabels = {
  [skillApplyTimeEnum.always]: 'Always',
  [skillApplyTimeEnum.whenBatting]: 'When batting',
  [skillApplyTimeEnum.whenBowling]: 'When bowling',
  [skillApplyTimeEnum.powerPlay]: 'Powerplay',
  [skillApplyTimeEnum.last20PercentOfOvers]: 'Final 20% of innings',
};

const getDeltaClassName = (delta) => {
  if (delta > 0) {
    return 'is-positive';
  }
  if (delta < 0) {
    return 'is-negative';
  }
  return 'is-neutral';
};

const AdminSkillImpactPanel = ({ impacts = [] }) => (
  <section className="admin-skill-impacts" aria-labelledby="admin-skill-impacts-title">
    <div className="admin-skill-impacts__heading">
      <h3 id="admin-skill-impacts-title" className="admin-matrix-subhead">
        Active skill impacts
      </h3>
      <span className="admin-skill-impacts__count">
        {impacts.length} {impacts.length === 1 ? 'effect' : 'effects'}
      </span>
    </div>

    {impacts.length ? (
      <ul className="admin-skill-impacts__list">
        {impacts.map((impact, index) => (
          <li
            key={`${impact.holderId || impact.holderName}-${impact.skillName}-${impact.scope}-${index}`}
            className="admin-skill-impact"
          >
            <div className="admin-skill-impact__identity">
              <strong>{impact.skillName}</strong>
              <span>{impact.holderName}</span>
            </div>
            <div className="admin-skill-impact__context">
              <span>{scopeLabels[impact.scope] || impact.scope}</span>
              <span>{timingLabels[impact.applyTime] || impact.applyTime}</span>
            </div>
            <div
              className="admin-skill-impact__deltas"
              aria-label={`${impact.skillName} outcome weight deltas`}
            >
              {Object.entries(impact.deltas).map(([outcome, delta]) => (
                <span
                  key={outcome}
                  className={`admin-skill-impact__delta ${getDeltaClassName(delta)}`}
                >
                  {outcome} {delta > 0 ? '+' : ''}{delta}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="admin-skill-impacts__empty">No skills are affecting this delivery.</p>
    )}

    <p className="admin-skill-impacts__note">
      Outcome weight delta · points before probability normalization
    </p>
  </section>
);

export default AdminSkillImpactPanel;
