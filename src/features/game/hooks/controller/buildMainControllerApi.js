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
    setBattingTactics,
    setBowlingIntent,
    setBowlingTactics,
    autoPickOwnXI,
    autoPickOpponentXI,
    autoPositionOwnXI,
    autoPositionOpponentXI,
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
    handleSetBattingTactics: setBattingTactics,
    handleSetBowlingIntent: setBowlingIntent,
    handleSetBowlingTactics: setBowlingTactics,
    handleAutoPickOwnXI: autoPickOwnXI,
    handleAutoPickOpponentXI: autoPickOpponentXI,
    handleAutoPositionOwnXI: autoPositionOwnXI,
    handleAutoPositionOpponentXI: autoPositionOpponentXI,
    handleStartMatchWithSelectedXI: startMatchWithSelectedXI,
    handlePlayFreshMatch: resetMatch,
    setMatchTypeKey: mutations.setMatchTypeKey,
    setOwnTeam: mutations.setOwnTeam,
    setOpponentTeam: mutations.setOpponentTeam,
    setLocationCountry: mutations.setLocationCountry,
    setCommentator: mutations.setCommentator,
  });
};
