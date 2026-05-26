export const buildSeasonProgressionNotes = (careerPlayerStats) => {
  const notes = [];

  Object.values(careerPlayerStats || {}).forEach((stats) => {
    if (!stats || !stats.name) {
      return;
    }

    if (stats.runs >= 300) {
      notes.push({ player: stats.name, team: stats.team, note: `Outstanding season: ${stats.runs} runs` });
    } else if (stats.runs >= 150) {
      notes.push({ player: stats.name, team: stats.team, note: `Good batting season: ${stats.runs} runs` });
    }

    if (stats.wickets >= 15) {
      notes.push({ player: stats.name, team: stats.team, note: `Excellent bowling: ${stats.wickets} wickets` });
    } else if (stats.wickets >= 8) {
      notes.push({ player: stats.name, team: stats.team, note: `Solid bowling: ${stats.wickets} wickets` });
    }
  });

  return notes;
};
