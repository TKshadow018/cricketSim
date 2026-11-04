import { buildOutcomeAnalysis, buildOutcomeWeights } from './controllerOutcomeUtils';

const basePlay = {
  striker: { id: 'striker', abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 },
  bowler: { id: 'bowler', paceAbility: 60, spinAbility: 40 },
  inningState: { balls: 0, freeHitArmed: false },
  battingSide: [],
  bowlingSide: [],
  isUserBatting: false,
  isUserBowling: false,
  battingRoles: {},
  bowlingRoles: {},
  bowlingTeamName: '',
  matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'dryAndPatchy' },
  matchType: { over: 20 },
  matchTypeKey: 't20',
  locationCountry: '',
};

const buildWeightsWith = (overrides = {}) =>
  buildOutcomeWeights({ ...basePlay, ...overrides });

describe('skill impact activation', () => {
  test('reports skill impact as the normalized probability difference', () => {
    const baseline = buildOutcomeAnalysis(basePlay);
    const withHardHitter = buildOutcomeAnalysis({
      ...basePlay,
      striker: { ...basePlay.striker, skills: ['HardHitter'] },
    });

    expect(withHardHitter.skillImpactDeltas).toEqual(
      Object.fromEntries(
        withHardHitter.outcomes.map((outcome) => [
          outcome,
          withHardHitter.weights[outcome] - baseline.weights[outcome],
        ])
      )
    );
    expect(withHardHitter.skillImpactDeltas['6']).toBe(3);
    expect(withHardHitter.skillImpactDeltas['0']).toBe(-3);

    const freeHitInnings = { ...basePlay.inningState, freeHitArmed: true };
    const freeHitBaseline = buildOutcomeAnalysis({
      ...basePlay,
      inningState: freeHitInnings,
      isUserBatting: true,
    });
    const freeHitWithHardHitter = buildOutcomeAnalysis({
      ...basePlay,
      inningState: freeHitInnings,
      isUserBatting: true,
      striker: { ...basePlay.striker, skills: ['HardHitter'] },
    });

    expect(freeHitWithHardHitter.skillImpactDeltas.W).toBe(
      freeHitWithHardHitter.weights.W - freeHitBaseline.weights.W
    );
    expect(freeHitWithHardHitter.skillImpactDeltas.W).toBe(0);
  });

  test('applies individual impacts only when the skill holder is batting or bowling', () => {
    const baseline = buildWeightsWith();
    const strikerWithSkill = buildWeightsWith({
      striker: { ...basePlay.striker, skills: ['HardHitter'] },
    });
    const bowlerWithSkill = buildWeightsWith({
      bowler: { ...basePlay.bowler, skills: ['YorkerKing'] },
    });

    expect(strikerWithSkill['6']).toBeGreaterThan(baseline['6']);
    expect(strikerWithSkill['4']).toBeGreaterThan(baseline['4']);
    expect(strikerWithSkill['0']).toBeLessThan(baseline['0']);
    expect(bowlerWithSkill.W).toBeGreaterThan(baseline.W);
    expect(bowlerWithSkill['0']).toBeGreaterThan(baseline['0']);
    expect(bowlerWithSkill['4']).toBeLessThan(baseline['4']);

    const battingSkillOnNonStriker = buildWeightsWith({
      battingSide: [
        basePlay.striker,
        { id: 'non-striker', skills: ['HardHitter'] },
      ],
    });
    const battingSkillOnBowler = buildWeightsWith({
      bowler: { ...basePlay.bowler, skills: ['HardHitter'] },
    });
    const bowlingSkillOnStriker = buildWeightsWith({
      striker: { ...basePlay.striker, skills: ['YorkerKing'] },
    });

    expect(battingSkillOnNonStriker).toEqual(baseline);
    expect(battingSkillOnBowler).toEqual(baseline);
    expect(bowlingSkillOnStriker).toEqual(baseline);
  });

  test('applies full-team impacts from skill holders on the relevant team', () => {
    const baseline = buildWeightsWith();
    const safeHandsOnBowlingTeam = buildWeightsWith({
      bowlingSide: [
        basePlay.bowler,
        { id: 'fielder', skills: ['SafeHands'] },
      ],
    });
    const safeHandsOnBattingTeam = buildWeightsWith({
      battingSide: [
        basePlay.striker,
        { id: 'fielder', skills: ['SafeHands'] },
      ],
    });
    const captainOnBattingTeam = buildWeightsWith({
      battingSide: [
        basePlay.striker,
        { id: 'captain', skills: ['CaptainCalm'] },
      ],
      battingRoles: { captainId: 'captain' },
    });
    const captainOnBowlingTeam = buildWeightsWith({
      bowlingSide: [
        basePlay.bowler,
        { id: 'captain', skills: ['CaptainCalm'] },
      ],
      bowlingRoles: { captainId: 'captain' },
    });
    const battingCaptainBaseline = buildWeightsWith({
      battingSide: [basePlay.striker],
      battingRoles: { captainId: 'striker' },
    });
    const unselectedCaptainCalm = buildWeightsWith({
      battingSide: [
        basePlay.striker,
        { id: 'captain', skills: ['CaptainCalm'] },
      ],
      battingRoles: { captainId: 'striker' },
    });

    expect(safeHandsOnBowlingTeam['0']).toBeGreaterThan(baseline['0']);
    expect(safeHandsOnBowlingTeam['4']).toBeLessThan(baseline['4']);
    expect(safeHandsOnBattingTeam).toEqual(baseline);
    expect(unselectedCaptainCalm).toEqual(battingCaptainBaseline);
    expect(captainOnBattingTeam['0']).toBeLessThan(baseline['0']);
    expect(captainOnBattingTeam['1']).toBeGreaterThan(baseline['1']);
    expect(captainOnBowlingTeam['0']).toBeGreaterThan(baseline['0']);
    expect(captainOnBowlingTeam['1']).toBeLessThan(baseline['1']);
  });

  test('applies CaptainCalm to an individual only when that holder is the selected captain', () => {
    const baseline = buildWeightsWith();
    const calmStriker = { ...basePlay.striker, skills: ['CaptainCalm'] };
    const unselectedCalmStriker = buildWeightsWith({
      striker: calmStriker,
      battingRoles: { captainId: 'another-player' },
    });
    const selectedCalmStriker = buildWeightsWith({
      striker: calmStriker,
      battingRoles: { captainId: calmStriker.id },
    });
    const selectedCaptainBaseline = buildWeightsWith({
      battingRoles: { captainId: calmStriker.id },
    });
    const nonStrikerBaseline = buildWeightsWith({
      battingSide: [basePlay.striker, { id: 'non-striker' }],
      battingRoles: { captainId: 'striker' },
    });
    const unselectedNonStriker = buildWeightsWith({
      battingSide: [
        basePlay.striker,
        { id: 'non-striker', skills: ['CaptainCalm'] },
      ],
      battingRoles: { captainId: 'striker' },
    });

    expect(unselectedCalmStriker).toEqual(baseline);
    expect(unselectedNonStriker).toEqual(nonStrikerBaseline);
    expect(selectedCalmStriker).not.toEqual(selectedCaptainBaseline);
  });

  test('applies powerplay impacts within the correct format window', () => {
    const powerplaySkill = { ...basePlay.striker, skills: ['PowerplaySpecialist'] };
    const powerplayBoundaryCases = [
      { matchTypeKey: 'ODI', matchType: { over: 50 }, lastBall: 59, firstBallAfter: 60 },
      { matchTypeKey: 't20', matchType: { over: 20 }, lastBall: 35, firstBallAfter: 36 },
      { matchTypeKey: 't10', matchType: { over: 10 }, lastBall: 11, firstBallAfter: 12 },
      { matchTypeKey: 'mini', matchType: { over: 5 }, lastBall: 5, firstBallAfter: 6 },
    ];

    powerplayBoundaryCases.forEach(({ matchTypeKey, matchType, lastBall, firstBallAfter }) => {
      const baseline = buildWeightsWith({ matchTypeKey, matchType });
      const active = buildWeightsWith({
        matchTypeKey,
        matchType,
        inningState: { ...basePlay.inningState, balls: lastBall },
        striker: powerplaySkill,
      });
      const inactive = buildWeightsWith({
        matchTypeKey,
        matchType,
        inningState: { ...basePlay.inningState, balls: firstBallAfter },
        striker: powerplaySkill,
      });

      expect(active['4']).toBeGreaterThan(baseline['4']);
      expect(inactive).toEqual(baseline);
    });

    const testMatchWeights = buildWeightsWith({
      matchTypeKey: 'test',
      matchType: { over: 90 },
    });
    expect(buildWeightsWith({
      matchTypeKey: 'test',
      matchType: { over: 90 },
      striker: powerplaySkill,
    })).toEqual(testMatchWeights);
  });

  test('activates a finisher in the final 20 percent, starting at over 41 in ODIs', () => {
    const match = {
      matchTypeKey: 'ODI',
      matchType: { over: 50 },
    };
    const baseline = buildWeightsWith(match);
    const finisher = { ...basePlay.striker, skills: ['Finisher'] };
    const beforeFinalTwentyPercent = buildWeightsWith({
      ...match,
      inningState: { ...basePlay.inningState, balls: 239 },
      striker: finisher,
    });
    const inFinalTwentyPercent = buildWeightsWith({
      ...match,
      inningState: { ...basePlay.inningState, balls: 240 },
      striker: finisher,
    });

    expect(beforeFinalTwentyPercent).toEqual(baseline);
    expect(inFinalTwentyPercent['4']).toBeGreaterThan(baseline['4']);
    expect(inFinalTwentyPercent['6']).toBeGreaterThan(baseline['6']);
    expect(inFinalTwentyPercent['0']).toBeLessThan(baseline['0']);
  });
});
