import { useEffect, useState } from 'react';
import { loadGameState, saveGameState } from './lib/gameSave';
import { Truck, TruckData } from '../Data/trucks';

export default function GaragePage() {
  const [coins, setCoins] = useState(0);
  const [trucks, setTrucks] = useState<(Truck & { quantityOwned: number })[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [repairStats, setRepairStats] = useState(0);
  const [kmDriven, ] = useState(0); // Placeholder

  useEffect(() => {
    const state = loadGameState();

    const ownedTrucks = TruckData.map((t) => {
      const quantityOwned = state.ownedTrucks.filter((x) => x === t.name).length;
      return { ...t, quantityOwned };
    });

    setTrucks(ownedTrucks);
    setCoins(state.coins);
    setRepairStats(state.wellsVisited.length || 0);
  }, []);

  const handleBuy = (truck: Truck & { quantityOwned: number }) => {
    const nextPrice = truck.basePrice * (truck.quantityOwned + 1);
    if (coins < nextPrice) return;

    const updated = trucks.map((t) =>
      t.name === truck.name
        ? { ...t, quantityOwned: t.quantityOwned + 1 }
        : t
    );

    const newCoins = coins - nextPrice;
    setTrucks(updated);
    setCoins(newCoins);

    const game = loadGameState();
    saveGameState({
      ...game,
      coins: newCoins,
      ownedTrucks: [...game.ownedTrucks, truck.name],
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-2">🛠 Garage</h1>
      <p className="text-sm text-gray-400 mb-4">Coins: {coins.toLocaleString()}</p>

      {/* Current Inventory */}
      <div className="bg-gray-800 rounded-lg p-3 mb-6">
        <h2 className="text-xl font-semibold mb-2">🪰 Trucks Owned</h2>
        <div className="flex flex-wrap gap-2">
          {trucks.filter(t => t.quantityOwned > 0).map(t => (
            <span key={t.name} className="bg-yellow-600 text-black px-2 py-1 rounded text-sm">
              {t.name} ×{t.quantityOwned}
            </span>
          ))}
        </div>
      </div>

      {/* Truck Bay Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trucks.map((truck, index) => {
          const price = truck.basePrice * (truck.quantityOwned + 1);
          const canAfford = coins >= price;

          return (
            <div
              key={truck.name}
              className="bg-gray-800 rounded-lg p-4 shadow-md flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Bay {index + 1} – {truck.name}
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  Price: ${price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  Owned: {truck.quantityOwned}
                </p>
              </div>
              <button
                onClick={() => canAfford && handleBuy(truck)}
                className={`mt-3 px-4 py-2 rounded text-sm font-semibold ${
                  canAfford
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Purchase' : 'Not Enough Coins'}
              </button>

              {truck.quantityOwned > 0 && (
                <button
                  onClick={() => setSelectedTruck(truck)}
                  className="mt-2 underline text-blue-400 text-xs"
                >
                  View Stats
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Truck Stats Modal */}
      {selectedTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-2">{selectedTruck.name} Stats</h3>
            <p className="text-sm mb-1">🛠 Wells Repaired: {repairStats}</p>
            <p className="text-sm mb-1">🚣 Km Driven: {kmDriven.toFixed(1)}</p>
            {selectedTruck.stats && (
              <div className="text-sm text-gray-300 mt-2">
                {selectedTruck.stats.speed && <p>Speed: {selectedTruck.stats.speed} km/h</p>}
                {selectedTruck.stats.range && <p>Range: {selectedTruck.stats.range} km</p>}
                {selectedTruck.stats.repairBoost && (
                  <p>Repair Boost: {selectedTruck.stats.repairBoost * 100}%</p>
                )}
              </div>
            )}
            <button
              onClick={() => setSelectedTruck(null)}
              className="mt-3 w-full bg-red-600 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
