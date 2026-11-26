export const gameCareerReducers = {
  setCareerTeam: (state, action) => {
    state.careerTeam = action.payload || '';
  },
  setCareerPlayerProfile: (state, action) => {
    state.careerPlayerProfile = action.payload && typeof action.payload === 'object' ? action.payload : null;
  },
  setCareerDomesticCountry: (state, action) => {
    state.careerDomesticCountry = action.payload || '';
  },
  setCareerDomesticTeams: (state, action) => {
    state.careerDomesticTeams = Array.isArray(action.payload) ? action.payload : [];
  },
  setCareerGlobalPlayerPool: (state, action) => {
    state.careerGlobalPlayerPool = Array.isArray(action.payload) ? action.payload : [];
  },
  setCareerAuctionSummary: (state, action) => {
    state.careerAuctionSummary = action.payload && typeof action.payload === 'object' ? action.payload : null;
  },
  setCareerOffers: (state, action) => {
    state.careerOffers = Array.isArray(action.payload) ? action.payload : [];
  },
  setCareerRetired: (state, action) => {
    state.careerRetired = !!action.payload;
  },
  setCareerSeason: (state, action) => {
    state.careerSeason = Number(action.payload) || 0;
  },
  setCareerSeasonLength: (state, action) => {
    state.careerSeasonLength = action.payload || 'standard';
  },
  setCareerFormat: (state, action) => {
    state.careerFormat = action.payload || 't20';
  },
  setCareerMatchIndex: (state, action) => {
    state.careerMatchIndex = Number(action.payload) || 0;
  },
  setCareerSchedule: (state, action) => {
    state.careerSchedule = Array.isArray(action.payload) ? action.payload : [];
  },
  setCareerStandings: (state, action) => {
    state.careerStandings = action.payload && typeof action.payload === 'object' ? action.payload : {};
  },
  setCareerPlayerStats: (state, action) => {
    state.careerPlayerStats = action.payload && typeof action.payload === 'object' ? action.payload : {};
  },
  setCareerSeasonHistory: (state, action) => {
    state.careerSeasonHistory = Array.isArray(action.payload) ? action.payload : [];
  },
};
