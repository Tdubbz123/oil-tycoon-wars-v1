
import { useEffect, useRef, useState } from 'react';
import { useMapGenerator } from '../hooks/mapGenerator';
import { useNavigate } from 'react-router-dom';
import { loadGameState } from '../pages/lib/gameSave';
import { useTruckRepair } from '../hooks/useTruckRepair';

const WellIcon = ({ broken }: { broken: boolean }) => (
  <div className={broken ? 'text-red-600' : 'text-green-500'}>📍</div>
);
const GarageIcon = () => <div className="text-gray-700">🏠</div>;
const CompassIcon = () => <span className="text-white">🧭</span>;
const ZoomInIcon = () => <span className="text-white text-lg">＋</span>;
const ZoomOutIcon = () => <span className="text-white text-lg">－</span>;

export default function GridMapPage() {
  const initialGrid = useMapGenerator();
  const [mapGrid, setMapGrid] = useState(initialGrid);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const navigate = useNavigate();

  const [hud, setHud] = useState(() => {
    const state = loadGameState();
    return {
      coins: state.coins || 0,
      xp: state.xp || 0,
      level: state.playerLevel || 1,
    };
  });

  const { dispatchTruckToRepair, status } = useTruckRepair();

  const [garageCoords, setGarageCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    for (let row of mapGrid) {
      for (let tile of row) {
        if (tile.isGarage) {
          setGarageCoords({ x: tile.x, y: tile.y });
          return;
        }
      }
    }
  }, [mapGrid]);

  // Random breakdown every 60–120s
  useEffect(() => {
    const interval = setInterval(() => {
      const flat = mapGrid.flat();
      const options = flat.filter(t => t.wells.length > 0);
      const tile = options[Math.floor(Math.random() * options.length)];
      if (tile) {
        const goodWells = tile.wells.filter(w => !w.isBroken);
        if (goodWells.length > 0) {
          const w = goodWells[Math.floor(Math.random() * goodWells.length)];
          w.isBroken = true;
          setMapGrid([...mapGrid]);
        }
      }
    }, 60000 + Math.random() * 60000);
    return () => clearInterval(interval);
  }, [mapGrid]);

  const scrollToGarage = () => {
    if (!containerRef.current || !garageCoords) return;
    const tileSize = 64 * zoom;
    containerRef.current.scrollTo({
      top: garageCoords.y * tileSize - 200,
      left: garageCoords.x * tileSize - 300,
      behavior: 'smooth',
    });
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className="relative h-screen w-screen">
      {/* HUD Bar */}
      <div className="fixed top-0 left-0 w-full bg-black text-white px-4 py-2 z-50 flex justify-between items-center">
        <span>💰 {hud.coins}</span>
        <span>⭐ Level {hud.level} — XP: {hud.xp}</span>
        <div className="flex gap-2">
          <button onClick={scrollToGarage} className="bg-blue-600 px-2 rounded"><CompassIcon /></button>
          <button onClick={zoomOut} className="bg-gray-600 px-2 rounded"><ZoomOutIcon /></button>
          <button onClick={zoomIn} className="bg-gray-600 px-2 rounded"><ZoomInIcon /></button>
        </div>
      </div>

      {/* Map Grid */}
      <div
        ref={containerRef}
        className="absolute top-12 bottom-0 left-0 right-0 overflow-scroll bg-green-50"
      >
        <div
          className="grid"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            gridTemplateColumns: `repeat(${mapGrid[0]?.length || 0}, 64px)`,
            gridAutoRows: '64px',
            width: `${mapGrid[0]?.length * 64}px`,
          }}
        >
          {mapGrid.flat().map(tile => (
            <div
              key={`${tile.x}-${tile.y}`}
              className="border border-gray-400 flex flex-col items-center justify-center text-xs bg-white relative"
              title={tile.lsdName}
            >
              {tile.isGarage && (
                <div onClick={() => navigate('/garage')} className="cursor-pointer">
                  <GarageIcon />
                </div>
              )}

              {tile.wells.map(well => (
                <button
                  key={well.id}
                  onClick={() => {
                    if (!well.isBroken || status !== 'idle') return;
                    dispatchTruckToRepair(well, (coinsEarned, xpEarned) => {
                      setHud(prev => ({
                        ...prev,
                        coins: prev.coins + coinsEarned,
                        xp: prev.xp + xpEarned,
                        level: loadGameState().playerLevel,
                      }));
                    });
                  }}
                  disabled={!well.isBroken || status !== 'idle'}
                  className={`mt-1 ${!well.isBroken || status !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <WellIcon broken={well.isBroken} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}