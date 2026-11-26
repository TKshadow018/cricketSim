export const resolveRuleset = (value) => {
  if (value === undefined || value === null || value === 'arcade' || value === 'realism') {
    return 'realism';
  }
  throw new RangeError(`Unknown match ruleset: ${value}`);
};

export const setRulesetReducer = (state, action) => {
  state.ruleset = resolveRuleset(action.payload);
};
