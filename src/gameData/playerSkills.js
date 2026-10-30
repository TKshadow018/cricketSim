import { skillList } from './skillList';

const metric = (value) => Number(value) || 0;

export const assignPlayerSkills = (player = {}, maximumSkills = 3) => {
  const maxSkills = Math.min(3, Math.max(0, Math.floor(Number(maximumSkills) || 0)));
  if (!maxSkills) {
    return [];
  }

  const pace = metric(player.paceAbility);
  const spin = metric(player.spinAbility);
  const battingPace = metric(player.abilityToPlayPaceBall);
  const battingSpin = metric(player.abilityToPlaySpinBall);
  const battingAverage = (battingPace + battingSpin) / 2;
  const aggression = metric(player.battingAggresion);
  const battingOrderPreference = metric(player.battingOrderPreference);

  const candidates = [
    ['YorkerKing', pace >= 88 ? pace : 0],
    ['SwingMaster', pace >= 80 ? pace : 0],
    ['SeamSpecialist', pace >= 72 ? pace : 0],
    ['ReverseSwingArtist', pace >= 85 ? pace : 0],
    ['BouncerSpecialist', pace >= 82 ? pace : 0],
    ['SpinWizard', spin >= 88 ? spin : 0],
    ['DoosraArtist', spin >= 82 ? spin : 0],
    ['GooglyGenius', spin >= 78 ? spin : 0],
    ['FlightMaster', spin >= 72 ? spin : 0],
    ['MagicHand', spin >= 90 ? spin : 0],
    ['SlowMotionVision', battingSpin >= 78 ? battingSpin : 0],
    ['HardHitter', aggression >= 84 ? aggression : 0],
    ['Finisher', aggression >= 72 && battingAverage >= 68 ? aggression : 0],
    ['Anchor', battingAverage >= 78 && aggression <= 70 ? battingAverage : 0],
    ['CoverDriveArtist', battingPace >= 82 ? battingPace : 0],
    ['SweepSpecialist', battingSpin >= 78 ? battingSpin : 0],
    ['WicketWall', player.isWicketKeeper && battingAverage >= 65 ? battingAverage : 0],
    ['PowerplaySpecialist', aggression >= 78 && battingOrderPreference >= 700 ? aggression : 0],
    ['ClutchPerformer', battingAverage >= 85 && aggression >= 70 ? battingAverage : 0],
    ['AllRoundAce', battingAverage >= 65 && pace >= 50 && spin >= 50 ? battingAverage : 0],
  ];

  return candidates
    .filter(([, score]) => score > 0)
    .sort(
      (left, right) =>
        right[1] - left[1] || skillList.indexOf(left[0]) - skillList.indexOf(right[0])
    )
    .slice(0, maxSkills)
    .map(([skill]) => skill);
};

export const addSkillsToPlayers = (players = [], maximumSkills = 3) =>
  players.map((player) => ({
    ...player,
    skills: assignPlayerSkills(player, maximumSkills),
  }));
