export const buildSeasonProgressionNotes = (careerPlayerStats) => {
  const notes = [];

  Object.values(careerPlayerStats || {}).forEach((stats) => {
    if (!stats || !stats.name) {
      return;
    }

    if (stats.runs >= 300) {
      notes.push({
        player: stats.name,
        team: stats.team,
        note: `Outstanding season: ${stats.runs} runs`,
        playerType: stats.playerType || '',
        isWicketKeeper: !!stats.isWicketKeeper,
        paceAbility: stats.paceAbility || 0,
        spinAbility: stats.spinAbility || 0,
        abilityToPlayPaceBall: stats.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: stats.abilityToPlaySpinBall || 0,
      });
    } else if (stats.runs >= 150) {
      notes.push({
        player: stats.name,
        team: stats.team,
        note: `Good batting season: ${stats.runs} runs`,
        playerType: stats.playerType || '',
        isWicketKeeper: !!stats.isWicketKeeper,
        paceAbility: stats.paceAbility || 0,
        spinAbility: stats.spinAbility || 0,
        abilityToPlayPaceBall: stats.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: stats.abilityToPlaySpinBall || 0,
      });
    }

    if (stats.wickets >= 15) {
      notes.push({
        player: stats.name,
        team: stats.team,
        note: `Excellent bowling: ${stats.wickets} wickets`,
        playerType: stats.playerType || '',
        isWicketKeeper: !!stats.isWicketKeeper,
        paceAbility: stats.paceAbility || 0,
        spinAbility: stats.spinAbility || 0,
        abilityToPlayPaceBall: stats.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: stats.abilityToPlaySpinBall || 0,
      });
    } else if (stats.wickets >= 8) {
      notes.push({
        player: stats.name,
        team: stats.team,
        note: `Solid bowling: ${stats.wickets} wickets`,
        playerType: stats.playerType || '',
        isWicketKeeper: !!stats.isWicketKeeper,
        paceAbility: stats.paceAbility || 0,
        spinAbility: stats.spinAbility || 0,
        abilityToPlayPaceBall: stats.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: stats.abilityToPlaySpinBall || 0,
      });
    }
  });

  return notes;
};
