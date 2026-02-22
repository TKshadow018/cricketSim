const weather = {
  sunny: 0,
  rainy: 1,
  cloudy: 2,
  windy: 3,
  stormy: 4,
};
const pitchType = {
  grassy: {
    goodForBatting: 4,
    goodForPaceBowling: 9,
    goodForSpinBowling: 2,
  },
  dusty: {
    goodForBatting: 3,
    goodForPaceBowling: 2,
    goodForSpinBowling: 9,
  },
  dead: {
    goodForBatting: 9,
    goodForPaceBowling: 2,
    goodForSpinBowling: 2,
  },
  sporting: {
    goodForBatting: 7,
    goodForPaceBowling: 7,
    goodForSpinBowling: 6,
  },
  dry: {
    goodForBatting: 6,
    goodForPaceBowling: 4,
    goodForSpinBowling: 7,
  },
};
const outfieldType = {
  lushGreen: {
    boundaryScoring: 3,
    fieldingSafety: 9,
    ballPreservation: 9
  },
  fastAndHard: {
    boundaryScoring: 9,
    fieldingSafety: 5,
    ballPreservation: 4
  },
  wetWithDew: {
    boundaryScoring: 7,
    fieldingSafety: 3,
    ballPreservation: 1
  },
  dryAndPatchy: {
    boundaryScoring: 6,
    fieldingSafety: 2,
    ballPreservation: 2
  }
};
export { pitchType, weather, outfieldType };
