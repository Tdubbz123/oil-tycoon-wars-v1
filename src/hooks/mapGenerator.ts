import { useEffect, useState } from 'react';
import { loadGameState, saveGameState } from '../pages/lib/gameSave';

export interface Well {
  id: string;
  lsd: string;
  productionRate: number;
  isBroken: boolean;
}

export interface GridTile {
  township: number;
  section: number;
  lsd: number;
  lsdName: string;
  wells: Well[];
  isGarage: boolean;
  x: number;
  y: number;
}

const STORAGE_KEY = 'oil-tycoon-map';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useMapGenerator(): GridTile[][] {
  const [grid, setGrid] = useState<GridTile[][]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setGrid(JSON.parse(saved));
      return;
    }

    const state = loadGameState();
    if (!state.mapSeed) {
      state.mapSeed = Math.random().toString(36).substring(2, 10);
      saveGameState(state);
    }

    const seedHash = Array.from(state.mapSeed).reduce(
      (acc: number, char: string) => acc + char.charCodeAt(0),
      0
    );
    const rand = mulberry32(seedHash);

    const township = 26;
    const range = 11;
    const meridian = 4;
    const sectionsPerSide = 6;
    const lsdsPerSection = 4;

    const newGrid: GridTile[][] = [];
    const garageIndex = Math.floor(rand() * (sectionsPerSide * sectionsPerSide * lsdsPerSection * lsdsPerSection));

    for (let secY = 0; secY < sectionsPerSide; secY++) {
      for (let secX = 0; secX < sectionsPerSide; secX++) {
        const sectionNum = getSectionNumber(secX, secY);

        for (let lsdY = 0; lsdY < lsdsPerSection; lsdY++) {
          for (let lsdX = 0; lsdX < lsdsPerSection; lsdX++) {
            const lsdNum = getLsdNumber(lsdX, lsdY);
            const flatIndex = newGrid.flat().length;
            const lsdName = `${pad(lsdNum)}-${pad(sectionNum)}-${township}-${range}W${meridian}`;

            const isGarage = flatIndex === garageIndex;
            const numWells = Math.floor(rand() * 4);

            const wells: Well[] = [];
            for (let i = 0; i < numWells; i++) {
              wells.push({
                id: `WELL-${lsdName}-${i + 1}`,
                lsd: lsdName,
                productionRate: Math.floor(rand() * 200) + 100,
                isBroken: false,
              });
            }

            const tile: GridTile = {
              township,
              section: sectionNum,
              lsd: lsdNum,
              lsdName,
              wells,
              isGarage,
              x: secX * lsdsPerSection + lsdX,
              y: secY * lsdsPerSection + lsdY,
            };

            if (!newGrid[tile.y]) newGrid[tile.y] = [];
            newGrid[tile.y][tile.x] = tile;
          }
        }
      }
    }

    setGrid(newGrid);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGrid));
  }, []);

  return grid;
}

function getLsdNumber(x: number, y: number): number {
  return y % 2 === 0 ? y * 4 + x + 1 : y * 4 + (3 - x) + 1;
}

function getSectionNumber(x: number, y: number): number {
  const base = y * 6;
  return y % 2 === 0 ? base + (6 - x) : base + x + 1;
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}