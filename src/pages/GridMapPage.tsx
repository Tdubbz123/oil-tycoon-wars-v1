// src/pages/GridMapPage.tsx

import { useState, useEffect } from 'react';
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
import { generateMapWells } from '../hooks/mapGenerator';
import { loadGameState, saveGameState } from '../pages/lib/gameSave';
import { TruckData } from '../Data/trucks';
import type { Well, BreakdownEvent } from '../Data/types';
import { breakdownEvents } from '../Data/types';

const GARAGE_COORDS: [number, number] = [53.2762, -110.0056];
const FOG_RADIUS_KM = 25;

const houseIcon = new L.DivIcon({
  html: '🏡',
  className: 'transparent-div-icon',
  iconSize: [50, 50],
  iconAnchor: [25, 50],
});
const truckIcon = new L.DivIcon({
  html: '🚚',
  className: 'transparent-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
const workingIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const brokenIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function GridMapPage() {
  //
  // — state
  //
  const [wells, setWells] = useState<Well[]>([]);
  const [truckPos, setTruckPos] = useState<[number, number]>(GARAGE_COORDS);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [hud, setHud] = useState({
    coins: 0,
    xp: 0,
    level: 1,
    brokenCount: 0,
  });
  const [pops, setPops] = useState<{ id: string; text: string }[]>([]);
  const [fogPolygon, setFogPolygon] = useState<[number, number][][]>([]);

  const { dispatchTruckToRepair } = useTruckRepair();

  //
  // — helper: spawn a floating “+5 XP” or “+25c” popup
  //
  function spawnPop(text: string) {
    const id = crypto.randomUUID();
    setPops((ps) => [...ps, { id, text }]);
    setTimeout(() => {
      setPops((ps) => ps.filter((p) => p.id !== id));
    }, 1500);
  }

  //
  // — helper: recompute HUD from a given well list
  //
  function updateHud(list: Well[]) {
    const st = loadGameState();
    setHud({
      coins: st.coins,
      xp: st.xp,
      level: st.playerLevel,
      brokenCount: list.filter((w) => w.isBroken).length,
    });
  }

  //
  // — helper: build a “donut” polygon with a hole for fog-of-war
  //
  function generateFog(
    centre: [number, number],
    radiusKm: number
  ): [[number, number][], [number, number][]] {
    const segments = 64;
    const outer: [number, number][] = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
    ];
    const hole: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const dLat = (radiusKm / 111) * Math.sin(theta);
      const dLng =
        (radiusKm / (111 * Math.cos((centre[0] * Math.PI) / 180))) *
        Math.cos(theta);
      hole.push([centre[0] + dLat, centre[1] + dLng]);
    }
    return [outer, hole];
  }

  //
  // — helper: smooth truck animation
  //
  function animateTruck(
    start: [number, number],
    end: [number, number],
    duration: number,
    onArrive: () => void
  ) {
    const steps = 60;
    const interval = duration / steps;
    let count = 0;
    const mover = setInterval(() => {
      count++;
      const lat = start[0] + ((end[0] - start[0]) * count) / steps;
      const lng = start[1] + ((end[1] - start[1]) * count) / steps;
      setTruckPos([lat, lng]);
      if (count >= steps) {
        clearInterval(mover);
        onArrive();
      }
    }, interval);
  }

  //
  // — when the user clicks “Repair” in a well’s Popup
  //
  function handleRepair(well: Well) {
    if (repairing) return;
    setRepairing(well.id);

    // compute travelTime from distance & truck speed
    const distance = Math.hypot(
      GARAGE_COORDS[0] - well.lat,
      GARAGE_COORDS[1] - well.lng
    );
    const truckUnit = loadGameState().truckFleet[0];
    const stats = TruckData.find((t) => t.name === truckUnit.name)?.stats;
    const speed = stats?.speed || 1;
    const travelTime = Math.max(2000, (distance / speed) * 10000);

    // animate out to the well
    animateTruck(GARAGE_COORDS, [well.lat, well.lng], travelTime, () => {
      // call your hook to do the saveGameState, coins/xp, etc.
      dispatchTruckToRepair(well, (coins, xp) => {
        spawnPop(`+${coins}c`);
        spawnPop(`+${xp} XP`);

        // flip just that one well back to running
        const updated = wells.map((w) =>
          w.id === well.id ? { ...w, isBroken: false } : w
        );
        setWells(updated);
        updateHud(updated);
      });

      // animate truck back home
      animateTruck([well.lat, well.lng], GARAGE_COORDS, travelTime, () => {
        setRepairing(null);
      });
    });
  }

  //
  // — first mount: build fog & load or generate your 20 wells
  //
  useEffect(() => {
    console.log('📍 GridMapPage mounted');
    setFogPolygon(generateFog(GARAGE_COORDS, FOG_RADIUS_KM));

    const gs = loadGameState();
    if (gs.wells?.length) {
      console.log('🔄 Loading saved wells:', gs.wells.length);
      setWells(gs.wells);
      updateHud(gs.wells);
    } else {
      console.log('🛠️ Generating 20 new wells');
      const fresh = generateMapWells(20);
      setWells(fresh);
      updateHud(fresh);
      saveGameState({ ...gs, wells: fresh });
    }
  }, []);

  //
  // — every 30–90 seconds mutate one random working well to “isBroken”
  //
  useEffect(() => {
    if (!wells.length) return;
    const iv = setInterval(() => {
      setWells((ws: Well[]) => {
        const working = ws.filter((w) => !w.isBroken);
        if (!working.length) return ws;
        const target =
          working[Math.floor(Math.random() * working.length)];
        const evt =
          breakdownEvents[
            Math.floor(Math.random() * breakdownEvents.length)
          ] as BreakdownEvent;
        console.log('❗️ Well breakdown:', target.id, evt);

        return ws.map((w) =>
          w.id === target.id ? { ...w, isBroken: true } : w
        );
      });
      setHud((h) => ({ ...h, brokenCount: h.brokenCount + 1 }));
    }, 30000 + Math.random() * 60000);
    return () => clearInterval(iv);
  }, [wells]);

  //
  // — finally: render
  //
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* HUD bar */}
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
        <span>🪙 {hud.coins}</span>
        {/* XP progress bar */}
        <div style={{ flex: 1, margin: '0 1rem' }}>
          <div
            style={{
              height: '4px',
              background: '#555',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(hud.xp / (hud.level * 100)) * 100}%`,
                height: '100%',
                background: '#ffd700',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#ccc',
              textAlign: 'center',
            }}
          >
            XP: {hud.xp} / {hud.level * 100}
          </div>
        </div>
        <span>⭐ {hud.level}</span>
      </div>

      {/* floating +coins/+XP pops */}
      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 1001,
        }}
      >
        {pops.map((p) => (
          <div key={p.id} className="pop">
            {p.text}
          </div>
        ))}
      </div>

      {/* the Leaflet map */}
      <MapContainer
        center={GARAGE_COORDS}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        {/* ESRI Street basemap */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />

        {/* fog of war */}
        {fogPolygon.length === 2 && (
          <Polygon
            positions={fogPolygon}
            pathOptions={{ fillColor: 'black', fillOpacity: 0.5, stroke: false }}
          />
        )}

        {/* garage */}
        <Marker position={GARAGE_COORDS} icon={houseIcon}>
          <Popup>🏡 Garage</Popup>
        </Marker>

        {/* truck */}
        <Marker position={truckPos} icon={truckIcon}>
          <Popup>🚚 Truck</Popup>
        </Marker>

        {/* all wells */}
        {wells.map((w) => (
          <Marker
            key={w.id}
            position={[w.lat, w.lng]}
            icon={w.isBroken ? brokenIcon : workingIcon}
          >
            <Popup>
              <div style={{ fontSize: '0.9rem' }}>
                <div><strong>LSD:</strong> {w.lsd}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  {w.isBroken ? '⚠️ Broken' : '✅ Running'}
                </div>
                <div><strong>Barrels/Day:</strong> {w.barrelsPerDay}</div>
                {w.isBroken && (
                  <button
                    onClick={() => handleRepair(w)}
                    style={{
                      marginTop: '0.5rem',
                      background: '#d33',
                      color: 'white',
                      border: 'none',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                    }}
                  >
                    🛠 Repair
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
