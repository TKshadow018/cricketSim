export const getBallEventLabel = (event = {}) => {
  if (event.resultLabel) return event.resultLabel;
  const extraRuns = Number(event.extraRuns ?? event.extras) || 0;
  const runs = Number(event.runs) || 0;
  const details = [];
  if (event.isWicket) details.push('W');
  if (event.token === 'wide') details.push(`WD +${extraRuns || 1}`);
  if (event.token === 'nb') {
    details.push(`NB +${extraRuns || 1}`);
    if (runs) details.push(`${runs} bat`);
  }
  if (event.token === 'bye') details.push(`B +${extraRuns}`);
  if (event.token === 'legBye') details.push(`LB +${extraRuns}`);
  return details.length ? details.join(' · ') : String(runs);
};
