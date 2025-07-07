import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useTruckRepair } from '../hooks/useTruckRepair';
import { loadGameState, saveGameState } from './lib/gameSave';
import { TruckData } from '../Data/trucks';

import type { Well, BreakdownEvent } from '../Data/types';
import { generateMapWells } from '../hooks/mapGenerator';
import { breakdownEvents } from '../Data/types'

const GARAGE_COORDS: [number, number] = [53.2762, -110.0056];
const FOG_RADIUS_KM = 50;

// Icons
const houseIcon = new L.DivIcon({
  html: '🏡',
  className: '',
  iconSize: [100, 100],
  iconAnchor: [30, 60],
});

const truckIcon = new L.DivIcon({
  html: '🛻',
  className: 'truck-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const wellIconWorking = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const wellIconBroken = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Generate fog-of-war polygon with hole
const generateFogPolygon = (
  center: [number, number],
  radiusKm: number,
  segments = 64
): [number, number][][] => {
  const outer: [number, number][] = [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180],
  ];
  const hole: [number, number][] = [];
  const latRad = (center[0] * Math.PI) / 180;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const dLat = (radiusKm / 111) * Math.sin(theta);
    const dLng = (radiusKm / (111 * Math.cos(latRad))) * Math.cos(theta);
    hole.push([center[0] + dLat, center[1] + dLng]);
  }
  return [outer, hole];
};

