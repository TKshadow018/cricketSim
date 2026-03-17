import { buildControllerApi } from './buildControllerApi';

export const buildMainControllerApi = ({
  runtime,
  core,
  navigation,
  mutations,
  shared,
}) => {
  const {
    matchPrimaryAction,
    setBattingIntent,
    setBowlingIntent,
    autoPickOwnXI,
    autoPickOpponentXI,
    startMatchWithSelectedXI,
    resetMatch,
    ...restRuntime
  } = runtime;

  return buildControllerApi({
    ...restRuntime,
    ...core,
    ...navigation,
    ...shared,
    handleMatchPrimaryAction: matchPrimaryAction,
    handleSetBattingIntent: setBattingIntent,
    handleSetBowlingIntent: setBowlingIntent,
    handleAutoPickOwnXI: autoPickOwnXI,
    handleAutoPickOpponentXI: autoPickOpponentXI,
    handleStartMatchWithSelectedXI: startMatchWithSelectedXI,
    handlePlayFreshMatch: resetMatch,
    setMatchTypeKey: mutations.setMatchTypeKey,
    setOwnTeam: mutations.setOwnTeam,
    setOpponentTeam: mutations.setOpponentTeam,
    setLocationCountry: mutations.setLocationCountry,
    setCommentator: mutations.setCommentator,
  });
};
