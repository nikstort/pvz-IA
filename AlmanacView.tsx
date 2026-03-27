import React, { useState } from 'react';
import { PLANTS, ZOMBIES } from '../constants';
import { PlantStats, ZombieStats } from '../types';
import { ArrowLeft, Sword, Shield, Zap, Activity } from 'lucide-react';

export default function AlmanacView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'plants' | 'zombies'>('plants');
  const [selectedPlant, setSelectedPlant] = useState<PlantStats | null>(null);
  const [selectedZombie, setSelectedZombie] = useState<ZombieStats | null>(null);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200 font-sans p-8 flex flex-col">
      <div className="flex justify-between items-center mb-8 bg-stone-800 p-4 rounded-xl border-2 border-stone-700 shadow-xl">
        <button onClick={onBack} className="flex items-center gap-2 hover:text-green-400 font-bold text-xl">
          <ArrowLeft /> Menu
        </button>
        <h1 className="text-4xl font-black text-center text-green-500 tracking-wider font-mono uppercase">
          Suburban Almanac
        </h1>
        <div className="w-24"></div>
      </div>

      <div className="flex gap-4 mb-8 justify-center">
        <button 
          onClick={() => setTab('plants')}
          className={`px-8 py-3 rounded-xl font-bold text-xl transition-colors ${tab === 'plants' ? 'bg-green-600 text-white' : 'bg-stone-800 hover:bg-stone-700'}`}
        >
          🌱 Plants
        </button>
        <button 
          onClick={() => setTab('zombies')}
          className={`px-8 py-3 rounded-xl font-bold text-xl transition-colors ${tab === 'zombies' ? 'bg-purple-600 text-white' : 'bg-stone-800 hover:bg-stone-700'}`}
        >
          🧟 Zombies
        </button>
      </div>

      <div className="flex flex-1 gap-8 max-w-6xl mx-auto w-full">
        {/* Grid List */}
        <div className="w-2/3 bg-stone-800 p-6 rounded-xl border-2 border-stone-700 overflow-y-auto max-h-[70vh] shadow-inner">
          <div className="grid grid-cols-5 gap-4">
            {tab === 'plants' ? (
              Object.values(PLANTS).map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setSelectedPlant(p)}
                  className={`aspect-square bg-stone-700 rounded-lg flex flex-col items-center justify-center hover:scale-105 hover:bg-green-800 transition-all border-2 ${selectedPlant?.id === p.id ? 'border-green-400' : 'border-transparent'}`}
                >
                  <span className="text-4xl mb-2">{p.icon}</span>
                  <span className="text-xs font-bold text-center px-1">{p.name}</span>
                </button>
              ))
            ) : (
              Object.values(ZOMBIES).map(z => (
                <button 
                  key={z.id} 
                  onClick={() => setSelectedZombie(z)}
                  className={`aspect-square bg-stone-700 rounded-lg flex flex-col items-center justify-center hover:scale-105 hover:bg-purple-800 transition-all border-2 ${selectedZombie?.id === z.id ? 'border-purple-400' : 'border-transparent'}`}
                >
                  <span className="text-4xl mb-2">{z.icon}</span>
                  <span className="text-xs font-bold text-center px-1">{z.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-1/3 bg-stone-800 p-6 rounded-xl border-2 border-stone-700 shadow-xl flex flex-col relative overflow-hidden">
          {tab === 'plants' && selectedPlant ? (
            <div className="animate-fade-in">
              <div className="text-8xl text-center mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">{selectedPlant.icon}</div>
              <h2 className="text-3xl font-black mb-4 text-green-400 border-b border-stone-600 pb-2">{selectedPlant.name}</h2>
              
              <div className="space-y-4 text-lg">
                <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                  <span className="text-yellow-400 font-bold flex items-center gap-2">☀️ Sun Cost</span>
                  <span className="font-mono text-xl">{selectedPlant.cost}</span>
                </div>
                <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                  <span className="text-red-400 font-bold flex items-center gap-2"><Sword size={20}/> Damage</span>
                  <span className="font-mono text-xl">{selectedPlant.damage} {selectedPlant.isInstaKill && '(Insta)'}</span>
                </div>
                <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                  <span className="text-blue-400 font-bold flex items-center gap-2"><Shield size={20}/> Toughness</span>
                  <span className="font-mono text-xl">{selectedPlant.maxHp} HP</span>
                </div>
                <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                  <span className="text-purple-400 font-bold flex items-center gap-2"><Zap size={20}/> Recharge</span>
                  <span className="font-mono text-xl">{selectedPlant.cooldown}s</span>
                </div>
              </div>
              <p className="mt-6 text-stone-300 italic text-center p-4 bg-stone-900 rounded-lg border border-stone-700">"{selectedPlant.description}"</p>
            </div>
          ) : tab === 'zombies' && selectedZombie ? (
            <div className="animate-fade-in">
              <div className="text-8xl text-center mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">{selectedZombie.icon}</div>
              <h2 className="text-3xl font-black mb-4 text-purple-400 border-b border-stone-600 pb-2">{selectedZombie.name}</h2>
              
              <div className="space-y-4 text-lg">
                <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                  <span className="text-blue-400 font-bold flex items-center gap-2"><Shield size={20}/> Toughness</span>
                  <span className="font-mono text-xl">{selectedZombie.maxHp} HP</span>
                </div>
                {selectedZombie.shieldHp && (
                  <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                    <span className="text-cyan-400 font-bold flex items-center gap-2"><Shield size={20}/> Armor/Shield</span>
                    <span className="font-mono text-xl">+{selectedZombie.shieldHp} HP</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-stone-700 p-3 rounded">
                  <span className="text-green-400 font-bold flex items-center gap-2"><Activity size={20}/> Speed</span>
                  <span className="font-mono text-xl">{selectedZombie.speed.toFixed(2)}x</span>
                </div>
              </div>
              <p className="mt-6 text-stone-300 italic text-center p-4 bg-stone-900 rounded-lg border border-stone-700">"{selectedZombie.description}"</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-500 text-xl font-bold text-center">
              Select a {tab.slice(0, -1)} to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
