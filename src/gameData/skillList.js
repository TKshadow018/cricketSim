import { skillApplyTimeEnum } from './skillApplyTimeEnum';

const DUMMY_SKILL_ICON = '/asset/img/icon/skill/dummy.svg';

export const skillList = [
  {
    name: 'YorkerKing',
    affects: 'bowling',
    frequency: 4,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 2, '0': 3, '1': 1, '2': -2, '4': -2, '6': -2 },
    },
  },
  {
    name: 'SwingMaster',
    affects: 'bowling',
    frequency: 9,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 1, '0': 4, '1': -3, '4': -1, '6': -1 },
    },
  },
  {
    name: 'SeamSpecialist',
    affects: 'bowling',
    frequency: 10,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 2, '0': 3, '1': -5, '2': -2, '4': 1, '6': 1 },
    },
  },
  {
    name: 'ReverseSwingArtist',
    affects: 'bowling',
    frequency: 4,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 1, '0': 4, '1': -2, '2': -1, '4': -1, '6': -1 },
    },
  },
  {
    name: 'SpinWizard',
    affects: 'bowling',
    frequency: 7,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 2, '0': 2, '1': -1, '2': -1, '4': -1, '6': -1 },
    },
  },
  {
    name: 'DoosraArtist',
    affects: 'bowling',
    frequency: 4,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 3, '0': 1, '1': -1, '2': -1, '4': -1, '6': -1 },
    },
  },
  {
    name: 'GooglyGenius',
    affects: 'bowling',
    frequency: 5,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 3, '0': 1, '1': -1, '2': -1, '4': -1, '6': -1 },
    },
  },
  {
    name: 'FlightMaster',
    affects: 'bowling',
    frequency: 7,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 1, '0': 3, '1': -1, '2': -1, '4': -1, '6': -1 },
    },
  },
  {
    name: 'MagicHand',
    affects: 'bowling',
    frequency: 4,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { W: 2, '0': 2, '1': -1, '2': -1, '4': -1, '6': -1 },
    },
  },
  {
    name: 'SlowMotionVision',
    affects: 'batting',
    frequency: 8,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBatting,
      batting: { '0': -3, '1': 2, '2': 1 },
    },
  },
  {
    name: 'HardHitter',
    affects: 'batting',
    frequency: 14,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBatting,
      batting: { '6': 3, W: 1, '4': 2, '0': -3, '1': -2, '2': -1 },
    },
  },
  {
    name: 'Finisher',
    affects: 'batting',
    frequency: 10,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.last20PercentOfOvers,
      batting: { '4': 2, '6': 2, W: 2, '0': -3, '1': -2, '2': -1 },
    },
  },
  {
    name: 'Anchor',
    affects: 'batting',
    frequency: 12,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBatting,
      batting: { '4': -2, '6': -1, W: -2, '0': 3, '1': 2 },
    },
  },
  {
    name: 'CoverDriveArtist',
    affects: 'batting',
    frequency: 8,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBatting,
      batting: { '2': 1, '0': -2, '1': 1 },
    },
  },
  {
    name: 'SweepSpecialist',
    affects: 'batting',
    frequency: 7,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBatting,
      batting: { '2': 1, '3': -1, '0': -1, '1': 1 },
    },
  },
  {
    name: 'WicketWall',
    affects: 'fielding',
    frequency: 6,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      bowling: { '4': -2, '6': -2, W: -2, '0': 5, '1': 1 },
    },
  },
  {
    name: 'PowerplaySpecialist',
    affects: 'batting',
    frequency: 10,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.powerPlay,
      batting: { '4': 3, '6': 2, W: 1, '0': -4, '1': -2 },
    },
  },
  {
    name: 'ClutchPerformer',
    affects: 'personality',
    frequency: 8,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.always,
      batting: { '0': -1, '4': 1 },
      bowling: { '0': 1, '4': -1 },
    },
  },
  {
    name: 'SafeHands',
    affects: 'fielding',
    frequency: 20,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.whenBowling,
      fullTeamBowling: { '0': 2, '1': 1, '2': -1, '3': -1, '4': -1 },
    },
  },
  {
    name: 'CaptainCalm',
    affects: 'personality',
    frequency: 6,
    icon: DUMMY_SKILL_ICON,
    impact: {
      applyTime: skillApplyTimeEnum.always,
      batting: { '0': 1, W: -1 },
      bowling: { '0': 1, W: -1 },
      fullTeamBatting: { '0': -1, '1': 1 },
      fullTeamBowling: { '0': 1, '1': -1 },
    },
  },
];
