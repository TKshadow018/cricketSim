import { addSkillsToPlayers } from '../playerSkills';

const ZimbabwePlayers = [
  {
    "id": 1,
    "name": "Craig Ervine",
    "abilityToPlayPaceBall": 79,
    "abilityToPlaySpinBall": 79,
    "battingAggresion": 70,
    "isWicketKeeper": false,
    "spinAbility": 7,
    "paceAbility": 7,
    "battingOrderPreference": 826,
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
    "name": "Joylord Gumbie",
    "abilityToPlayPaceBall": 79,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 78,
    "isWicketKeeper": true,
    "spinAbility": 4,
    "paceAbility": 4,
    "battingOrderPreference": 977,
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
    "name": "Tadiwanashe Marumani",
    "abilityToPlayPaceBall": 79,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 78,
    "isWicketKeeper": true,
    "spinAbility": 4,
    "paceAbility": 4,
    "battingOrderPreference": 977,
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
    "name": "Wesley Madhevere",
    "abilityToPlayPaceBall": 75,
    "abilityToPlaySpinBall": 78,
    "battingAggresion": 73,
    "isWicketKeeper": false,
    "spinAbility": 72,
    "paceAbility": 14,
    "battingOrderPreference": 825,
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
    "name": "Sikandar Raza",
    "abilityToPlayPaceBall": 88,
    "abilityToPlaySpinBall": 91,
    "battingAggresion": 77,
    "isWicketKeeper": false,
    "spinAbility": 82,
    "paceAbility": 16,
    "battingOrderPreference": 761,
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
    "name": "Sean Williams",
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
    "id": 7,
    "name": "Ryan Burl",
    "abilityToPlayPaceBall": 74,
    "abilityToPlaySpinBall": 78,
    "battingAggresion": 72,
    "isWicketKeeper": false,
    "spinAbility": 72,
    "paceAbility": 14,
    "battingOrderPreference": 675,
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
    "name": "Clive Madande",
    "abilityToPlayPaceBall": 80,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 79,
    "isWicketKeeper": true,
    "spinAbility": 4,
    "paceAbility": 4,
    "battingOrderPreference": 678,
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
    "name": "Innocent Kaia",
    "abilityToPlayPaceBall": 80,
    "abilityToPlaySpinBall": 79,
    "battingAggresion": 71,
    "isWicketKeeper": false,
    "spinAbility": 7,
    "paceAbility": 7,
    "battingOrderPreference": 977,
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
    "name": "Brian Bennett",
    "abilityToPlayPaceBall": 78,
    "abilityToPlaySpinBall": 71,
    "battingAggresion": 76,
    "isWicketKeeper": false,
    "spinAbility": 15,
    "paceAbility": 71,
    "battingOrderPreference": 825,
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
    "name": "Blessing Muzarabani",
    "abilityToPlayPaceBall": 56,
    "abilityToPlaySpinBall": 45,
    "battingAggresion": 42,
    "isWicketKeeper": false,
    "spinAbility": 9,
    "paceAbility": 94,
    "battingOrderPreference": 348,
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
    "name": "Richard Ngarava",
    "abilityToPlayPaceBall": 54,
    "abilityToPlaySpinBall": 44,
    "battingAggresion": 40,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 85,
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
    "name": "Luke Jongwe",
    "abilityToPlayPaceBall": 75,
    "abilityToPlaySpinBall": 69,
    "battingAggresion": 73,
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
    "id": 14,
    "name": "Tendai Chatara",
    "abilityToPlayPaceBall": 53,
    "abilityToPlaySpinBall": 43,
    "battingAggresion": 39,
    "isWicketKeeper": false,
    "spinAbility": 7,
    "paceAbility": 84,
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
    "id": 15,
    "name": "Victor Nyauchi",
    "abilityToPlayPaceBall": 56,
    "abilityToPlaySpinBall": 45,
    "battingAggresion": 42,
    "isWicketKeeper": false,
    "spinAbility": 9,
    "paceAbility": 86,
    "battingOrderPreference": 273,
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
    "name": "Brandon Mavuta",
    "abilityToPlayPaceBall": 50,
    "abilityToPlaySpinBall": 58,
    "battingAggresion": 38,
    "isWicketKeeper": false,
    "spinAbility": 85,
    "paceAbility": 8,
    "battingOrderPreference": 424,
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
    "name": "Ainsley Ndlovu",
    "abilityToPlayPaceBall": 52,
    "abilityToPlaySpinBall": 59,
    "battingAggresion": 40,
    "isWicketKeeper": false,
    "spinAbility": 86,
    "paceAbility": 9,
    "battingOrderPreference": 426,
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
    "name": "Faraz Akram",
    "abilityToPlayPaceBall": 78,
    "abilityToPlaySpinBall": 71,
    "battingAggresion": 76,
    "isWicketKeeper": false,
    "spinAbility": 15,
    "paceAbility": 71,
    "battingOrderPreference": 450,
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
    "name": "Wellington Masakadza",
    "abilityToPlayPaceBall": 72,
    "abilityToPlaySpinBall": 77,
    "battingAggresion": 70,
    "isWicketKeeper": false,
    "spinAbility": 71,
    "paceAbility": 13,
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
    "name": "Takudzwanashe Kaitano",
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
  }
];

export default addSkillsToPlayers(ZimbabwePlayers);
