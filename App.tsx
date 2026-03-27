import React, { useState } from 'react';
import GameView from './components/GameView';
import AlmanacView from './components/AlmanacView';
import { GameMode } from './types';
import { Play, Book, Skull } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'MENU' | 'GAME' | 'ALMANAC'>('MENU');
  const [selectedMode, setSelectedMode] = useState<GameMode>('ADVENTURE');

  if (view === 'GAME') {
    return <GameView mode={selectedMode} onExit={() => setView('MENU')} />;
  }

  if (view === 'ALMANAC') {
    return <AlmanacView onBack={() => setView('MENU')} />;
  }

  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-stone-900 flex flex-col items-center justify-center text-white font-sans p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-800 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tighter mb-4">
          FLORA VS. UNDEAD
        </h1>
        <p className="text-2xl text-stone-400 tracking-widest uppercase font-bold">The Ultimate Defense Update</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md">
        
        <div className="bg-stone-800 p-6 rounded-2xl border border-stone-700 shadow-2xl">
          <h2 className="text-xl font-bold text-stone-400 mb-4 text-center uppercase">Select Game Mode</h2>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setSelectedMode('ADVENTURE')}
              className={`p-4 rounded-xl border-2 transition-all font-bold flex justify-between items-center ${selectedMode === 'ADVENTURE' ? 'border-green-500 bg-green-900/50 text-white' : 'border-stone-600 text-stone-400 hover:bg-stone-700'}`}
            >
              <span>Adventure Mode</span>
              <span className="text-xs bg-stone-950 px-2 py-1 rounded">60s Waves</span>
            </button>
            <button 
              onClick={() => setSelectedMode('TURBO')}
              className={`p-4 rounded-xl border-2 transition-all font-bold flex justify-between items-center ${selectedMode === 'TURBO' ? 'border-yellow-500 bg-yellow-900/50 text-white' : 'border-stone-600 text-stone-400 hover:bg-stone-700'}`}
            >
              <span>Turbo Rush</span>
              <span className="text-xs bg-stone-950 px-2 py-1 rounded">20s Waves</span>
            </button>
            <button 
              onClick={() => setSelectedMode('SUDDEN_DEATH')}
              className={`p-4 rounded-xl border-2 transition-all font-bold flex justify-between items-center ${selectedMode === 'SUDDEN_DEATH' ? 'border-red-500 bg-red-900/50 text-white' : 'border-stone-600 text-stone-400 hover:bg-stone-700'}`}
            >
              <span>Sudden Death</span>
              <span className="text-xs bg-stone-950 px-2 py-1 rounded">Hardcore Mobs</span>
            </button>
          </div>
          
          <button 
            onClick={() => setView('GAME')}
            className="w-full mt-6 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white text-3xl font-black py-6 rounded-xl shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 transition-all uppercase tracking-wider"
          >
            <Play fill="currentColor" size={32} /> Play Now
          </button>
        </div>

        <button 
          onClick={() => setView('ALMANAC')}
          className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white text-xl font-bold py-5 rounded-2xl shadow flex items-center justify-center gap-3 transition-colors"
        >
          <Book size={24} /> Suburban Almanac
        </button>

      </div>
      
      <div className="absolute bottom-4 text-stone-600 font-bold text-sm">
        v2.0 • 60FPS Engine • Audio Synth Enabled
      </div>
    </div>
  );
}