export default function GridMapPage() {
  console.log('📍 GridMapPage mounted');
  const [wells, setWells] = useState<Well[]>([]);
  const [truckPos, setTruckPos] = useState<[number, number]>(GARAGE_COORDS);
  const [hud, setHud] = useState({ coins: 0, xp: 0, level: 1, brokenCount: 0 });
  const [pops, setPops]   = useState<{id:string; text:string}[]>([]);
  const [fogPolygon, setFogPolygon] = useState<[number, number][][]>([]);
  const [repairing, setRepairing] = useState<string | null>(null);
  const { dispatchTruckToRepair } = useTruckRepair();

  function spawnPop(text: string) {
    const id = crypto.randomUUID();
    setPops(ps => [...ps, {id, text}]);
    setTimeout(() => {
      setPops(ps => ps.filter(p => p.id !== id));
    }, 1500);
  }

  // Initialize fog polygon
  useEffect(() => {
    const poly = generateFogPolygon(GARAGE_COORDS, FOG_RADIUS_KM);
    console.log('🌫 Fog polygon generated');
    setFogPolygon(poly);
  }, []);

  // Load saved wells on mount
  useEffect(() => {
    const gameState = loadGameState();
    if (Array.isArray(gameState.wells) && gameState.wells.length > 0) {
    console.log('🎯 Loading saved wells', gameState.wells.length);
    setWells(gameState.wells);
    updateHud(gameState.wells);
  } else {
  // otherwise, auto‐generate 20 random wells (so you don't have to hit "Generate Map")
  console.log('🏗️ No saved wells, auto‐generating 20…');
  const generated = generateMapWells(20);
  setWells(generated);
  updateHud(generated);

  // persist them so the next reload will load the same
  saveGameState({ ...gameState, wells: generated });
  }
}, [] );

  const updateHud = (wellList: Well[]) => {
    const gameState = loadGameState();
    const broken = wellList.filter(w => w.isBroken).length;
    setHud({
      coins: gameState.coins,
      xp: gameState.xp,
      level: gameState.playerLevel,
      brokenCount: broken,
    });
    console.log('🎯 HUD updated', { coins: gameState.coins, xp: gameState.xp, level: gameState.playerLevel, brokenCount: broken });
  };

  // Randomly break a working well every 60s:
  // Schedule a single interval on mount that picks a random working well every 30–90s
useEffect(() => {
  const interval = setInterval(() => {
    // mutate state via functional setter so we always see the latest 'wells'
    setWells(ws => {
      const working = ws.filter(w => !w.isBroken);
      if (working.length === 0) return ws;

      // pick a random well and event
      const target = working[Math.floor(Math.random() * working.length)];
      const evt = breakdownEvents[
        Math.floor(Math.random() * breakdownEvents.length)
      ] as BreakdownEvent;

      console.log('❗ Well breakdown:', target.id, evt);

      // return updated array
      return ws.map(w =>
        w.id === target.id
          ? { ...w, isBroken: true, breakdownEvent: evt }
          : w
      );
    });

    // bump the HUD
    setHud(h => ({ ...h, brokenCount: h.brokenCount + 1 }));
  }, 30_000 + Math.random() * 60_000); // 30s–90s random

  // cleanup on unmount
  return () => clearInterval(interval);
  }, []);  // ← empty deps → only one interval ever created

  const animateTruck = (
    start: [number, number],
    end: [number, number],
    duration: number,
    onArrive: () => void
  ) => {
    console.log('🚗 Truck animation start', { start, end, duration });
    const steps = 60;
    const interval = duration / steps;
    let count = 0;
    const move = setInterval(() => {
      count++;
      const lat = start[0] + ((end[0] - start[0]) * count) / steps;
      const lng = start[1] + ((end[1] - start[1]) * count) / steps;
      setTruckPos([lat, lng]);
      if (count >= steps) {
        clearInterval(move);
        console.log('🚗 Truck reached destination', end);
        onArrive();
      }
    }, interval);
  };

    const [pops, setPops] = useState<{ id: string; text: string }[]>([]);

    function spawnPop(text: string) {
    const id = crypto.randomUUID();
    setPops(ps => [...ps, { id, text }]);
    setTimeout(() => {
    setPops(ps => ps.filter(p => p.id !== id));
    }, 1500);
  }
  // Repair handler
  const handleRepair = (well: Well) => {
    if (repairing) return;
    console.log('🛠 Repair clicked', well.id);
    setRepairing(well.id);
    const gameState = loadGameState();
    const truck = gameState.truckFleet[0];
    const truckStats = TruckData.find(t => t.name === truck.name);
    const speed = truckStats?.stats.speed || 1;
    const dx = GARAGE_COORDS[0] - well.lat;
    const dy = GARAGE_COORDS[1] - well.lng;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const travelTime = Math.max(2000, (distance / speed) * 10000);

    animateTruck(GARAGE_COORDS, [well.lat, well.lng], travelTime, () => {
      console.log('✈️ Truck arrived at well', well.id);
      // inside your animateTruck → onArrive → dispatchTruckToRepair callback:
      dispatchTruckToRepair(well, (coins, xp) => {
      // spawn your popups…
      spawnPop(`+${coins}c`);
      spawnPop(`+${xp} XP`);

      // now update _only_ the one well in React state:
      setWells(ws =>
        ws.map(w =>
          w.id === well.id
            ? { ...w, isBroken: false }
            : w
        )
      );
      updateHud(
        ws => ws.map(w => (w.id === well.id ? { ...w, isBroken: false } : w))
      );
    });

        animateTruck([well.lat, well.lng], GARAGE_COORDS, travelTime, () => {
          console.log('🏠 Truck returned to garage');
          setRepairing(null);
        });
      });
    };
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* HUD Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5rem',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 1000,
        }}
      >
      {wells.length > 0 ? (
          <>
            <span>🪙 {hud.coins}</span>

            {/* XP progress bar container */}
            <div style={{ flex: 1, margin: '0 1rem' }}>
            <div style={{
            height: '4px',
            background: '#555',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
          <div style={{
            width: `${(hud.xp / (hud.level * 100)) * 100}%`,
            height: '100%',
            background: '#ffd700'
          }} />
          </div>
          <div style={{
            fontSize: '10px',
            color: '#ccc',
            textAlign: 'center'
          }}>
            XP: {hud.xp} / {hud.level * 100}
          </div>
        </div>

        <span>❌ {hud.brokenCount}</span>
        <span>⭐ {hud.level}</span>

        </>
        </div>

      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50">
        {pops.map(({ id, text }) => (
          <div key={id} className="pop">
            {text}
        </div>
      ))}
    </div>

    {/* Map itself */}
    <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >

        {/* Floating reward pop‐ups */}
        <div style={{
          position: 'absolute', top: '3.5rem', left:'50%',
          transform:'translateX(-50%)', pointerEvents:'none'
        }}>
          {pops.map(p => (
            <div key={p.id} className="pop">{p.text}</div>
          ))}
        </div>

        <MapContainer
          center={GARAGE_COORDS}
          zoom={11}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          {/* Esri Street */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
          />


        {/* Fog */}
        {fogPolygon.length === 2 && (
          <Polygon
            positions={fogPolygon}
            pathOptions={{ fillColor: 'black', fillOpacity: 0.5, stroke: false }}
          />
        )}

        {/* Garage */}
        <Marker position={GARAGE_COORDS} icon={houseIcon}>
          <Popup>🏡 Garage</Popup>
        </Marker>

        {/* Truck */}
        <Marker position={truckPos} icon={truckIcon}>
          <Popup>🚛 Truck</Popup>
        </Marker>

        {/* Wells */}
        {wells.map((well) => (
          <Marker
            key={well.id}
            position={[well.lat, well.lng]}
            icon={well.isBroken ? wellIconBroken : wellIconWorking}
          >
            <Popup>
              <div style={{ fontSize: '0.9rem' }}>
                <div>
                <strong>LSD:</strong> {well.lsd}
                </div>
                <div>
                  <strong>Event:</strong>{' '}
                  {well.breakdownEvent ?? '-'}
                </div>
                <div>
                  <strong>Status</strong>{' '}
                  {well.isBroken ? '⚠️ Broken' : '✅ Running'}
                </div>
                <div>
                  <strong>Barrels/Day:</strong>
                  {well.barrelsPerDay}
                </div>{well.isBroken && (
                <button
                      onClick={() => handleRepair(well)}
                      style={{
                        background: '#DC2626',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                      }}
                    >
                      🛠 Repair Well
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default GridMapPage