export const supportsFreeHit = (ruleset, matchTypeKey) =>
  ruleset !== 'realism' ||
  !['test', 'firstclass', 'practicetestmicro', 'practicetestmini'].includes(String(matchTypeKey || '').toLowerCase());
