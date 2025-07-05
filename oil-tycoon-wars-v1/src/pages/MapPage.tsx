
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { loadGameState, saveGameState, } from './lib/gameSave';

const garageIcon = new L.Icon({
  iconUrl: '/assets/garage-icon.png',
  iconSize: [40, 40],
});

const dummyWellIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MAP_CENTER: [number, number] = [52.7205, -110.0037];
const ZOOM_LEVEL = 9;

const generateDummyWells = () => {
  const wells = [];
  for (let i = 0; i < 50; i++) {
    wells.push({
      id: `WELL-${1000 + i}`,
      lat: 52.4 + Math.random() * 0.8,
      lng: -110.6 + Math.random() * 1.2,
      owner: 'OilCo Ltd.',
      dailyProduction: Math.floor(Math.random() * 200) + 100,
    });
  }
  return wells;
};

const WellDownButton = ({ onClick }: { onClick: () => void }) => (
  <button
    className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-[1000]"
    onClick={onClick}
  >
    🚨 Well Down! Click to Respond
  </button>
);

const HUD = ({ coins, oil, level }: { coins: number; oil: number; level: number }) => (
  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-4 py-2 rounded z-[1000]">
    💰 Coins: {coins} | 🛢 Oil: {oil} | ⭐ Level: {level}
  </div>
);

const GarageMarker = ({ onClick }: { onClick: () => void }) => (
  <Marker position={MAP_CENTER} icon={garageIcon as any} eventHandlers={{ click: onClick }}>
    <Popup>Home Base Garage</Popup>
  </Marker>
);

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function MapPage() {
  const [wells] = useState(generateDummyWells());
  const [brokenWell, setBrokenWell] = useState<any | null>(null);
  const [truckStatus, setTruckStatus] = useState<'idle' | 'toWell' | 'repairing' | 'returning'>('idle');
  const [hud, setHud] = useState(() => {
    const state = loadGameState();
    return {
      coins: state.coins,
      oil: state.oil,
      level: state.playerLevel,
    };
  });

  const mapRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const triggerBreakdown = () => {
      const randomWell = wells[Math.floor(Math.random() * wells.length)];
      setBrokenWell(randomWell);
      const nextDelay = 45000 + Math.random() * 45000;
      timer = setTimeout(triggerBreakdown, nextDelay);
    };

    triggerBreakdown();
    return () => clearTimeout(timer);
  }, [wells]);

  const handleWellDownClick = () => {
    if (brokenWell && mapRef.current) {
      mapRef.current.flyTo([brokenWell.lat, brokenWell.lng] as [number, number], 12);
    }
  };

  const handleDispatchTruck = () => {
    if (!brokenWell) return;

    const state = loadGameState();
    const truck = state.truckFleet[0];
    if (!truck) return;

    const dist = calculateDistance(MAP_CENTER[0], MAP_CENTER[1], brokenWell.lat, brokenWell.lng);
    const roundTrip = dist * 2;

    truck.kmDriven += roundTrip;
    truck.wellsRepaired += 1;

    setTruckStatus('toWell');

    setTimeout(() => {
      setTruckStatus('repairing');
      setTimeout(() => {
        setTruckStatus('returning');
        setTimeout(() => {
          setTruckStatus('idle');
          setBrokenWell(null);
          setHud((prev) => ({ ...prev, coins: prev.coins + 50 }));
          state.coins += 50;
          saveGameState(state);
        }, 30000);
      }, 30000);
    }, 30000);
  };

  return (
    <div className="relative h-screen w-screen">
      <MapContainer
        center={MAP_CENTER}
        zoom={ZOOM_LEVEL}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GarageMarker onClick={() => navigate('/garage')} />

        {wells.map((well) => (
          <Marker key={well.id} position={[well.lat, well.lng] as [number, number]} icon={dummyWellIcon as any}>
            <Popup>
              <strong>{well.id}</strong>
              <br />
              Owner: {well.owner}
              <br />
              Daily: {well.dailyProduction} barrels
              <br />
              {brokenWell?.id === well.id && (
                <>
                  <p className="mt-2 text-red-600 font-bold">🚨 This well is down!</p>
                  {truckStatus === 'idle' && (
                    <button onClick={handleDispatchTruck} className="mt-2 bg-blue-600 text-white px-2 py-1 rounded">
                      Dispatch Truck
                    </button>
                  )}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {brokenWell && <WellDownButton onClick={handleWellDownClick} />}
      <HUD coins={hud.coins} oil={hud.oil} level={hud.level} />

      {truckStatus !== 'idle' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded shadow-lg z-[1000]">
          Truck Status: {truckStatus === 'toWell' ? '🚚 En Route' : truckStatus === 'repairing' ? '🛠 Repairing' : '↩ Returning'}
        </div>
      )}
    </div>
  );
}
