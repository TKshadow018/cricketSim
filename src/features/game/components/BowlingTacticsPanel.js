import React from 'react';
import PlayerNameWithType from './PlayerNameWithType';
import BowlingFieldMap from './BowlingFieldMap';
import {
  BOWLING_FIELD_PRESETS,
  BOWLING_LENGTHS,
  BOWLING_LINES,
  BOWLING_OVER_PLANS,
  getAvailableBowlingVariations,
} from '../utils/bowlingTactics';
import '../styles/bowling-tactics.css';
import '../styles/bowling-tactics-controls.css';

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

function BowlingTacticsPanel({
  tactics,
  context,
  onTacticsChange,
}) {
  const [variationNotice, setVariationNotice] = React.useState('');
  const safeContext = context || {};
  const bowler = safeContext.bowler || null;
  const hasBowler = Boolean(bowler);
  const variations = getAvailableBowlingVariations(bowler || {});
  const variationIsSupported = variations.some(({ key }) => key === tactics?.variation);
  const currentEvents = Array.isArray(safeContext.currentOverEvents) ? safeContext.currentOverEvents : [];
  const legalEvents = currentEvents.filter((event) => Number.isInteger(event?.ballNumber));
  const extraEvents = currentEvents.filter((event) => !Number.isInteger(event?.ballNumber));
  const completedBalls = Math.min(6, Number(safeContext.currentOverBall) || 0);
  const nextBall = completedBalls < 6 ? completedBalls + 1 : null;
  const special = safeContext.specialDelivery || {};
  const isSpecialArmed = Boolean(tactics?.specialDeliveryArmed);
  const runRateTarget = safeContext.target !== null && safeContext.target !== undefined;
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
  const batterAbility = batterStyle
    ? Number(safeContext.striker?.player?.[batterStyle]) || 0
    : null;
  const specialDisabled = !isSpecialArmed && (!special.available || Number(special.remaining) <= 0);
  const specialAvailability = Number(special.remaining) <= 0
    ? 'No credits remaining this innings'
    : Number(special.usedThisOver) >= 1
      ? 'One special delivery per over'
      : special.available
        ? `${formatNumber(special.remaining)} remaining · one per over`
        : 'Requires pace or spin above 70';

  const updateTactics = (patch) => {
    if (patch?.variation) {
      setVariationNotice('');
    }
    if (typeof onTacticsChange === 'function') {
      onTacticsChange(patch);
    }
  };

  React.useEffect(() => {
    if (!hasBowler || !tactics?.variation || variationIsSupported || tactics.variation === 'stock') {
      return;
    }
    const unavailableVariation = tactics.variation;
    setVariationNotice(`${unavailableVariation} is not available for this bowler; switched to stock.`);
    if (typeof onTacticsChange === 'function') {
      onTacticsChange({ variation: 'stock' });
    }
  }, [hasBowler, onTacticsChange, tactics?.variation, variationIsSupported]);

  return (
    <section className="sim-bowling-cockpit" aria-label="Bowling tactics">
      <header className="sim-bowling-cockpit-header">
        <div>
          <p className="sim-bowling-kicker">Bowling · Over {safeContext.currentOverNumber || 1}</p>
          <h3>Set the field. Call the ball.</h3>
        </div>
        <div className="sim-bowling-score-context" aria-label="Current innings score">
          <strong>{formatNumber(safeContext.score)}/{formatNumber(safeContext.wickets)}</strong>
          <span>{safeContext.over || '0.0'} overs</span>
        </div>
      </header>

      <div className="sim-bowling-situation" aria-label="Match situation">
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
            <div><span>Pitch</span><strong>{safeContext.matchCondition?.pitch || '—'}</strong></div>
          </>
        )}
      </div>

      <div className="sim-bowling-player-matchup">
        <article className="sim-bowling-player-card sim-bowling-player-card--bowler">
          <div className="sim-bowling-player-card-heading">
            <span className="sim-bowling-card-kicker">ON THE MARK</span>
            <span className="sim-bowling-style">{bowlerStyle}</span>
          </div>
          <strong className="sim-bowling-player-name">
            {bowler ? <PlayerNameWithType player={bowler} /> : 'Choose a bowler'}
          </strong>
          <div className="sim-bowling-figures">
            <span><b>{safeContext.bowlerFigures?.overs || '0.0'}</b> overs</span>
            <span><b>{formatNumber(safeContext.bowlerFigures?.runs)}</b> runs</span>
            <span><b>{formatNumber(safeContext.bowlerFigures?.wickets)}</b> wkts</span>
            <span><b>{safeContext.bowlerFigures?.economy || '0.00'}</b> econ</span>
          </div>
          <div className="sim-bowler-quota">
            <span>Quota remaining</span>
            <strong>{safeContext.bowlerFigures?.oversRemaining || '0.0'} overs</strong>
          </div>
        </article>

        <article className="sim-bowling-batter-card">
          <div className="sim-bowling-player-card-heading">
            <span className="sim-bowling-card-kicker">STRIKER</span>
            <span className="sim-bowling-matchup-label">{batterAbility === null ? bowlerStyle : `${bowlerStyle} matchup ${batterAbility}`}</span>
          </div>
          <strong className="sim-bowling-player-name">
            {safeContext.striker?.player
              ? <PlayerNameWithType player={safeContext.striker.player} />
              : 'Batter'}
          </strong>
          <div className="sim-batting-figures">
            <span><b>{formatNumber(safeContext.striker?.runs)}</b> runs</span>
            <span><b>{formatNumber(safeContext.striker?.balls)}</b> balls</span>
            <span>Non-striker <b>{safeContext.nonStriker?.player?.name || '—'}</b></span>
          </div>
        </article>
      </div>

      <section className="sim-bowling-control-section" aria-labelledby="bowling-plan-heading">
        <div className="sim-bowling-section-heading">
          <div>
            <p className="sim-bowling-card-kicker">OVER PLAN</p>
            <h4 id="bowling-plan-heading">Choose your approach</h4>
          </div>
          <span>Applies until changed</span>
        </div>
        <div className="sim-bowling-plan-grid" role="group" aria-label="Bowling over plan">
          {BOWLING_OVER_PLANS.map((plan) => (
            <button
              key={plan.key}
              type="button"
              className={`sim-bowling-plan-card${tactics?.overPlan === plan.key ? ' active' : ''}`}
              aria-label={plan.label}
              aria-describedby={`bowling-plan-description-${plan.key}`}
              aria-pressed={tactics?.overPlan === plan.key}
              onClick={() => updateTactics({ overPlan: plan.key })}
            >
              <strong>{plan.label}</strong>
              <small id={`bowling-plan-description-${plan.key}`}>{plan.description}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="sim-bowling-field-layout">
        <section className="sim-bowling-control-section" aria-labelledby="bowling-field-heading">
          <div className="sim-bowling-section-heading">
            <div>
              <p className="sim-bowling-card-kicker">FIELD SETTING</p>
              <h4 id="bowling-field-heading">Protect the right areas</h4>
            </div>
          </div>
          <div className="sim-bowling-field-tabs" role="group" aria-label="Field preset">
            {BOWLING_FIELD_PRESETS.map((field) => (
              <button
                key={field.key}
                type="button"
                className={`sim-bowling-field-tab${tactics?.fieldPreset === field.key ? ' active' : ''}`}
                aria-pressed={tactics?.fieldPreset === field.key}
                onClick={() => updateTactics({ fieldPreset: field.key })}
              >
                {field.label}
              </button>
            ))}
          </div>
          <BowlingFieldMap preset={tactics?.fieldPreset} />
        </section>

        <section className="sim-bowling-control-section" aria-labelledby="bowling-call-heading">
          <div className="sim-bowling-section-heading">
            <div>
              <p className="sim-bowling-card-kicker">NEXT BALL</p>
              <h4 id="bowling-call-heading">Call line and length</h4>
            </div>
            <span>Last call stays selected</span>
          </div>
          <div className="sim-bowling-pitch-call" role="group" aria-label="Delivery line and length">
            <div className="sim-bowling-pitch-axis" aria-hidden="true">
              <span>Yorker</span>
              <span>Full</span>
              <span>Good</span>
              <span>Short</span>
            </div>
            <div className="sim-bowling-pitch-grid">
              {BOWLING_LINES.map((line) => (
                <div className="sim-bowling-pitch-row" key={line.key}>
                  <span className="sim-bowling-pitch-row-label">{line.label}</span>
                  {BOWLING_LENGTHS.map((length) => {
                    const selected = tactics?.line === line.key && tactics?.length === length.key;
                    return (
                      <button
                        key={`${line.key}-${length.key}`}
                        type="button"
                        aria-label={`Call ${line.label.toLowerCase()} ${length.label.toLowerCase()}`}
                        aria-pressed={selected}
                        className={`sim-bowling-pitch-target${selected ? ' active' : ''}`}
                        onClick={() => updateTactics({ line: line.key, length: length.key })}
                      >
                        {selected ? <span aria-hidden="true">●</span> : <span aria-hidden="true">·</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="sim-bowling-pitch-hint">
            Select the intended landing area. Execution and batter response remain probabilistic.
          </p>

          <div className="sim-bowling-variation-control">
            <span className="sim-bowling-card-kicker">DELIVERY</span>
            <div role="group" aria-label="Bowling variation">
              {variations.map((variation) => (
                <button
                  key={variation.key}
                  type="button"
                  className={`sim-bowling-variation${tactics?.variation === variation.key ? ' active' : ''}`}
                  aria-pressed={tactics?.variation === variation.key}
                  onClick={() => updateTactics({ variation: variation.key })}
                >
                  {variation.label}
                </button>
              ))}
            </div>
          </div>
          {variationNotice ? (
            <p className="sim-bowling-variation-notice" role="status">{variationNotice}</p>
          ) : null}
          <p className="sim-bowling-condition-note">
            {formatConditionLabel(safeContext.matchCondition?.pitch)} pitch · {formatConditionLabel(safeContext.matchCondition?.weather)} · {formatConditionLabel(safeContext.matchCondition?.outfield)}
          </p>
        </section>
      </div>

      <div className="sim-bowling-bottom-row">
        <section className="sim-bowling-over-tracker" aria-labelledby="bowling-over-heading">
          <div className="sim-bowling-section-heading">
            <div>
              <p className="sim-bowling-card-kicker">OVER {safeContext.currentOverNumber || 1}</p>
              <h4 id="bowling-over-heading">Ball tracker</h4>
            </div>
            <span>{completedBalls}/6 legal balls</span>
          </div>
          <ol className="sim-bowling-ball-slots" aria-label="Current over ball tracker">
            {Array.from({ length: 6 }, (_, index) => {
              const ballNumber = index + 1;
              const event = legalEvents.find((entry) => entry.ballNumber === ballNumber);
              const isNext = ballNumber === nextBall;
              return (
                <li
                  key={ballNumber}
                  className={`${event ? 'has-result' : ''}${isNext ? ' next-ball' : ''}`}
                >
                  <span>{ballNumber}</span>
                  <strong>{event ? getBallLabel(event) : '—'}</strong>
                </li>
              );
            })}
          </ol>
          {extraEvents.length ? (
            <p className="sim-bowling-over-extras">
              Extras: {extraEvents.map((event) => getBallLabel(event)).join(' · ')}
            </p>
          ) : null}
        </section>

        <section className={`sim-bowling-special${isSpecialArmed ? ' armed' : ''}`} aria-label="Special delivery">
          <div>
            <p className="sim-bowling-card-kicker">LIMITED RESOURCE</p>
            <strong>Special delivery</strong>
            <small>Special deliveries: {specialAvailability}</small>
          </div>
          <button
            type="button"
            className="sim-bowling-special-button"
            aria-pressed={isSpecialArmed}
            onClick={() => updateTactics({ specialDeliveryArmed: !isSpecialArmed })}
            disabled={specialDisabled}
          >
            {isSpecialArmed ? 'Cancel special' : 'Use special delivery'}
          </button>
          {isSpecialArmed ? <span className="sim-bowling-special-armed" role="status">Armed for next ball</span> : null}
        </section>
      </div>
    </section>
  );
}

export default BowlingTacticsPanel;
