import { classifyPlayerType, countBowlingRolePlayers } from './playerTypes';
import { playerListForNation } from './playerListForNation';
import { assignCareerSkills, getNationalPlayerSkills } from './playerSkills';
import { skillList } from './skillList';
import { selectAIPlayingXI } from '../features/game/utils/controllerCommonUtils';

describe('national player type classification', () => {
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
    expect(skillList.every(({ affects, frequency, name }) =>
      typeof name === 'string' &&
      ['batting', 'bowling', 'fielding', 'personality'].includes(affects) &&
      frequency >= 0 &&
      frequency <= 100
    )).toBe(true);
    players.forEach((player) => {
      expect(Array.isArray(player.skills)).toBe(true);
      expect(player.skills.length).toBeLessThanOrEqual(3);
      expect(player.skills.every((skill) => skillNames.includes(skill))).toBe(true);
    });
    expect(players.some((player) => player.skills.length === 0)).toBe(true);
    expect(players.some((player) => player.skills.length > 0)).toBe(true);
  });

  test('curates national player skills by identity and real-world strengths', () => {
    expect(getNationalPlayerSkills({ name: 'Jasprit Bumrah' })).toContain('YorkerKing');
    expect(getNationalPlayerSkills({ name: 'Virat Kohli' })).toContain('CoverDriveArtist');
    expect(getNationalPlayerSkills({ name: 'Unknown Player' })).toEqual([]);
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
