import { buildInitialInnings } from '../gameState';

export const hydrateInnings = (saved = {}) => {
  const hasLedger = Array.isArray(saved.deliveryEvents);
  const played = Number(saved.balls || 0) > 0 || Number(saved.wides || 0) > 0 || Number(saved.noBalls || 0) > 0;
  return {
    ...buildInitialInnings(),
    ...saved,
    deliveryEvents: hasLedger ? saved.deliveryEvents : Array.isArray(saved.ballHistory) ? [...saved.ballHistory] : [],
    historyComplete: hasLedger ? saved.historyComplete !== false : !played,
  };
};
