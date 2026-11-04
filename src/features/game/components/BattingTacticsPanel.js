import React from 'react';
import PlayerNameWithType from './PlayerNameWithType';
import BattingTargetMap from './BattingTargetMap';
import { battingAction } from '../../../gameData/actionType';
import {
  BATTING_APPROACHES,
  BATTING_SHOTS,
  getBattingTarget,
} from '../utils/battingTactics';
import '../styles/batting-tactics.css';

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');
const formatConditionLabel = (value) => {
  const words = String(value || 'unknown')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const getBallLabel = (event) => {
  if (event?.isWicket) return 'W';
  if (event?.token === 'wide') return `WD +${formatNumber(event.extras || 1)}`;
  if (event?.token === 'nb') return `NB +${formatNumber(event.extras || 1)}`;
  return String(Number(event?.runs) || 0);
};

const findAction = (actions, key) => actions.find((action) => action.key === key);

function BattingTacticsPanel({
  tactics,
  context,
  actions = [],
  intent,
  onTacticsChange,
  onIntentChange,
}) {
  const safeContext = context || {};
  const safeActions = Array.isArray(actions) ? actions : [];
  const striker = safeContext.striker || {};
  const bowler = safeContext.bowler || null;
  const currentEvents = Array.isArray(safeContext.currentOverEvents) ? safeContext.currentOverEvents : [];
  const legalEvents = currentEvents.filter((event) => Number.isInteger(event?.ballNumber));
  const extraEvents = currentEvents.filter((event) => !Number.isInteger(event?.ballNumber));
  const completedBalls = Math.min(6, Number(safeContext.currentOverBall) || 0);
  const nextBall = completedBalls < 6 ? completedBalls + 1 : null;
  const runRateTarget = safeContext.target !== null && safeContext.target !== undefined;
  const freeHitAction = findAction(safeActions, battingAction.freeHit);
  const superShotAction = findAction(safeActions, battingAction.superShot);
  const bowlerStyle = Number(bowler?.paceAbility || 0) > Number(bowler?.spinAbility || 0)
    ? 'PACE'
    : Number(bowler?.spinAbility || 0) > Number(bowler?.paceAbility || 0)
      ? 'SPIN'
      : 'BOWLING';
  const batterStyle = bowlerStyle === 'PACE'
    ? 'abilityToPlayPaceBall'
    : bowlerStyle === 'SPIN'
      ? 'abilityToPlaySpinBall'
      : '';
  const batterAbility = batterStyle ? Number(striker.player?.[batterStyle]) || 0 : null;
  const lastTacticalEvent = [...currentEvents].reverse().find((event) => event?.battingTactics);
  const lastCall = lastTacticalEvent?.battingTactics;
  const lastCallLabels = lastCall
    ? [
        BATTING_APPROACHES.find(({ key }) => key === lastCall.approach)?.label,
        BATTING_SHOTS.find(({ key }) => key === lastCall.shot)?.label,
        getBattingTarget(lastCall.target)?.label,
      ].filter(Boolean).join(' · ')
    : '';

  const updateTactics = (patch) => {
    if (typeof onTacticsChange === 'function') {
      onTacticsChange(patch);
    }
  };

  const setIntent = (value) => {
    if (typeof onIntentChange === 'function') {
      onIntentChange(value);
    }
  };

  return (
    <section className="sim-batting-cockpit" aria-label="Batting tactics">
      <header className="sim-batting-header">
        <div>
          <p className="sim-batting-kicker">Batting · Over {safeContext.currentOverNumber || 1}</p>
          <h3>Read the ball. Choose your scoring route.</h3>
        </div>
        <div className="sim-batting-score-context" aria-label="Current innings score">
          <strong>{formatNumber(safeContext.score)}/{formatNumber(safeContext.wickets)}</strong>
          <span>{safeContext.over || '0.0'} overs</span>
        </div>
      </header>

      <div className="sim-batting-situation" aria-label="Match situation">
        {runRateTarget ? (
          <>
            <div><span>Target</span><strong>{formatNumber(safeContext.target)}</strong></div>
            <div><span>Needed</span><strong>{formatNumber(safeContext.runsRemaining)} runs</strong></div>
            <div><span>To go</span><strong>{formatNumber(safeContext.ballsRemaining)} balls</strong></div>
            <div><span>Required rate</span><strong>{safeContext.requiredRunRate || '—'}</strong></div>
          </>
        ) : (
          <>
            <div><span>Current rate</span><strong>{safeContext.currentRunRate || '0.00'}</strong></div>
            <div><span>Overs left</span><strong>{formatNumber(safeContext.ballsRemaining ? Math.ceil(safeContext.ballsRemaining / 6) : 0)}</strong></div>
            <div><span>Wickets</span><strong>{formatNumber(10 - (Number(safeContext.wickets) || 0))} in hand</strong></div>
            <div><span>Pitch</span><strong>{formatConditionLabel(safeContext.matchCondition?.pitch)}</strong></div>
          </>
        )}
      </div>

      <div className="sim-batting-player-matchup">
        <article className="sim-batting-player-card sim-batting-player-card--striker">
          <div className="sim-batting-player-heading">
            <span className="sim-batting-card-kicker">ON STRIKE</span>
            <span className="sim-batting-matchup-label">{batterAbility === null ? bowlerStyle : `${bowlerStyle} matchup ${batterAbility}`}</span>
          </div>
          <strong className="sim-batting-player-name">
            {striker.player ? <PlayerNameWithType player={striker.player} /> : 'Choose the striker'}
          </strong>
          <div className="sim-batting-figures">
            <span><b>{formatNumber(striker.runs)}</b> runs</span>
            <span><b>{formatNumber(striker.balls)}</b> balls</span>
            <span>Non-striker <b>{safeContext.nonStriker?.player?.name || '—'}</b></span>
          </div>
        </article>

        <article className="sim-batting-player-card sim-batting-player-card--bowler">
          <div className="sim-batting-player-heading">
            <span className="sim-batting-card-kicker">BOWLER</span>
            <span className="sim-batting-matchup-label">{bowlerStyle}</span>
          </div>
          <strong className="sim-batting-player-name">{bowler ? <PlayerNameWithType player={bowler} /> : 'Choose a bowler'}</strong>
          <div className="sim-batting-figures">
            <span><b>{safeContext.bowlerFigures?.overs || '0.0'}</b> overs</span>
            <span><b>{formatNumber(safeContext.bowlerFigures?.wickets)}</b> wkts</span>
            <span><b>{safeContext.bowlerFigures?.economy || '0.00'}</b> econ</span>
          </div>
        </article>
      </div>

      <section className="sim-batting-control-section" aria-labelledby="batting-approach-heading">
        <div className="sim-batting-section-heading">
          <div>
            <p className="sim-batting-card-kicker">INNINGS APPROACH</p>
            <h4 id="batting-approach-heading">Set your risk appetite</h4>
          </div>
          <span>Applies until changed</span>
        </div>
        <div className="sim-batting-choice-grid sim-batting-approach-grid" role="group" aria-label="Batting approach">
          {BATTING_APPROACHES.map((approach) => (
            <button
              key={approach.key}
              type="button"
              className={`sim-batting-choice-card${tactics?.approach === approach.key ? ' active' : ''}`}
              aria-label={approach.label}
              aria-pressed={tactics?.approach === approach.key}
              onClick={() => updateTactics({ approach: approach.key })}
            >
              <strong>{approach.label}</strong>
              <small>{approach.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="sim-batting-control-section" aria-labelledby="batting-shot-heading">
        <div className="sim-batting-section-heading">
          <div>
            <p className="sim-batting-card-kicker">NEXT BALL</p>
            <h4 id="batting-shot-heading">Choose your shot intent</h4>
          </div>
          <span>One ball by default</span>
        </div>
        <div className="sim-batting-choice-grid sim-batting-shot-grid" role="group" aria-label="Shot intent">
          {BATTING_SHOTS.map((shot) => (
            <button
              key={shot.key}
              type="button"
              className={`sim-batting-choice-card sim-batting-shot-card${tactics?.shot === shot.key ? ' active' : ''}`}
              aria-label={shot.label}
              aria-pressed={tactics?.shot === shot.key}
              onClick={() => updateTactics({ shot: shot.key })}
            >
              <strong>{shot.label}</strong>
              <small>{shot.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="sim-batting-control-section" aria-labelledby="batting-target-heading">
        <div className="sim-batting-section-heading">
          <div>
            <p className="sim-batting-card-kicker">TARGET SECTOR</p>
            <h4 id="batting-target-heading">Pick a scoring lane</h4>
          </div>
          <span>{getBattingTarget(tactics?.target).label}</span>
        </div>
        <div className="sim-batting-target-layout">
          <BattingTargetMap
            target={tactics?.target}
            onTargetChange={(target) => updateTactics({ target })}
          />
        </div>
        <label className="sim-batting-retain-choice">
          <input
            type="checkbox"
            checked={Boolean(tactics?.retainShotAndTarget)}
            aria-label="Keep shot & target for next ball"
            onChange={(event) => updateTactics({ retainShotAndTarget: event.target.checked })}
          />
          <span>
            <strong>Keep shot &amp; target for next ball</strong>
            <small>New batters and free-hit situations always start with a fresh call.</small>
          </span>
        </label>
        <p className="sim-batting-target-note">
          Select a field sector on the map with a click, or focus it and press Enter or Space.
          Targeting nudges the outcome model; exact ball direction and batter handedness are not simulated.
        </p>
      </section>

      <section className="sim-batting-control-section" aria-labelledby="batting-special-heading">
        <div className="sim-batting-section-heading">
          <div>
            <p className="sim-batting-card-kicker">SPECIAL ACTIONS</p>
            <h4 id="batting-special-heading">Use a limited advantage</h4>
          </div>
          <span>{safeContext.freeHitArmed ? 'Free hit armed' : 'Rules stay in force'}</span>
        </div>
        {safeContext.freeHitArmed ? (
          <p className="sim-batting-free-hit-note" role="status">
            Free hit armed — wicket probability is suppressed for this delivery.
          </p>
        ) : null}
        <div className="sim-batting-special-actions" role="group" aria-label="Special batting actions">
          {[superShotAction, freeHitAction].filter(Boolean).map((action) => (
            <button
              key={action.key}
              type="button"
              className={`sim-batting-special-button${intent === action.key ? ' active' : ''}`}
              aria-pressed={intent === action.key}
              aria-label={action.reason ? `${action.label}. ${action.reason}` : action.label}
              disabled={Boolean(action.disabled)}
              onClick={() => setIntent(action.key)}
              title={action.reason || ''}
            >
              <strong>{action.label}</strong>
              {action.reason ? <small>{action.reason}</small> : null}
            </button>
          ))}
        </div>
      </section>

      {lastCall ? (
        <p className="sim-batting-last-call" aria-live="polite">
          Last call: {lastCallLabels} <span aria-hidden="true">→</span> {lastTacticalEvent.resultLabel || getBallLabel(lastTacticalEvent)}
        </p>
      ) : null}

      <section className="sim-batting-over-tracker" aria-labelledby="batting-over-heading">
        <div className="sim-batting-section-heading">
          <div>
            <p className="sim-batting-card-kicker">OVER {safeContext.currentOverNumber || 1}</p>
            <h4 id="batting-over-heading">Ball-by-ball</h4>
          </div>
          <span>{completedBalls}/6 legal balls</span>
        </div>
        <ol className="sim-batting-ball-track" aria-label="Current over ball tracker">
          {Array.from({ length: 6 }, (_, index) => {
            const number = index + 1;
            const event = legalEvents.find((item) => item.ballNumber === number);
            return (
              <li key={number} className={event?.isWicket ? 'wicket' : event ? 'completed' : ''}>
                <span>{number}</span>
                <strong>{event ? getBallLabel(event) : number === nextBall ? 'Next' : '—'}</strong>
              </li>
            );
          })}
        </ol>
        {extraEvents.length ? (
          <p className="sim-batting-extra-track">
            Extras do not use a legal-ball slot: {extraEvents.map(getBallLabel).join(' · ')}
          </p>
        ) : null}
      </section>

      <p className="sim-batting-condition-note">
        {formatConditionLabel(safeContext.matchCondition?.pitch)} pitch · {formatConditionLabel(safeContext.matchCondition?.weather)} · {formatConditionLabel(safeContext.matchCondition?.outfield)}
      </p>
    </section>
  );
}

export default BattingTacticsPanel;
