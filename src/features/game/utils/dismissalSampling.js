export const sampleDismissal = ({ fraction, freeHitRunOut, inningState, bowlingSide = [], bowler }) => {
  let type;
  if (freeHitRunOut) type = 'runOut';
  else if (fraction < 0.5) type = 'caught';
  else if (fraction < 0.7) type = 'bowled';
  else if (fraction < 0.85) type = 'lbw';
  else if (fraction < 0.92) type = 'runOut';
  else if (fraction < 0.97) type = 'stumped';
  else if (fraction < 0.99) type = 'caughtAndBowled';
  else type = 'hitWicket';

  const runOutFraction = freeHitRunOut ? fraction : (fraction - 0.85) / 0.07;
  const batterIndex = type === 'runOut' && runOutFraction >= 0.5
    ? inningState.nonStrikerIndex
    : inningState.strikerIndex;
  const fielders = bowlingSide.filter((player) => player && player !== bowler);
  const fielder = type === 'stumped'
    ? bowlingSide.find((player) => player?.isWicketKeeper)
    : type === 'caughtAndBowled'
      ? bowler
      : fielders[Math.min(fielders.length - 1, Math.floor(fraction * fielders.length))];

  return {
    type,
    ...(batterIndex !== undefined && batterIndex !== null ? { batterIndex } : {}),
    ...(['caught', 'runOut', 'stumped', 'caughtAndBowled'].includes(type) && fielder?.name
      ? { fielderName: fielder.name }
      : {}),
  };
};
