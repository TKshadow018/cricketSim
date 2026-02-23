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
  ownPlayingXI: [],
  opponentPlayingXI: [],
  ownCustomPlayers: [],
  opponentCustomPlayers: [],
  ownTeamRoles: {
    captainId: null,
    viceCaptainId: null,
    wicketKeeperId: null,
  },
  opponentTeamRoles: {
    captainId: null,
    viceCaptainId: null,
    wicketKeeperId: null,
  },
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
      state.ownPlayingXI = [];
      state.ownCustomPlayers = [];
      state.ownTeamRoles = {
        captainId: null,
        viceCaptainId: null,
        wicketKeeperId: null,
      };
    },
    setOpponentTeam: (state, action) => {
      state.opponentTeam = action.payload;
      state.opponentPlayingXI = [];
      state.opponentCustomPlayers = [];
      state.opponentTeamRoles = {
        captainId: null,
        viceCaptainId: null,
        wicketKeeperId: null,
      };
    },
    setOwnPlayingXI: (state, action) => {
      state.ownPlayingXI = Array.isArray(action.payload) ? action.payload : [];
    },
    setOpponentPlayingXI: (state, action) => {
      state.opponentPlayingXI = Array.isArray(action.payload) ? action.payload : [];
    },
    setOwnCustomPlayers: (state, action) => {
      state.ownCustomPlayers = Array.isArray(action.payload) ? action.payload : [];
    },
    setOpponentCustomPlayers: (state, action) => {
      state.opponentCustomPlayers = Array.isArray(action.payload) ? action.payload : [];
    },
    setOwnTeamRoles: (state, action) => {
      const payload = action.payload || {};
      state.ownTeamRoles = {
        captainId: payload.captainId ?? null,
        viceCaptainId: payload.viceCaptainId ?? null,
        wicketKeeperId: payload.wicketKeeperId ?? null,
      };
    },
    setOpponentTeamRoles: (state, action) => {
      const payload = action.payload || {};
      state.opponentTeamRoles = {
        captainId: payload.captainId ?? null,
        viceCaptainId: payload.viceCaptainId ?? null,
        wicketKeeperId: payload.wicketKeeperId ?? null,
      };
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
    hydrateGameState: (state, action) => {
      const payload = action.payload || {};
      const hasLegacyNoXI = payload.ownPlayingXI === undefined && payload.opponentPlayingXI === undefined;
      const stageValue = payload.stage;
      const migratedStage =
        hasLegacyNoXI && Number.isInteger(stageValue) && stageValue >= 9 && stageValue <= 11
          ? stageValue + 2
          : stageValue;
      return {
        ...state,
        ...payload,
        stage: migratedStage ?? state.stage,
        ownPlayingXI: Array.isArray(payload.ownPlayingXI) ? payload.ownPlayingXI : state.ownPlayingXI,
        opponentPlayingXI: Array.isArray(payload.opponentPlayingXI)
          ? payload.opponentPlayingXI
          : state.opponentPlayingXI,
        ownCustomPlayers: Array.isArray(payload.ownCustomPlayers)
          ? payload.ownCustomPlayers
          : state.ownCustomPlayers,
        opponentCustomPlayers: Array.isArray(payload.opponentCustomPlayers)
          ? payload.opponentCustomPlayers
          : state.opponentCustomPlayers,
        ownTeamRoles: payload.ownTeamRoles || state.ownTeamRoles,
        opponentTeamRoles: payload.opponentTeamRoles || state.opponentTeamRoles,
        firstInnings: {
          ...buildInitialInnings(),
          ...(payload.firstInnings || state.firstInnings),
        },
        secondInnings: {
          ...buildInitialInnings(),
          ...(payload.secondInnings || state.secondInnings),
        },
      };
    },
    resetMatchRuntime: (state) => {
      state.stage = matchStatusEnum.intro;
      state.tossWinner = '';
      state.tossDecision = 'bat';
      state.tossCall = '';
      state.firstBattingSide = 'own';
      state.ownPlayingXI = [];
      state.opponentPlayingXI = [];
      state.ownCustomPlayers = [];
      state.opponentCustomPlayers = [];
      state.ownTeamRoles = {
        captainId: null,
        viceCaptainId: null,
        wicketKeeperId: null,
      };
      state.opponentTeamRoles = {
        captainId: null,
        viceCaptainId: null,
        wicketKeeperId: null,
      };
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
  setOwnPlayingXI,
  setOpponentPlayingXI,
  setOwnCustomPlayers,
  setOpponentCustomPlayers,
  setOwnTeamRoles,
  setOpponentTeamRoles,
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
  hydrateGameState,
  resetMatchRuntime,
} = gameSlice.actions;

export default gameSlice.reducer;
