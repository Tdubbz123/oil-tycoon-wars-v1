import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGameState } from '../pages/lib/gameSave';
import { useTruckRepair } from '../hooks/useTruckRepair';
import { useMapGenerator } from '../hooks/mapGenerator';
import { Well, GridTile } from '../hooks/mapGenerator';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);


  const handleCenterGarage = () => {
    const garageTile = mapGrid.flat().find(t => t.isGarage);
    if (!garageTile || !mapContainerRef.current) return;

    const scrollLeft = garageTile.x * 64 - mapContainerRef.current.clientWidth / 2;
    const scrollTop = garageTile.y * 64 - mapContainerRef.current.clientHeight / 2;
    mapContainerRef.current.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' });
  };

  const generate = useMapGenerator();

  const handleGenerateMap = () => {
    const newGrid = generate; 

    setMapGrid(newGrid);
    setMapReady(true);
    const brokenCount = newGrid.flat().reduce(
      (acc: number, tile: GridTile) =>
      acc + tile.wells.filter((w: Well) => w.isBroken).length,
    0
  );

    setHud(prev => ({ ...prev, brokenCount }));
  };

  const handleRepair = (well: Well) => {
  if (!well.isBroken || status !== 'idle' || truckPhase !== 'idle') return;

  const garageTile = mapGrid.flat().find(t => t.isGarage);
  if (!garageTile) return;

  setTruckPhase('drivingTo');
  setTruckPos({ x: garageTile.x, y: garageTile.y });
  console.log('🚛 Driving to well...');

  dispatchTruckToRepair(well, (coinsEarned, xpEarned) => {
    console.log(`✅ Repair complete. Earned ${coinsEarned} coins, ${xpEarned} XP.`);

    const updatedState = loadGameState();
    setHud({
      coins: updatedState.coins,
      xp: updatedState.xp,
      level: updatedState.playerLevel,
      brokenCount: mapGrid.flat().reduce(
        (acc, tile) => acc + tile.wells.filter(w => w.isBroken).length,
        0
      ),
    });

    setTruckPhase('idle');
    setTruckPos({ x: garageTile.x, y: garageTile.y });
  });
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
    {!mapReady ? (
      <div className="text-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleGenerateMap}
        >
          Generate Map
        </button>
      </div>
    ) : (
      <>
        {/* HUD BAR */}
        <div className="flex justify-between items-center bg-gray-900 text-white p-2 text-sm">
          <div onClick={handleCenterGarage} className="cursor-pointer">🏡 Garage</div>
          <div onClick={() => alert(`Total Coins: ${hud.coins}`)} className="cursor-pointer">
            🪙 {hud.coins}
          </div>
          <div onClick={() => alert(`Broken Wells: ${hud.brokenCount}`)} className="cursor-pointer">
            💥 {hud.brokenCount} Wells Down</div>
          <div onClick={() => alert(`Player Level: ${hud.level}`)} className="cursor-pointer">
            ⭐ Level {hud.level} — XP: {hud.xp}
          </div>
          {truckPhase !== 'idle' && (
            <div className="ml-4 text-yellow-300 animate-pulse">
              {truckPhase === 'drivingTo' && 'Driving to well...'}
              {truckPhase === 'repairing' && 'Repairing well...'}
              {truckPhase === 'returning' && 'Returning to base...'}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            const options = mapGrid.flat().filter(t => t.wells.length > 0);
            const tile = options[Math.floor(Math.random() * options.length)];
            if (!tile) return;
            const goodWells = tile.wells.filter(w => !w.isBroken);
            if (goodWells.length === 0) return;
            const w = goodWells[Math.floor(Math.random() * goodWells.length)];
            w.isBroken = true;
            setMapGrid([...mapGrid]);
          }}
          className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          💥 Force Breakdown
        </button>


        {/* Map Grid */}
        <div 
          ref={mapContainerRef} 
          className="mt-4 grid grid-cols-6 gap-1">
          {mapGrid.flat().map(tile => (
            <div 
              key={`${tile.x}-${tile.y}`}
              className="border border-black p-1 text-xs bg-white flex flex-col items-center justify-center relative"
              title={tile.lsdName}
            >
              {/* Garage */}
              {tile.isGarage && (
                <div onClick={() => navigate('/garage')} className="cursor-pointer text-2xl">
                  🏡
                </div>
              )}

               {/* Well status */}
               {tile.wells.map(well => (
                <button
                  key={well.id}
                  onClick={() => {
                    setSelectedWell(well);
                    setSelectedTile({ x: tile.x, y: tile.y });
                  }}
                  disabled={!well.isBroken || truckPhase !== 'idle'}
                  className={`mt-1 ${!well.isBroken || truckPhase !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span>{well.isBroken ? '🟥' : '🟩'}</span>
                </button>
              ))}

              {/* 🚛 Truck Display */}
              {truckPhase !== 'idle' && truckPos.x === tile.x && truckPos.y === tile.y && (
                <div className="absolute top-0 right-0 text-lg">🚛</div>
              )}
            </div>
          ))}
        </div>

              {/* 🛢️ Well Info Modal */}
              {selectedWell && selectedTile && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white p-4 rounded shadow-xl w-80 max-w-full relative">
                <h2 className="text-lg font-bold mb-2">Well Info</h2>
                <p>Status: {
                  truckPhase === 'repairing' && truckPos.x === selectedTile.x && truckPos.y === selectedTile.y
                    ? 'Being Repaired'
                    : selectedWell.isBroken
                    ? 'Broken'
                    : 'Running'
                  }
                </p>
              <p>Barrels/Day: {selectedWell.barrelsPerDay || 0}</p>

              <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedWell(null);
                  setSelectedTile(null);
                }}
                className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedWell(null);
                  setSelectedTile(null);
                  handleRepair(selectedWell);
                }}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              >
                Repair This Well
              </button>
            </div>
          </div>
        </div>
      )}       
    </>
  )}
  </div>
  );
};

export default GridMapPage