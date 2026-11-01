export const formatDismissal = (stat) => {
  const dismissal = stat.dismissal || {};
  const bowler = stat.outByBowler || 'Unknown';
  const fielder = dismissal.fielderName || 'Unknown';
  let description;
  switch (dismissal.type) {
    case 'runOut':
      description = dismissal.fielderName ? `run out (${dismissal.fielderName})` : 'run out';
      break;
    case 'caught':
      description = `c ${fielder} b ${bowler}`;
      break;
    case 'caughtAndBowled':
      description = `c & b ${bowler}`;
      break;
    case 'lbw':
      description = `lbw b ${bowler}`;
      break;
    case 'stumped':
      description = `st ${fielder} b ${bowler}`;
      break;
    case 'hitWicket':
      description = `hit wicket b ${bowler}`;
      break;
    default:
      description = `b ${bowler}`;
  }
  return `${description} @ ${stat.outAtScore || '-'} (${stat.outAtBall || '-'})`;
};
