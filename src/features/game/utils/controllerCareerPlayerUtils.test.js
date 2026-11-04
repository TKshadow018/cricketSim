import { buildSeasonProgressionNotes } from './controllerCareerPlayerUtils';

describe('career season progression notes', () => {
  test('creates separate batting and bowling milestones with player metadata', () => {
    const notes = buildSeasonProgressionNotes({
      outstanding: {
        name: 'All-round Star',
        team: 'North',
        runs: 400,
        wickets: 20,
        playerType: 'pace allrounder',
        paceAbility: 80,
        spinAbility: 60,
        abilityToPlayPaceBall: 70,
        abilityToPlaySpinBall: 65,
        isWicketKeeper: false,
      },
      goodBatting: { name: 'Solid Batter', team: 'South', runs: 200, wickets: 8 },
      noMilestone: { name: 'New Player', team: 'East', runs: 149, wickets: 7 },
      outstandingWithoutProfile: { name: 'Season Batter', runs: 300 },
      leadingBowlerWithoutProfile: { name: 'Season Bowler', wickets: 15 },
      invalid: null,
      unnamed: { runs: 500, wickets: 20 },
    });

    expect(notes).toEqual([
      expect.objectContaining({
        player: 'All-round Star',
        team: 'North',
        note: 'Outstanding season: 400 runs',
        playerType: 'pace allrounder',
        paceAbility: 80,
        spinAbility: 60,
      }),
      expect.objectContaining({
        player: 'All-round Star',
        note: 'Excellent bowling: 20 wickets',
      }),
      expect.objectContaining({
        player: 'Solid Batter',
        note: 'Good batting season: 200 runs',
      }),
      expect.objectContaining({
        player: 'Solid Batter',
        note: 'Solid bowling: 8 wickets',
      }),
      expect.objectContaining({
        player: 'Season Batter',
        note: 'Outstanding season: 300 runs',
        playerType: '',
        paceAbility: 0,
        spinAbility: 0,
        abilityToPlayPaceBall: 0,
        abilityToPlaySpinBall: 0,
      }),
      expect.objectContaining({
        player: 'Season Bowler',
        note: 'Excellent bowling: 15 wickets',
        playerType: '',
        paceAbility: 0,
        spinAbility: 0,
        abilityToPlayPaceBall: 0,
        abilityToPlaySpinBall: 0,
      }),
    ]);
  });

  test('returns no notes for empty or below-threshold season totals', () => {
    expect(buildSeasonProgressionNotes()).toEqual([]);
    expect(buildSeasonProgressionNotes({ player: { name: 'Below thresholds', runs: 149, wickets: 7 } })).toEqual([]);
  });
});
