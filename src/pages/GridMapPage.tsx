import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTruckRepair } from '../hooks/useTruckRepair';
import { loadGameState, } from './lib/gameSave';
import { TruckData } from '../Data/trucks';
import type { Well } from '../Data/types';
import { generateMapWells } from '../hooks/mapGenerator';

const GARAGE_COORDS: [number, number] = [53.2762, -110.0056];
const FOG_RADIUS_KM = 50;

// Icons
const houseIcon = new L.DivIcon({
  html: '🏡',
  className: '',
  iconSize: [60, 60],
  iconAnchor: [30, 60],
});

const truckIcon = new L.DivIcon({
  html: '🚛',
  className: '',
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

const GridMapPage = () => {
  console.log('📍 GridMapPage mounted');
  const [wells, setWells] = useState<Well[]>([]);
  const [truckPos, setTruckPos] = useState<[number, number]>(GARAGE_COORDS);
  const [hud, setHud] = useState({ coins: 0, xp: 0, level: 1, brokenCount: 0 });
  const [fogPolygon, setFogPolygon] = useState<[number, number][][]>([]);
  const [repairing, setRepairing] = useState<string | null>(null);
  const { dispatchTruckToRepair } = useTruckRepair();

  // Initialize fog polygon
  useEffect(() => {
    const poly = generateFogPolygon(GARAGE_COORDS, FOG_RADIUS_KM);
    console.log('🌫 Fog polygon generated');
    setFogPolygon(poly);
  }, []);

  // Load saved wells on mount
  useEffect(() => {
    const gameState = loadGameState();
    console.log('🔄 Loaded gameState', gameState);
    if (gameState.wells) {
      setWells(gameState.wells);
      updateHud(gameState.wells);
    }
  }, []);

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

  // Generate 20 dummy wells and save
  const handleGenerateMap = () => {
    console.log('🗺 Generating 20 random wells...');
    const newWells = generateMapWells(20);
    setWells(newWells);
    updateHud(newWells);
  };

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
      dispatchTruckToRepair(well, (coins, xp) => {
        console.log(`💰 Earned ${coins} coins and ${xp} XP`);
        const updated = loadGameState().wells || [];
        setWells(updated);
        updateHud(updated);
        animateTruck([well.lat, well.lng], GARAGE_COORDS, travelTime, () => {
          console.log('🏠 Truck returned to garage');
          setRepairing(null);
        });
      });
    });
  };

     return (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
    {/* Header + Generate button */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3.5rem',        // reserve 3.5rem for HUD
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
          <span>🪙 Coins: {hud.coins}</span>
          <span>❌ Broken: {hud.brokenCount}</span>
          <span>⭐ Level: {hud.level}</span>
        </>
      ) : (
        <button
          onClick={handleGenerateMap}
          style={{
            background: '#2563EB',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Generate Map
        </button>
      )}
    </div>

    {/* Map itself */}
    <div
      style={{
        position: 'absolute',
        top: '3.5rem',   // just below header
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <MapContainer
        center={GARAGE_COORDS}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        {/* ESRI Satellite */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri — Esri, HERE, Garmin, FAO, NOAA, USGS, EPA"
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
              <div style={{ fontSize: '0.875rem' }}>
                <strong>LSD:</strong> {well.lsd}
                <br />
                <strong>Type:</strong> {well.type}
                <br />
                <strong>Status:</strong> {well.isBroken ? '⚠️ Broken' : '✅ Running'}
                <br />
                <strong>Barrels/Day:</strong> {well.barrelsPerDay}
                {well.isBroken && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleRepair(well)}
                      style={{
                        background: '#DC2626',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      🛠 Repair Well
                    </button>
                  </div>
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

export default GridMapPage;