export const withInningsExtras = (scorecard, innings) => {
  const wides = innings.wides || 0;
  const noBalls = innings.noBalls || 0;
  const byes = innings.byes || 0;
  const legByes = innings.legByes || 0;
  return {
    ...scorecard,
    extras: { wides, noBalls, byes, legByes, total: wides + noBalls + byes + legByes },
  };
};
