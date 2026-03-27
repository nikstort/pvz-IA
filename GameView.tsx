import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameMode, GameState, PlantType } from '../types';
import { createInitialState, updateGameState } from '../engine';
import { PLANTS, ZOMBIES, GRID_ROWS, GRID_COLS } from '../constants';
import { playSound } from '../audio';
import { Shovel, Play, Settings } from 'lucide-react';

interface GameViewProps {
  mode: GameMode;
  onExit: () => void;
}

export default function GameView({ mode, onExit }: GameViewProps) {
  const gameState = useRef<GameState>(createInitialState(mode));
  const [renderTick, setRenderTick] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState<PlantType | null>(null);
  const [isShovelActive, setIsShovelActive] = useState(false);

  // Engine Loop
  useEffect(() => {
    let lastTime = performance.now();
    let animFrame: number;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // max dt to prevent huge jumps
      lastTime = time;
      
      updateGameState(gameState.current, dt);
      setRenderTick(t => t + 1);

      if (!gameState.current.isGameOver) {
        animFrame = requestAnimationFrame(loop);
      }
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const state = gameState.current;

  const handleCellClick = (row: number, col: number) => {
    if (isShovelActive) {
      const plantIdx = state.plants.findIndex(p => p.row === row && p.col === col);
      if (plantIdx >= 0) {
        const p = state.plants[plantIdx];
        state.sun += PLANTS[p.type].cost; // Refund 100%
        state.plants.splice(plantIdx, 1);
        playSound('plant');
      }
      setIsShovelActive(false);
      return;
    }

    if (!selectedSeed) return;

    // Check if cell is occupied
    const occupied = state.plants.some(p => p.row === row && p.col === col);
    if (occupied) return;

    const stats = PLANTS[selectedSeed];
    if (state.sun >= stats.cost && state.seedCooldowns[selectedSeed] === 0) {
      state.sun -= stats.cost;
      state.seedCooldowns[selectedSeed] = stats.cooldown;
      
      let pState: 'NORMAL' | 'ARMING' | 'DIGESTING' | 'EXPLODING' = 'NORMAL';
      let pTimer = 0;

      if (selectedSeed === 'POTATO_MINE') {
        pState = 'ARMING';
        pTimer = 14;
      }
      
      state.plants.push({
        id: Math.random().toString(),
        row, col, type: selectedSeed, hp: stats.maxHp,
        lastFired: 0, state: pState, stateTimer: pTimer
      });
      playSound('plant');
      setSelectedSeed(null);
    }
  };

  const handleCollectSun = (sunId: string) => {
    const idx = state.suns.findIndex(s => s.id === sunId);
    if (idx >= 0) {
      state.sun += state.suns[idx].value;
      state.suns.splice(idx, 1);
      playSound('sun');
    }
  };

  if (state.isGameOver) {
    return (
      <div className="fixed inset-0 bg-black/90 text-red-500 flex flex-col items-center justify-center z-50">
        <h1 className="text-6xl font-black mb-4 animate-bounce">THE ZOMBIES ATE YOUR BRAINS!</h1>
        <p className="text-2xl text-white mb-8">You survived {state.wave} waves.</p>
        <button onClick={onExit} className="px-8 py-4 bg-green-600 text-white rounded font-bold hover:bg-green-500 text-xl">
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-900 overflow-hidden relative select-none">
      {/* HUD Top Bar */}
      <div className="absolute top-0 left-0 w-full bg-zinc-800/90 p-2 flex items-center shadow-lg z-20 overflow-x-auto">
        <button onClick={onExit} className="mr-4 text-white hover:text-red-400 font-bold">Menu</button>
        <div className="bg-yellow-500 rounded-full px-4 py-2 font-black text-xl flex items-center shrink-0">
          ☀️ {Math.floor(state.sun)}
        </div>
        
        <div className="flex gap-2 ml-4 flex-1 items-center overflow-x-auto px-2">
          {Object.entries(PLANTS).map(([type, stats]) => {
            const canAfford = state.sun >= stats.cost;
            const cooldown = state.seedCooldowns[type as PlantType];
            const isReady = cooldown === 0;
            const isSelected = selectedSeed === type;

            return (
              <button
                key={type}
                onClick={() => { setSelectedSeed(type as PlantType); setIsShovelActive(false); }}
                className={`relative w-16 h-20 bg-stone-700 border-2 rounded shrink-0 flex flex-col items-center justify-center transition-all ${isSelected ? 'border-green-400 scale-110 shadow-[0_0_15px_#4ade80]' : 'border-stone-900'} ${!canAfford ? 'opacity-50 grayscale' : 'hover:scale-105'}`}
              >
                <span className="text-2xl">{stats.icon}</span>
                <span className="text-xs font-bold text-white bg-black/50 px-1 rounded absolute bottom-1 right-1">{stats.cost}</span>
                {!isReady && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                    <span className="text-white text-xs font-bold">{Math.ceil(cooldown)}s</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => { setIsShovelActive(!isShovelActive); setSelectedSeed(null); }}
          className={`ml-4 p-4 rounded shrink-0 transition-all ${isShovelActive ? 'bg-red-500 scale-110 shadow-[0_0_15px_#ef4444]' : 'bg-stone-700 hover:bg-stone-600'}`}
        >
          <Shovel size={24} color="white" />
        </button>
      </div>

      {/* Wave Counter */}
      <div className="absolute bottom-4 right-4 bg-black/80 p-4 rounded text-white font-mono z-20 text-right">
        <div className="text-xl text-red-400 font-bold">Wave: {state.wave}</div>
        <div>Next Wave: {Math.ceil(state.timeUntilNextWave)}s</div>
        <div className="text-sm text-gray-400">Incoming Z's: {state.zombiesToSpawn.length}</div>
        <div className="text-sm text-gray-400">Active Z's: {state.zombies.length}</div>
      </div>

      {/* Lawn Grid */}
      <div className="absolute top-28 left-[10%] w-[80%] h-[70%] bg-[url('https://www.transparenttextures.com/patterns/grass.png')] bg-green-700 flex flex-col shadow-2xl border-4 border-green-950">
        {Array.from({ length: GRID_ROWS }).map((_, r) => (
          <div key={r} className="flex-1 flex border-b border-white/10 last:border-b-0 relative group">
            
            {/* Lawnmower */}
            {state.lawnmowers[r] && (
               <div 
                 className="absolute h-full flex items-center justify-center text-4xl z-10"
                 style={{ left: `${state.lawnmowers[r].x * (100 / GRID_COLS)}%` }}
               >
                 🛒
               </div>
            )}

            {Array.from({ length: GRID_COLS }).map((_, c) => (
              <div 
                key={c} 
                onClick={() => handleCellClick(r, c)}
                className={`flex-1 border-r border-white/10 last:border-r-0 flex items-center justify-center hover:bg-white/20 transition-colors ${(r+c)%2===0 ? 'bg-black/5' : ''}`}
              >
              </div>
            ))}
          </div>
        ))}
        
        {/* Render Plants */}
        {state.plants.map(p => {
          const stats = PLANTS[p.type];
          return (
            <div 
              key={p.id}
              className={`absolute flex items-center justify-center text-4xl drop-shadow-lg ${p.state === 'DIGESTING' ? 'animate-bounce' : ''}`}
              style={{ top: `${(p.row / GRID_ROWS) * 100}%`, left: `${(p.col / GRID_COLS) * 100}%`, width: `${100/GRID_COLS}%`, height: `${100/GRID_ROWS}%` }}
            >
              <div className="relative">
                {p.state === 'ARMING' ? '🥔' : stats.icon}
                {p.state === 'DIGESTING' && <span className="absolute -top-4 -right-2 text-2xl">🤐</span>}
                <div className="absolute -bottom-2 w-full h-1 bg-black/50 rounded">
                  <div className="h-full bg-green-500 rounded" style={{width: `${(p.hp/stats.maxHp)*100}%`}}></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Render Zombies */}
        {state.zombies.map(z => {
          const stats = ZOMBIES[z.type];
          return (
            <div 
              key={z.id}
              className={`absolute flex items-center justify-center text-5xl z-10 transition-transform ${z.speedMultiplier < 1 ? 'brightness-50 grayscale contrast-150' : ''} ${z.state === 'ETHEREAL' ? 'opacity-30' : ''}`}
              style={{ top: `${(z.row / GRID_ROWS) * 100}%`, left: `${(z.x / GRID_COLS) * 100}%`, width: `${100/GRID_COLS}%`, height: `${100/GRID_ROWS}%` }}
            >
              <div className="relative -ml-8">
                {stats.icon}
                {z.shieldHp > 0 && <span className="absolute top-0 right-0 text-xl">🛡️</span>}
                <div className="absolute -bottom-4 w-full h-1 bg-black/50 rounded flex flex-col gap-0.5">
                  <div className="h-full bg-red-500 rounded" style={{width: `${(z.hp/stats.maxHp)*100}%`}}></div>
                  {z.shieldHp > 0 && <div className="h-1 bg-blue-400 rounded" style={{width: `${(z.shieldHp/(stats.shieldHp||1))*100}%`}}></div>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Render Projectiles */}
        {state.projectiles.map(proj => (
          <div 
            key={proj.id}
            className="absolute flex items-center justify-center text-2xl z-20 drop-shadow-md"
            style={{ top: `${(proj.row / GRID_ROWS) * 100}%`, left: `${(proj.x / GRID_COLS) * 100}%`, width: `${100/GRID_COLS}%`, height: `${100/GRID_ROWS}%` }}
          >
            {proj.icon}
          </div>
        ))}
        
        {/* Render Suns */}
        {state.suns.map(sun => (
          <div 
            key={sun.id}
            onClick={() => handleCollectSun(sun.id)}
            className="absolute flex items-center justify-center text-4xl cursor-pointer hover:scale-125 transition-transform animate-spin-slow z-30"
            style={{ top: `${(sun.y / GRID_ROWS) * 100}%`, left: `${(sun.x / GRID_COLS) * 100}%`, width: `${100/GRID_COLS}%`, height: `${100/GRID_ROWS}%` }}
          >
            <div className="bg-yellow-200 rounded-full w-10 h-10 flex items-center justify-center shadow-[0_0_15px_#facc15] text-yellow-500 font-bold border-2 border-yellow-400">
              {sun.value}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
