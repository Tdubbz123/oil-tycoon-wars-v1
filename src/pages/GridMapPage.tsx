import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGameState, saveGameState } from '../pages/lib/gameSave';
import { useTruckRepair } from '../hooks/useTruckRepair';
import { useMapGenerator } from '../hooks/mapGenerator';
import { Well, GridTile } from '../hooks/mapGenerator';
import { TruckData } from '../Data/trucks'

const GridMapPage = () => {
  const [mapGrid, setMapGrid] = useState<GridTile[][]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [hud, setHud] = useState(() => {
    const state = loadGameState();
    return {
      coins: state.coins || 0,
      xp: state.xp || 0,
      level: state.playerLevel || 1,
      brokenCount: 0,
    };
  });

  const [truckPhase, setTruckPhase] = useState<'idle' | 'drivingTo' | 'repairing' | 'returning'>('idle');
  const [truckPos, setTruckPos] = useState({ x: 0, y: 0 });
  const { status, dispatchTruckToRepair } = useTruckRepair();
  const navigate = useNavigate();

  const generate = useMapGenerator();

  const handleGenerateMap = () => {
  const newGrid = generate; // ✅ call the function, not the hook

    setMapGrid(newGrid);
    setMapReady(true);
    const brokenCount = newGrid.flat().reduce(
      (acc, tile) => acc + tile.wells.filter(w => w.isBroken).length,
      0
    );
    setHud(prev => ({ ...prev, brokenCount }));
  };

  const handleRepair = (well: Well, tileX: number, tileY: number) => {
    if (!well.isBroken || status !== 'idle' || truckPhase !== 'idle') return;

    const garageTile = mapGrid.flat().find(t => t.isGarage);
    if (!garageTile) return;

    const dist = Math.abs(tileX - garageTile.x) + Math.abs(tileY - garageTile.y);
    const state = loadGameState();
    const truck = state.truckFleet[0];
    const upgradeLevel = state.truckUpgrades?.[truck.name] || 0;
    const truckStats = TruckData.find(t => t.name === truck.name);
    if (!truckStats) return;
    const { speed } = truckStats.stats; 
    const speedMultiplier = 1 + upgradeLevel * 0.05;
    const adjustedSpeed = speed * speedMultiplier;
    const travelTime = Math.floor(2000 * (dist / adjustedSpeed));
    const repairTime = 4000;

    setTruckPhase('drivingTo');
    setTruckPos({ x: garageTile.x, y: garageTile.y });

    setTimeout(() => {
      setTruckPhase('repairing');
      setTruckPos({ x: tileX, y: tileY });

      setTimeout(() => {
        setTruckPhase('returning');
        setTruckPos({ x: tileX, y: tileY });

        setTimeout(() => {
          well.isBroken = false;
          setMapGrid([...mapGrid]);

          const baseCoins = truckStats.stats.baseReward;
          const baseXp = truckStats.stats.baseXp;

          const coinMultiplier = 1 + (upgradeLevel * 0.05); // +5% per upgrade level
          const xpMultiplier = 1 + (upgradeLevel * 0.05);

          const coinsEarned = Math.floor(baseCoins * coinMultiplier);
          const xpEarned = Math.floor(baseXp * xpMultiplier);

          dispatchTruckToRepair(well, () => {
            const updatedState = loadGameState();
            setHud(prev => ({
              coins: prev.coins + coinsEarned,
              xp: prev.xp + xpEarned,
              level: updatedState.playerLevel,
              brokenCount: mapGrid.flat().reduce(
                (acc, tile) => acc + tile.wells.filter(w => w.isBroken).length,
                0
              ),
            }));
            saveGameState(updatedState);
          });

          setMapGrid([...mapGrid]);
          setTruckPhase('idle');
        }, travelTime);
      }, repairTime);
    }, travelTime);
  };

  useEffect(() => {
    const brokenCount = mapGrid.flat().reduce(
      (acc, tile) => acc + tile.wells.filter(w => w.isBroken).length,
      0
    );
    setHud(prev => ({ ...prev, brokenCount }));
  }, [mapGrid]);

  useEffect(() => {
    if (!mapReady) return;

    const interval = setInterval(() => {
      const flat = mapGrid.flat();
      const options = flat.filter(t => t.wells.length > 0);
      const tile = options[Math.floor(Math.random() * options.length)];
      if (!tile) return;
      const goodWells = tile.wells.filter(w => !w.isBroken);
      if (goodWells.length === 0) return;
      const w = goodWells[Math.floor(Math.random() * goodWells.length)];
      w.isBroken = true;
      setMapGrid([...mapGrid]);
    }, 60000 + Math.random() * 60000);

    return () => clearInterval(interval);
  }, [mapGrid, mapReady]);

   return (
    <div className="p-4">
      {!mapReady && (
        <div className="text-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleGenerateMap}
          >
            Generate Map
          </button>
        </div>
      )}

      {mapReady && (
        <div>
          <div className="flex justify-between items-center bg-gray-900 text-white p-2 text-sm">
            <div onClick={() => alert(`Total Coins: ${hud.coins}`)} className="cursor-pointer">
              🪙 {hud.coins}
            </div>
            <div
              onClick={() => alert(`Broken Wells: ${hud.brokenCount}`)}
              className="cursor-pointer"
            >
              💥 {hud.brokenCount} Wells Down
            </div>
            <div onClick={() => alert(`Player Level: ${hud.level}`)} className="cursor-pointer">
              ⭐ Level {hud.level} — XP: {hud.xp}
            </div>
          </div>

      <div className="mt-4 grid grid-cols-6 gap-1">
        {mapGrid.flat().map(tile => (
          <div
            key={`${tile.x}-${tile.y}`}
            className="border border-black p-1 text-xs bg-white flex flex-col items-center justify-center relative"
            title={tile.lsdName}
          >
            {tile.isGarage && (
              <div onClick={() => navigate('/garage')} className="cursor-pointer text-2xl">
                🏡
              </div>
            )}

            {tile.wells.map(well => (
              <button
                key={well.id}
                onClick={() => handleRepair(well, tile.x, tile.y)}
                disabled={!well.isBroken || truckPhase !== 'idle'}
                className={`mt-1 ${!well.isBroken || truckPhase !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{well.isBroken ? '🟥' : '🟩'}</span>
              </button>
            ))}

            {truckPos?.x === tile.x && truckPos?.y === tile.y && (
              <div className="absolute top-0 right-0 text-lg">🚚</div>
            )}
          </div>
        ))}
      </div>
    </div>
      )};
    </div>
    );  
  };

export default GridMapPage