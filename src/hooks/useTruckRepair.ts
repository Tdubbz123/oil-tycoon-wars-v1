import { useState } from 'react';
import { loadGameState, saveGameState } from '../pages/lib/gameSave';
import { Well } from '../hooks/mapGenerator';
import { TruckData } from '../Data/trucks';

export type TruckStatus = 'idle' | 'toWell' | 'repairing' | 'returning';

interface UseTruckRepairReturn {
  status: TruckStatus;
  dispatchTruckToRepair: (well: Well, onComplete?: (coins: number, xp: number) => void) => void;
  repairingWell: Well | null;
}

/**
 * Handles truck repair logic with XP/coin rewards, speed scaling, and dynamic upgrades.
 */
export function useTruckRepair(): UseTruckRepairReturn {
  const [status, setStatus] = useState<TruckStatus>('idle');
  const [repairingWell, setRepairingWell] = useState<Well | null>(null);

  const dispatchTruckToRepair = (well: Well, onComplete?: (coins: number, xp: number) => void) => {
    if (!well || status !== 'idle') return;

    const state = loadGameState();
    const truck = state.truckFleet[0];
    const upgradeLevel = state.truckUpgrades[truck.name] || 0;
    const truckStats = TruckData.find(t => t.name === truck.name);
    if (!truckStats) return;

    // Scaling Factors
    const repairMultiplier = 1 + upgradeLevel * truckStats.stats.repairBoost;
    const baseReward = truckStats.stats.baseReward;
    const baseXP = truckStats.stats.baseXp;
    const baseSpeed = truckStats.stats.speed;
    const speedMultiplier = 1 + upgradeLevel * 0.05;
    const adjustedSpeed = baseSpeed * speedMultiplier;

    // Normalized travel time (baseSpeed 100 = 2s)
    const travelTime = Math.floor(2000 * (100 / adjustedSpeed));
    const returnTime = Math.floor(3000 * (100 / adjustedSpeed));
    const repairTime = 4000; // flat time for now

    setStatus('toWell');
    setRepairingWell(well);

    setTimeout(() => {
      setStatus('repairing');
      setTimeout(() => {
        setStatus('returning');
        setTimeout(() => {
          setStatus('idle');
          setRepairingWell(null);

          truck.kmDriven += 20;
          truck.wellsRepaired++;

          const xpEarned = Math.floor(baseXP * repairMultiplier);
          const coinsEarned = Math.floor(baseReward * repairMultiplier);

          state.xp += xpEarned;
          state.coins += coinsEarned;
          well.isBroken = false;

          if (state.xp >= state.playerLevel * 100) {
            state.playerLevel++;
          }

          saveGameState(state);
          if (onComplete) onComplete(coinsEarned, xpEarned);
        }, returnTime);
      }, repairTime);
    }, travelTime);
  };

  return {
    status,
    repairingWell,
    dispatchTruckToRepair,
  };
}
