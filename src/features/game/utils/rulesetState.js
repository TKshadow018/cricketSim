export const resolveRuleset = (value) => {
  if (value === undefined || value === null) return 'arcade';
  if (value === 'arcade' || value === 'realism') return value;
  throw new RangeError(`Unknown match ruleset: ${value}`);
};

export const setRulesetReducer = (state, action) => {
  state.ruleset = resolveRuleset(action.payload);
};
