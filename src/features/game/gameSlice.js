import { createSlice } from '@reduxjs/toolkit';
import { outfieldType, pitchType, weather } from '../../gameData/matchCondition';
import { battingAction, bowlingAction } from '../../gameData/actionType';
import { matchStatusEnum } from '../../gameData/matchStatusEnum';

const randomKey = (obj) => Object.keys(obj)[Math.floor(Math.random() * Object.keys(obj).length)];

export const buildInitialInnings = () => ({
  score: 0,
  wickets: 0,
  balls: 0,
  wides: 0,
  noBalls: 0,
  commentary: [],
  strikerIndex: null,
  nonStrikerIndex: null,
  nextBatterIndex: 0,
  battingOrderIndices: [],
  needsOpeners: false,
  openerSelections: [],
  outBatterIndices: [],
  waitingForNextBatter: false,
  currentBowlerIndex: null,
  lastOverBowlerIndex: null,
  completedOverBowlerIndices: [],
  waitingForNextBowler: false,
  battingStats: [],
  bowlingStats: [],
  freeHitArmed: false,
  superShotUsedInOver: 0,
  superShotUsedMatch: 0,
  superShotBonus: 0,
  specialBallUsedInOver: 0,
  specialBallUsedMatch: 0,
  specialBallBonus: 0,
  lastEvent: 'Ready for first delivery.',
});

export const buildRandomMatchCondition = () => ({
  weather: randomKey(weather),
  pitch: randomKey(pitchType),
  outfield: randomKey(outfieldType),
});

const initialState = {
  stage: matchStatusEnum.intro,
  matchTypeKey: 't20',
  ownTeam: 'India',
  opponentTeam: 'Australia',
  locationCountry: 'India',
  selectedStadium: '',
  commentator: '',
  tossWinner: '',
  tossDecision: 'bat',
  tossCall: '',
  firstBattingSide: 'own',
  matchCondition: buildRandomMatchCondition(),
  battingIntent: battingAction.normal,
  bowlingIntent: bowlingAction.normal,
  firstInnings: buildInitialInnings(),
  secondInnings: buildInitialInnings(),
  showScoreboard: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setStage: (state, action) => {
      state.stage = action.payload;
    },
    setMatchTypeKey: (state, action) => {
      state.matchTypeKey = action.payload;
    },
    setOwnTeam: (state, action) => {
      state.ownTeam = action.payload;
    },
    setOpponentTeam: (state, action) => {
      state.opponentTeam = action.payload;
    },
    setLocationCountry: (state, action) => {
      state.locationCountry = action.payload;
    },
    setSelectedStadium: (state, action) => {
      state.selectedStadium = action.payload;
    },
    setCommentator: (state, action) => {
      state.commentator = action.payload;
    },
    setTossWinner: (state, action) => {
      state.tossWinner = action.payload;
    },
    setTossDecision: (state, action) => {
      state.tossDecision = action.payload;
    },
    setTossCall: (state, action) => {
      state.tossCall = action.payload;
    },
    setFirstBattingSide: (state, action) => {
      state.firstBattingSide = action.payload;
    },
    setMatchCondition: (state, action) => {
      state.matchCondition = action.payload;
    },
    setBattingIntent: (state, action) => {
      state.battingIntent = action.payload;
    },
    setBowlingIntent: (state, action) => {
      state.bowlingIntent = action.payload;
    },
    setFirstInnings: (state, action) => {
      state.firstInnings = action.payload;
    },
    setSecondInnings: (state, action) => {
      state.secondInnings = action.payload;
    },
    setShowScoreboard: (state, action) => {
      state.showScoreboard = action.payload;
    },
    toggleShowScoreboard: (state) => {
      state.showScoreboard = !state.showScoreboard;
    },
    resetMatchRuntime: (state) => {
      state.stage = matchStatusEnum.intro;
      state.tossWinner = '';
      state.tossDecision = 'bat';
      state.tossCall = '';
      state.firstBattingSide = 'own';
      state.matchCondition = buildRandomMatchCondition();
      state.battingIntent = battingAction.normal;
      state.bowlingIntent = bowlingAction.normal;
      state.firstInnings = buildInitialInnings();
      state.secondInnings = buildInitialInnings();
      state.showScoreboard = false;
    },
  },
});

export const {
  setStage,
  setMatchTypeKey,
  setOwnTeam,
  setOpponentTeam,
  setLocationCountry,
  setSelectedStadium,
  setCommentator,
  setTossWinner,
  setTossDecision,
  setTossCall,
  setFirstBattingSide,
  setMatchCondition,
  setBattingIntent,
  setBowlingIntent,
  setFirstInnings,
  setSecondInnings,
  setShowScoreboard,
  toggleShowScoreboard,
  resetMatchRuntime,
} = gameSlice.actions;

export default gameSlice.reducer;
