import { addSkillsToPlayers } from '../playerSkills';

const SouthAfricaPlayers = [
  {
    "id": 1,
    "name": "Temba Bavuma",
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
    "name": "Aiden Markram",
    "abilityToPlayPaceBall": 80,
    "abilityToPlaySpinBall": 83,
    "battingAggresion": 73,
    "isWicketKeeper": false,
    "spinAbility": 74,
    "paceAbility": 16,
    "battingOrderPreference": 829,
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
    "name": "Quinton de Kock",
    "abilityToPlayPaceBall": 87,
    "abilityToPlaySpinBall": 83,
    "battingAggresion": 82,
    "isWicketKeeper": true,
    "spinAbility": 4,
    "paceAbility": 4,
    "battingOrderPreference": 984,
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
    "name": "Reeza Hendricks",
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
    "name": "Rassie van der Dussen",
    "abilityToPlayPaceBall": 81,
    "abilityToPlaySpinBall": 80,
    "battingAggresion": 72,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 8,
    "battingOrderPreference": 828,
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
    "name": "David Miller",
    "abilityToPlayPaceBall": 93,
    "abilityToPlaySpinBall": 84,
    "battingAggresion": 93,
    "isWicketKeeper": false,
    "spinAbility": 6,
    "paceAbility": 10,
    "battingOrderPreference": 690,
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
    "name": "Heinrich Klaasen",
    "abilityToPlayPaceBall": 77,
    "abilityToPlaySpinBall": 74,
    "battingAggresion": 76,
    "isWicketKeeper": true,
    "spinAbility": 3,
    "paceAbility": 3,
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
    "id": 8,
    "name": "Tristan Stubbs",
    "abilityToPlayPaceBall": 82,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 86,
    "isWicketKeeper": false,
    "spinAbility": 5,
    "paceAbility": 9,
    "battingOrderPreference": 606,
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
    "name": "Marco Jansen",
    "abilityToPlayPaceBall": 81,
    "abilityToPlaySpinBall": 75,
    "battingAggresion": 74,
    "isWicketKeeper": false,
    "spinAbility": 16,
    "paceAbility": 72,
    "battingOrderPreference": 527,
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
    "name": "Andile Phehlukwayo",
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
    "name": "Kagiso Rabada",
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
    "name": "Anrich Nortje",
    "abilityToPlayPaceBall": 52,
    "abilityToPlaySpinBall": 43,
    "battingAggresion": 38,
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
    "id": 13,
    "name": "Lungi Ngidi",
    "abilityToPlayPaceBall": 56,
    "abilityToPlaySpinBall": 45,
    "battingAggresion": 42,
    "isWicketKeeper": false,
    "spinAbility": 9,
    "paceAbility": 86,
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
    "id": 14,
    "name": "Gerald Coetzee",
    "abilityToPlayPaceBall": 54,
    "abilityToPlaySpinBall": 44,
    "battingAggresion": 40,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 85,
    "battingOrderPreference": 271,
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
    "name": "Keshav Maharaj",
    "abilityToPlayPaceBall": 52,
    "abilityToPlaySpinBall": 59,
    "battingAggresion": 40,
    "isWicketKeeper": false,
    "spinAbility": 94,
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
    "id": 16,
    "name": "Tabraiz Shamsi",
    "abilityToPlayPaceBall": 50,
    "abilityToPlaySpinBall": 58,
    "battingAggresion": 38,
    "isWicketKeeper": false,
    "spinAbility": 85,
    "paceAbility": 8,
    "battingOrderPreference": 349,
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
    "name": "Bjorn Fortuin",
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
    "id": 18,
    "name": "Wiaan Mulder",
    "abilityToPlayPaceBall": 74,
    "abilityToPlaySpinBall": 69,
    "battingAggresion": 72,
    "isWicketKeeper": false,
    "spinAbility": 13,
    "paceAbility": 69,
    "battingOrderPreference": 597,
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
    "name": "Ryan Rickelton",
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
      "isBatting": 0,
      "b_run": 0,
      "b_ball": 0,
      "b_wkt": 0
    }
  },
  {
    "id": 20,
    "name": "Nandre Burger",
    "abilityToPlayPaceBall": 54,
    "abilityToPlaySpinBall": 44,
    "battingAggresion": 40,
    "isWicketKeeper": false,
    "spinAbility": 8,
    "paceAbility": 85,
    "battingOrderPreference": 271,
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

export default addSkillsToPlayers(SouthAfricaPlayers);
