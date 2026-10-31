import { skillList } from './skillList';

const BATTING_ROLES = new Set([
  'batsman',
  'batter',
  'wicketkeeper',
  'pace allrounder',
  'spin allrounder',
]);

const BOWLING_ROLES = new Set([
  'pacer',
  'spiner',
  'spinner',
  'bowler',
  'bowler pacer',
  'bowler spinner',
  'pace allrounder',
  'spin allrounder',
]);

export const assignCareerSkills = (player = {}, maximumSkills = 2) => {
  const maxSkills = Math.min(2, Math.max(0, Math.floor(Number(maximumSkills) || 0)));
  if (!maxSkills) {
    return [];
  }

  const role = String(player.playerType || '').trim().toLowerCase();
  const eligibleSkills = skillList.filter(({ affects }) => {
    if (affects === 'batting') {
      return BATTING_ROLES.has(role);
    }
    if (affects === 'bowling') {
      return BOWLING_ROLES.has(role);
    }
    return true;
  });
  const rolledSkills = eligibleSkills.filter(
    ({ frequency }) => Math.random() * 100 < frequency
  );

  for (let index = rolledSkills.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [rolledSkills[index], rolledSkills[swapIndex]] = [
      rolledSkills[swapIndex],
      rolledSkills[index],
    ];
  }

  return rolledSkills.slice(0, maxSkills).map(({ name }) => name);
};

export const limitPlayerSkills = (player = {}, maximumSkills = 3) => {
  const maxSkills = Math.max(0, Math.floor(Number(maximumSkills) || 0));
  const knownSkills = new Set(skillList.map(({ name }) => name));
  return Array.isArray(player.skills)
    ? player.skills.filter((name) => knownSkills.has(name)).slice(0, maxSkills)
    : [];
};
