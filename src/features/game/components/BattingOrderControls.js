import React from 'react';

const isCompleteBattingOrder = (battingOrderIds, selectedPlayers) => {
  const players = Array.isArray(selectedPlayers) ? selectedPlayers : [];
  const selectedIds = new Set(players.map((player) => player.id));
  return (
    players.length === 11 &&
    selectedIds.size === 11 &&
    Array.isArray(battingOrderIds) &&
    battingOrderIds.length === 11 &&
    new Set(battingOrderIds).size === 11 &&
    battingOrderIds.every((id) => selectedIds.has(id))
  );
};

function BattingOrderControls({
  children,
  player,
  battingOrderIds,
  selectedPlayers,
  onMove,
}) {
  if (!isCompleteBattingOrder(battingOrderIds, selectedPlayers)) {
    return children;
  }

  const position = battingOrderIds.indexOf(player.id) + 1;
  const positionCount = battingOrderIds.length;

  return (
    <div className="sim-player-order-row">
      {children}
      <div className="sim-batting-order-controls" aria-label={`${player.name} batting order controls`}>
        <span className="sim-batting-order-position">
          Position {position} of {positionCount}
        </span>
        <button
          type="button"
          aria-label={`Move ${player.name} up`}
          onClick={() => onMove(-1)}
          disabled={position <= 1}
        >
          Up
        </button>
        <button
          type="button"
          aria-label={`Move ${player.name} down`}
          onClick={() => onMove(1)}
          disabled={position >= positionCount}
        >
          Down
        </button>
      </div>
    </div>
  );
}

export default BattingOrderControls;
