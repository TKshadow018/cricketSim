import { addSkillsToPlayers } from '../playerSkills';

const EnglandPlayers = [
  {
    "id": 1,
    "name": "Jos Buttler",
    "abilityToPlayPaceBall": 85,
    "abilityToPlaySpinBall": 82,
    "battingAggresion": 80,
    "isWicketKeeper": true,
    "spinAbility": 3,
    "paceAbility": 3,
    "battingOrderPreference": 982,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 1,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 2,
    "name": "Jonny Bairstow",
    "abilityToPlayPaceBall": 78,
    "abilityToPlaySpinBall": 74,
    "battingAggresion": 77,
    "isWicketKeeper": true,
    "spinAbility": 3,
    "paceAbility": 3,
    "battingOrderPreference": 976,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 1,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 3,
    "name": "Phil Salt",
    "abilityToPlayPaceBall": 80,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 79,
    "isWicketKeeper": true,
    "spinAbility": 4,
    "paceAbility": 4,
    "battingOrderPreference": 978,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 4,
    "name": "Ben Duckett",
    "abilityToPlayPaceBall": 82,
    "abilityToPlaySpinBall": 80,
    "battingAggresion": 73,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 8,
    "battingOrderPreference": 979,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 5,
    "name": "Joe Root",
    "abilityToPlayPaceBall": 90,
    "abilityToPlaySpinBall": 88,
    "battingAggresion": 77,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 8,
    "battingOrderPreference": 835,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 6,
    "name": "Harry Brook",
    "abilityToPlayPaceBall": 94,
    "abilityToPlaySpinBall": 85,
    "battingAggresion": 94,
    "isWicketKeeper": false,
    "spinAbility": 7,
    "paceAbility": 11,
    "battingOrderPreference": 766,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 7,
    "name": "Ben Stokes",
    "abilityToPlayPaceBall": 81,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 74,
    "isWicketKeeper": false,
    "spinAbility": 16,
    "paceAbility": 72,
    "battingOrderPreference": 677,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 8,
    "name": "Liam Livingstone",
    "abilityToPlayPaceBall": 76,
    "abilityToPlaySpinBall": 79,
    "battingAggresion": 74,
    "isWicketKeeper": false,
    "spinAbility": 73,
    "paceAbility": 15,
    "battingOrderPreference": 676,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 9,
    "name": "Moeen Ali",
    "abilityToPlayPaceBall": 72,
    "abilityToPlaySpinBall": 77,
    "battingAggresion": 70,
    "isWicketKeeper": false,
    "spinAbility": 71,
    "paceAbility": 13,
    "battingOrderPreference": 598,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 10,
    "name": "Sam Curran",
    "abilityToPlayPaceBall": 74,
    "abilityToPlaySpinBall": 69,
    "battingAggresion": 72,
    "isWicketKeeper": false,
    "spinAbility": 13,
    "paceAbility": 69,
    "battingOrderPreference": 522,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 11,
    "name": "Chris Woakes",
    "abilityToPlayPaceBall": 74,
    "abilityToPlaySpinBall": 69,
    "battingAggresion": 72,
    "isWicketKeeper": false,
    "spinAbility": 13,
    "paceAbility": 69,
    "battingOrderPreference": 447,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 12,
    "name": "Jofra Archer",
    "abilityToPlayPaceBall": 54,
    "abilityToPlaySpinBall": 44,
    "battingAggresion": 40,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 93,
    "battingOrderPreference": 346,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 13,
    "name": "Mark Wood",
    "abilityToPlayPaceBall": 53,
    "abilityToPlaySpinBall": 43,
    "battingAggresion": 39,
    "isWicketKeeper": false,
    "spinAbility": 7,
    "paceAbility": 92,
    "battingOrderPreference": 270,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 14,
    "name": "Reece Topley",
    "abilityToPlayPaceBall": 55,
    "abilityToPlaySpinBall": 44,
    "battingAggresion": 41,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 85,
    "battingOrderPreference": 272,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 15,
    "name": "Adil Rashid",
    "abilityToPlayPaceBall": 51,
    "abilityToPlaySpinBall": 58,
    "battingAggresion": 39,
    "isWicketKeeper": false,
    "spinAbility": 93,
    "paceAbility": 8,
    "battingOrderPreference": 350,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 16,
    "name": "Gus Atkinson",
    "abilityToPlayPaceBall": 56,
    "abilityToPlaySpinBall": 45,
    "battingAggresion": 42,
    "isWicketKeeper": false,
    "spinAbility": 9,
    "paceAbility": 86,
    "battingOrderPreference": 423,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 17,
    "name": "Brydon Carse",
    "abilityToPlayPaceBall": 55,
    "abilityToPlaySpinBall": 44,
    "battingAggresion": 41,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 85,
    "battingOrderPreference": 422,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 18,
    "name": "Will Jacks",
    "abilityToPlayPaceBall": 74,
    "abilityToPlaySpinBall": 78,
    "battingAggresion": 72,
    "isWicketKeeper": false,
    "spinAbility": 72,
    "paceAbility": 14,
    "battingOrderPreference": 750,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 19,
    "name": "Jamie Overton",
    "abilityToPlayPaceBall": 76,
    "abilityToPlaySpinBall": 70,
    "battingAggresion": 74,
    "isWicketKeeper": false,
    "spinAbility": 14,
    "paceAbility": 70,
    "battingOrderPreference": 448,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 20,
    "name": "Tom Hartley",
    "abilityToPlayPaceBall": 48,
    "abilityToPlaySpinBall": 57,
    "battingAggresion": 36,
    "isWicketKeeper": false,
    "spinAbility": 84,
    "paceAbility": 7,
    "battingOrderPreference": 348,
    "currentMatch": {
      "run": 0,
      "ball": 0,
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  }
];

export default addSkillsToPlayers(EnglandPlayers);
