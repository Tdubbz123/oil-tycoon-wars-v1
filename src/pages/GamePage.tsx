import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { saveGameState, loadGameState, } from './lib/gameSave';


declare global {
  interface Window {
    Telegram: any;
  }
}

export default function GamePage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Oil Tycoon Wars';

    const existing = loadGameState();
    console.log('Loaded Game State:', existing);
  }, []);

  const handleStart = () => {
    const state = loadGameState();
    saveGameState({
      ...state,
      lastPlayed: new Date().toISOString(),
    });
    navigate('/map');
  };

  const handleExit = () => {
    const state = loadGameState();
    saveGameState({
      ...state,
      lastPlayed: new Date().toISOString(),
    });

    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto min-h-[90vh] bg-white">
      <img
        src="/oil-tycoon-wars-v1/assets/oil-tycoon-wars-portrait.png"
        alt="Oil Tycoon Wars"
        className="w-full h-auto"
      />

      <h1 className="text-4xl font-bold mb-2 text-center">OIL TYCOON WARS</h1>
      <p className="text-lg text-gray-300 mb-8 text-center">
        Build. Battle. Drill. Dominate.
      </p>

      <button
        onClick={handleStart}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg shadow-lg transition mb-4"
      >
        Start Single Player
      </button>

      <button
        onClick={handleExit}
        className="text-sm text-gray-400 underline"
      >
        Exit Game
      </button>
    </div>
  );
}
