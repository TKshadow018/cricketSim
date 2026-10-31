import { classifyPlayerType, countBowlingRolePlayers } from './playerTypes';
import { playerListForNation } from './playerListForNation';
import IndiaPlayers from './players/India';
import { assignCareerSkills } from './playerSkills';
import { skillList } from './skillList';
import { skillApplyTimeEnum } from './skillApplyTimeEnum';
import { selectAIPlayingXI } from '../features/game/utils/controllerCommonUtils';

describe('national player type classification', () => {
  test('defines the skill impact apply-time enum', () => {
    expect(skillApplyTimeEnum).toEqual({
      always: 'always',
      whenBatting: 'whenBatting',
      whenBowling: 'whenBowling',
      powerPlay: 'powerPlay',
      last20PercentOfOvers: 'last20PercentOfOvers',
    });
  });

  test.each([
    [{ isWicketKeeper: true, paceAbility: 99 }, 'wicketkeeper'],
    [{ abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, paceAbility: 61 }, 'pace allrounder'],
    [{ abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, spinAbility: 61 }, 'spin allrounder'],
    [{ abilityToPlayPaceBall: 71, abilityToPlaySpinBall: 50, paceAbility: 60, spinAbility: 60 }, 'batsman'],
    [{ abilityToPlayPaceBall: 30, abilityToPlaySpinBall: 30, paceAbility: 71 }, 'pacer'],
    [{ abilityToPlayPaceBall: 30, abilityToPlaySpinBall: 30, spinAbility: 71 }, 'spiner'],
    [{ abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, paceAbility: 61, spinAbility: 61 }, 'pace allrounder'],
    [{ abilityToPlayPaceBall: 30, abilityToPlaySpinBall: 30, paceAbility: 70, spinAbility: 70 }, 'pacer'],
    [{ abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 }, 'batsman'],
  ])('classifies %o as %s according to priority and thresholds', (player, expectedType) => {
    expect(classifyPlayerType(player)).toBe(expectedType);
  });

  test('lowers the thresholds by ten and retries until a player type matches', () => {
    expect(classifyPlayerType({ paceAbility: 50 })).toBe('pacer');
  });

  test('retries the batting-total rule instead of assigning a generic bowler type', () => {
    expect(classifyPlayerType({
      abilityToPlayPaceBall: 60,
      abilityToPlaySpinBall: 60,
    })).toBe('batsman');
  });

  test('counts only pace/spin allrounders and pacers/spinners toward the five-player quota', () => {
    const players = [
      { playerType: 'wicketkeeper', isWicketKeeper: true },
      { playerType: 'pace allrounder' },
      { playerType: 'spin allrounder' },
      { playerType: 'pacer' },
      { playerType: 'spiner' },
      { playerType: 'batsman' },
      { playerType: 'bowler' },
    ];

    expect(countBowlingRolePlayers(players)).toBe(4);
  });

  test('uses classified roles for national players that do not have an explicit playerType', () => {
    const players = [
      { abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, paceAbility: 61 },
      { abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, spinAbility: 61 },
      { abilityToPlayPaceBall: 30, abilityToPlaySpinBall: 30, paceAbility: 71 },
      { abilityToPlayPaceBall: 30, abilityToPlaySpinBall: 30, spinAbility: 71 },
    ];

    expect(countBowlingRolePlayers(players)).toBe(4);
  });

  test('assigns a playerType to every national player and provides at least five bowling-role options', () => {
    Object.values(playerListForNation).forEach((roster) => {
      expect(roster.every((player) => player.playerType === classifyPlayerType(player))).toBe(true);
      expect(countBowlingRolePlayers(roster)).toBeGreaterThanOrEqual(5);
    });
  });

  test('gives every national player an integer batting-order preference from 1 to 1000', () => {
    Object.values(playerListForNation)
      .flat()
      .forEach((player) => {
        expect(Number.isInteger(player.battingOrderPreference)).toBe(true);
        expect(player.battingOrderPreference).toBeGreaterThanOrEqual(1);
        expect(player.battingOrderPreference).toBeLessThanOrEqual(1000);
      });
  });

  test('assigns every national player up to three skills from the shared skill list', () => {
    const players = Object.values(playerListForNation).flat();
    const skillNames = skillList.map(({ name }) => name);

    expect(skillList).toHaveLength(20);
    expect(new Set(skillNames).size).toBe(skillNames.length);
    expect(skillList.every((skill) =>
      typeof skill.name === 'string' &&
      ['batting', 'bowling', 'fielding', 'personality'].includes(skill.affects) &&
      typeof skill.icon === 'string' &&
      skill.icon.length > 0 &&
      skill.frequency >= 0 &&
      skill.frequency <= 100
    )).toBe(true);
    players.forEach((player) => {
      expect(Array.isArray(player.skills)).toBe(true);
      expect(player.skills.length).toBeLessThanOrEqual(3);
      expect(player.skills.every((skill) => skillNames.includes(skill))).toBe(true);
    });
    expect(players.some((player) => player.skills.length === 0)).toBe(true);
    expect(players.some((player) => player.skills.length > 0)).toBe(true);
  });

  test('defines per-skill scoped probability impacts and timing', () => {
    const outcomes = new Set(['0', '1', '2', '3', '4', '6', 'wide', 'nb', 'W']);
    const applyTimes = new Set(Object.values(skillApplyTimeEnum));
    const expectedImpacts = {
      YorkerKing: {
        applyTime: 'whenBowling',
        bowling: { W: 2, '0': 3, '1': 1, '2': -2, '4': -2, '6': -2 },
      },
      SwingMaster: {
        applyTime: 'whenBowling',
        bowling: { W: 1, '0': 4, '1': -3, '4': -1, '6': -1 },
      },
      SeamSpecialist: {
        applyTime: 'whenBowling',
        bowling: { W: 2, '0': 3, '1': -5, '2': -2, '4': 1, '6': 1 },
      },
      ReverseSwingArtist: {
        applyTime: 'whenBowling',
        bowling: { W: 1, '0': 4, '1': -2, '2': -1, '4': -1, '6': -1 },
      },
      SpinWizard: {
        applyTime: 'whenBowling',
        bowling: { W: 2, '0': 2, '1': -1, '2': -1, '4': -1, '6': -1 },
      },
      DoosraArtist: {
        applyTime: 'whenBowling',
        bowling: { W: 3, '0': 1, '1': -1, '2': -1, '4': -1, '6': -1 },
      },
      GooglyGenius: {
        applyTime: 'whenBowling',
        bowling: { W: 3, '0': 1, '1': -1, '2': -1, '4': -1, '6': -1 },
      },
      FlightMaster: {
        applyTime: 'whenBowling',
        bowling: { W: 1, '0': 3, '1': -1, '2': -1, '4': -1, '6': -1 },
      },
      MagicHand: {
        applyTime: 'whenBowling',
        bowling: { W: 2, '0': 2, '1': -1, '2': -1, '4': -1, '6': -1 },
      },
      SlowMotionVision: {
        applyTime: 'whenBatting',
        batting: { '0': -3, '1': 2, '2': 1 },
      },
      HardHitter: {
        applyTime: 'whenBatting',
        batting: { '6': 3, W: 1, '4': 2, '0': -3, '1': -2, '2': -1 },
      },
      Finisher: {
        applyTime: 'last20PercentOfOvers',
        batting: { '4': 2, '6': 2, W: 2, '0': -3, '1': -2, '2': -1 },
      },
      Anchor: {
        applyTime: 'whenBatting',
        batting: { '4': -2, '6': -1, W: -2, '0': 3, '1': 2 },
      },
      CoverDriveArtist: {
        applyTime: 'whenBatting',
        batting: { '2': 1, '0': -2, '1': 1 },
      },
      SweepSpecialist: {
        applyTime: 'whenBatting',
        batting: { '2': 1, '3': -1, '0': -1, '1': 1 },
      },
      WicketWall: {
        applyTime: 'whenBowling',
        bowling: { '4': -2, '6': -2, W: -2, '0': 5, '1': 1 },
      },
      PowerplaySpecialist: {
        applyTime: 'powerPlay',
        batting: { '4': 3, '6': 2, W: 1, '0': -4, '1': -2 },
      },
      ClutchPerformer: {
        applyTime: 'always',
        batting: { '0': -1, '4': 1 },
        bowling: { '0': 1, '4': -1 },
      },
      SafeHands: {
        applyTime: 'whenBowling',
        fullTeamBowling: { '0': 2, '1': 1, '2': -1, '3': -1, '4': -1 },
      },
      CaptainCalm: {
        applyTime: 'always',
        batting: { '0': 1, W: -1 },
        bowling: { '0': 1, W: -1 },
        fullTeamBatting: { '0': -1, '1': 1 },
        fullTeamBowling: { '0': 1, '1': -1 },
      },
    };

    skillList.forEach(({ name, impact }) => {
      expect(impact).toBeDefined();
      expect(impact).toEqual(expectedImpacts[name]);
      expect(applyTimes.has(impact.applyTime)).toBe(true);

      Object.entries(impact)
        .filter(([scope]) => scope !== 'applyTime')
        .forEach(([scope, deltas]) => {
          expect(['batting', 'bowling', 'fullTeamBatting', 'fullTeamBowling'])
            .toContain(scope);
          expect(Object.keys(deltas).length).toBeGreaterThan(0);
          expect(Object.entries(deltas).every(([outcome, delta]) =>
            outcomes.has(outcome) && Number.isFinite(delta)
          )).toBe(true);
          expect(Object.values(deltas).reduce((total, delta) => total + delta, 0)).toBe(0);
        });
    });
    expect(Object.keys(expectedImpacts).sort()).toEqual(
      skillList.map(({ name }) => name).sort()
    );
  });

  test('keeps curated national batting and bowling skills within the matching player roles', () => {
    const battingRoles = new Set(['batsman', 'wicketkeeper', 'pace allrounder', 'spin allrounder']);
    const bowlingRoles = new Set(['pacer', 'spiner', 'pace allrounder', 'spin allrounder']);
    const skillsByName = new Map(skillList.map((skill) => [skill.name, skill]));

    Object.values(playerListForNation).flat().forEach((player) => {
      const hasRoleMismatch = player.skills.some((name) => {
        const domain = skillsByName.get(name).affects;
        return (domain === 'batting' && !battingRoles.has(player.playerType)) ||
          (domain === 'bowling' && !bowlingRoles.has(player.playerType));
      });
      expect(hasRoleMismatch).toBe(false);
    });
  });

  test('keeps national skills on the exported player records', () => {
    Object.values(playerListForNation).flat().forEach((player) => {
      expect(Array.isArray(player.skills)).toBe(true);
    });
    expect(IndiaPlayers.find(({ name }) => name === 'Jasprit Bumrah').skills).toContain('YorkerKing');
    expect(IndiaPlayers.find(({ name }) => name === 'Virat Kohli').skills).toContain('CoverDriveArtist');
  });

  test('randomly assigns career skills by frequency without crossing player roles', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const bowlerSkills = assignCareerSkills({
      playerType: 'pacer',
      abilityToPlayPaceBall: 10,
      abilityToPlaySpinBall: 10,
      paceAbility: 90,
      spinAbility: 10,
    });
    const batterSkills = assignCareerSkills({
      playerType: 'batsman',
      abilityToPlayPaceBall: 90,
      abilityToPlaySpinBall: 90,
      paceAbility: 10,
      spinAbility: 10,
    });

    expect(bowlerSkills.length).toBeLessThanOrEqual(2);
    expect(bowlerSkills.every((name) =>
      skillList.find((skill) => skill.name === name).affects !== 'batting'
    )).toBe(true);
    expect(batterSkills.length).toBeLessThanOrEqual(2);
    expect(batterSkills.every((name) =>
      skillList.find((skill) => skill.name === name).affects !== 'bowling'
    )).toBe(true);
  });

  test('honors skill frequency percentages in Career Mode', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(assignCareerSkills({ playerType: 'batsman' })).toEqual([]);
  });

  test('auto-picks a qualifying XI for each national roster', () => {
    Object.values(playerListForNation).forEach((roster) => {
      const selectedIds = selectAIPlayingXI({ roster, requireBowlingQuota: true });
      const playersById = new Map(roster.map((player) => [player.id, player]));
      const selectedPlayers = selectedIds.map((id) => playersById.get(id));

      expect(selectedIds).toHaveLength(11);
      expect(countBowlingRolePlayers(selectedPlayers)).toBeGreaterThanOrEqual(5);
    });
  });
});
