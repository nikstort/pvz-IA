import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, PlantInstance, ZombieInstance, Projectile, Sun, Lawnmower, ZombieType, PlantType } from '../types';
import { PLANTS, ZOMBIES, FIBONACCI_WAVES } from '../constants';
import { audio } from '../utils/audio';

const TICK_RATE = 16; // ms for ~60fps
const CELL_WIDTH = 80; // virtual pixels

const createLawnmowers = () => Array.from({ length: 6 }).map((_, i) => ({ row: i, x: 0, active: false, used: false }));

import { GameMode } from '../types';

export function useGameEngine(mode: GameMode = 'day') {
  const [state, setState] = useState<GameState>({
    suns: [],
    sunCount: mode === 'survival' ? 200 : 50,
    plants: [],
    zombies: [],
    projectiles: [],
    lawnmowers: createLawnmowers(),
    wave: 0,
    waveTimer: 60000, // 1 minute initially
    gameOver: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const lastTickRef = useRef(Date.now());

  const addSun = useCallback((amount: number) => {
    setState(s => ({ ...s, sunCount: s.sunCount + amount }));
  }, []);

  const collectSun = useCallback((id: string) => {
    const sun = stateRef.current.suns.find(s => s.id === id);
    if (sun) {
      addSun(sun.value);
      setState(s => ({ ...s, suns: s.suns.filter(su => su.id !== id) }));
    }
  }, [addSun]);

  const plantSeed = useCallback((type: PlantType, row: number, col: number) => {
    const config = PLANTS[type];
    const s = stateRef.current;
    if (s.sunCount >= config.cost && !s.plants.some(p => p.row === row && p.col === col)) {
      const newPlant: PlantInstance = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        row,
        col,
        hp: config.hp,
        maxHp: config.hp,
        state: type === 'potato-mine' ? 'idle' : 'ready',
        lastAction: Date.now(),
        spawnTime: Date.now(),
      };
      setState(prev => ({
        ...prev,
        sunCount: prev.sunCount - config.cost,
        plants: [...prev.plants, newPlant]
      }));
      return true;
    }
    return false;
  }, []);

  const removePlant = useCallback((id: string) => {
    setState(prev => {
      const plant = prev.plants.find(p => p.id === id);
      if (!plant) return prev;
      const config = PLANTS[plant.type];
      return {
        ...prev,
        sunCount: prev.sunCount + config.cost,
        plants: prev.plants.filter(p => p.id !== id)
      };
    });
  }, []);

  useEffect(() => {
    if (stateRef.current.gameOver) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      
      setState(prev => {
        if (prev.gameOver) return prev;
        
        const next = { ...prev };
        let newZombies = [...next.zombies];
        let newPlants = [...next.plants];
        let newProjectiles = [...next.projectiles];
        let newSuns = [...next.suns];
        let newLawnmowers = [...next.lawnmowers];
        
        // Spawn Sun (scaled by dt) only in day/survival modes
        if (mode !== 'night' && Math.random() < 0.02 * (dt / 100)) {
          newSuns.push({
            id: Math.random().toString(),
            x: Math.random() * 10,
            y: -1,
            targetY: Math.random() * 5,
            value: 25,
            isFalling: true,
            spawnTime: now
          });
        }
        
        // Update Suns
        newSuns = newSuns.filter(s => now - s.spawnTime < 15000);
        newSuns.forEach(s => {
          if (s.isFalling && s.y < (s.targetY || 5)) {
            s.y += dt / 1000;
          }
        });

        // Wave Logic
        next.waveTimer -= dt;
        if (next.waveTimer <= 0) {
          const waveSize = FIBONACCI_WAVES[Math.min(next.wave, FIBONACCI_WAVES.length - 1)];
          next.wave += 1;
          next.waveTimer = mode === 'survival' ? 25000 : 60000; // Exactamente 1 minuto, o 25s en survival
          
          for (let i = 0; i < (mode === 'survival' ? waveSize * 2 : waveSize); i++) {
            const types: ZombieType[] = ['basic'];
            if (next.wave > 2) types.push('conehead');
            if (next.wave > 4) types.push('buckethead', 'reader');
            if (next.wave > 5) types.push('screen-door', 'dancing', 'phantom', 'necromancer', 'jumper');
            if (next.wave > 7) types.push('zomboni');
            if (next.wave > 8) types.push('gargantuar', 'behemoth');
            
            const isFlag = i === 0 && next.wave % 3 === 0;
            const chosenType = isFlag ? 'flag' : types[Math.floor(Math.random() * types.length)];
            const zConfig = ZOMBIES[chosenType];
            
            newZombies.push({
              id: Math.random().toString(),
              type: chosenType,
              row: Math.floor(Math.random() * 6),
              x: 13 + Math.random() * 2,
              hp: zConfig.hp,
              maxHp: zConfig.hp,
              shieldHp: zConfig.shieldHp || 0,
              maxShieldHp: zConfig.shieldHp || 0,
              speed: zConfig.speed,
              frozen: 0,
              ethereal: chosenType === 'phantom' ? now + 5000 : 0,
              lastAction: now,
              state: 'walking'
            });
          }
        }

        // Projectiles
        newProjectiles = newProjectiles.filter(proj => {
          const startX = proj.id.split('-')[1] ? parseFloat(proj.id.split('-')[1]) : proj.x;
          proj.x += (dt / 1000) * 5; // speed
          
          if (proj.x > 14) return false;
          if (proj.type === 'fume' && proj.x > startX + 4) return false;
          
          const hitZombies = newZombies.filter(z => z.row === proj.row && z.x <= proj.x + 0.8 && z.x >= proj.x - 0.8 && z.hp > 0 && now > z.ethereal);
          if (hitZombies.length > 0) {
            if (proj.type === 'laser' || proj.type === 'fume') {
               // piercing: deals damage and keeps going, but we must ensure we don't damage same zombie multiple times per frame
               // for simplicity, we apply damage and let the projectile live. Since dt is small, it applies damage every tick it's overlapping!
               // To avoid instakill from overlap, we only apply small damage per tick or we destroy and spawn instantly?
               // Actually, `laser` wasn't doing damage before. Let's make piercing projectiles apply a fraction of damage per tick OR we can track hit zombies.
               // Simpler: a laser does its full damage on spawn, applying to ALL zombies in lane, then doesn't use the projectile system, OR projectile is visual only!
               // But currently projectile has speed. If it's a moving projectile:
               hitZombies.forEach(z => {
                  z.hp -= proj.damage * (dt / 100); // apply over time while overlapping, or just simple flat damage
                  audio.hit();
               });
            } else if (proj.splash) {
               // Splash damage logic
               newZombies.forEach(z => {
                 if (Math.abs(z.row - proj.row) <= 1 && Math.abs(z.x - proj.x) <= 1.5 && now > z.ethereal) {
                   z.hp -= proj.damage * (z.row === proj.row ? 1 : 0.5);
                   if (proj.freeze) z.frozen = now + 10000;
                 }
               });
               return false;
            } else {
              // Direct hit
              const z = hitZombies[0];
              if (z.shieldHp > 0) {
                z.shieldHp -= proj.damage;
              } else {
                z.hp -= proj.damage;
              }
              if (proj.freeze) z.frozen = now + 10000;
              audio.hit();
              return false;
            }
          }
          return true;
        });

        // Plants
        newPlants = newPlants.filter(p => {
          if (p.hp <= 0) return false;
          const config = PLANTS[p.type];
          
          if (p.type === 'sunflower' && now - p.lastAction > config.recharge) {
            newSuns.push({ id: Math.random().toString(), x: p.col, y: p.row, value: 50, isFalling: false, spawnTime: now });
            p.lastAction = now;
          } else if (p.type === 'sun-shroom' && now - p.lastAction > config.recharge) {
            const isGrown = now - p.spawnTime > 120000;
            newSuns.push({ id: Math.random().toString(), x: p.col, y: p.row, value: isGrown ? 50 : 15, isFalling: false, spawnTime: now });
            p.lastAction = now;
          } else if (p.type === 'twin-sunflower' && now - p.lastAction > config.recharge) {
            newSuns.push({ id: Math.random().toString(), x: p.col, y: p.row, value: 100, isFalling: false, spawnTime: now });
            p.lastAction = now;
          } else if (p.type === 'potato-mine') {
            if (p.state === 'idle' && now - p.spawnTime > 14000) p.state = 'armed';
            if (p.state === 'armed') {
              const target = newZombies.find(z => z.row === p.row && Math.abs(z.x - p.col) < 0.8 && now > z.ethereal);
              if (target) {
                target.hp -= 1800;
                return false;
              }
            }
          } else if (p.type === 'squash') {
            const target = newZombies.find(z => z.row === p.row && z.x >= p.col - 0.5 && z.x <= p.col + 1.5 && now > z.ethereal);
            if (target) {
              target.hp -= 1800;
              return false;
            }
          } else if (p.type === 'chomper') {
            if (p.state === 'ready') {
              const target = newZombies.find(z => z.row === p.row && z.x >= p.col && z.x <= p.col + 1.5 && z.type !== 'gargantuar' && z.type !== 'behemoth' && now > z.ethereal);
              if (target) {
                target.hp = 0;
                p.state = 'digesting';
                p.digestTimer = now + 40000;
              } else {
                const heavy = newZombies.find(z => z.row === p.row && z.x >= p.col && z.x <= p.col + 1.5 && now > z.ethereal);
                if (heavy && now - p.lastAction > 1500) {
                  heavy.hp -= 40;
                  p.lastAction = now;
                }
              }
            } else if (p.state === 'digesting' && p.digestTimer && now > p.digestTimer) {
              p.state = 'ready';
            }
          } else if (['peashooter', 'snow-pea', 'repeater', 'gatling-pea', 'melon-pult', 'winter-melon', 'laser-bean', 'threepeater', 'puff-shroom', 'fume-shroom', 'scaredy-shroom'].includes(p.type)) {
            // Shooters
            const hasTarget = newZombies.some(z => 
              (z.row === p.row || (p.type === 'threepeater' && Math.abs(z.row - p.row) <= 1)) 
              && z.x > p.col && (['puff-shroom', 'fume-shroom'].includes(p.type) ? z.x <= p.col + 4 : true) && z.hp > 0 && now > z.ethereal
            );
            const zombieClose = newZombies.some(z => z.row === p.row && z.x > p.col - 1 && z.x < p.col + 2 && z.hp > 0);
            
            if (p.type === 'scaredy-shroom' && zombieClose) return true; // Hides
            
            const fireRate = (p.type === 'melon-pult' || p.type === 'winter-melon') ? 3000 : 1500;
            if (hasTarget && now - p.lastAction > fireRate) {
               const fire = (type: Projectile['type'], row: number, x: number) => {
                 newProjectiles.push({
                   id: `${Math.random().toString()}-${x}`, type, row, x, 
                   damage: config.damage || 20, 
                   piercing: type === 'laser' || p.type === 'fume-shroom', splash: type === 'melon' || type === 'winter-melon', freeze: type === 'snow-pea' || type === 'winter-melon'
                 });
               };
               const projType = p.type === 'snow-pea' ? 'snow-pea' : p.type === 'laser-bean' ? 'laser' : p.type === 'melon-pult' ? 'melon' : p.type === 'winter-melon' ? 'winter-melon' : p.type === 'fume-shroom' ? 'fume' : 'pea';
               
               if (p.type === 'threepeater') {
                 if (p.row > 0) fire(projType, p.row - 1, p.col);
                 fire(projType, p.row, p.col);
                 if (p.row < 5) fire(projType, p.row + 1, p.col);
                 audio.shoot();
               } else if (p.type === 'repeater') {
                 fire(projType, p.row, p.col);
                 fire(projType, p.row, p.col - 0.4);
                 audio.shoot();
               } else if (p.type === 'gatling-pea') {
                 fire(projType, p.row, p.col);
                 fire(projType, p.row, p.col - 0.3);
                 fire(projType, p.row, p.col - 0.6);
                 fire(projType, p.row, p.col - 0.9);
                 audio.shoot();
               } else {
                 fire(projType, p.row, p.col);
                 if (p.type !== 'puff-shroom' && p.type !== 'fume-shroom') audio.shoot();
               }
               p.lastAction = now;
            }
          } else if (p.type === 'cherry-bomb') {
            if (now - p.spawnTime > 1000) {
              newZombies.forEach(z => {
                if (Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - p.col) <= 1.5) z.hp -= 1800;
              });
              return false;
            }
          } else if (p.type === 'doom-shroom') {
            if (now - p.spawnTime > 1500) {
              newZombies.forEach(z => {
                if (Math.abs(z.row - p.row) <= 3 && Math.abs(z.x - p.col) <= 4) z.hp -= 1800;
              });
              return false;
            }
          } else if (p.type === 'jalapeno') {
             if (now - p.spawnTime > 1000) {
               newZombies.forEach(z => {
                 if (z.row === p.row) z.hp -= 1800;
               });
               return false;
             }
          } else if (p.type === 'magnet-shroom') {
            if (now - p.lastAction > config.recharge) {
               const target = newZombies.find(z => z.shieldHp > 0 || ['buckethead', 'screen-door', 'all-star'].includes(z.type));
               if (target) {
                 target.shieldHp = 0;
                 if (target.type === 'buckethead') target.type = 'basic';
                 p.lastAction = now;
               }
            }
          }
          return true;
        });

        // Zombies
        let triggerGameOver = false;
        newZombies = newZombies.filter(z => {
          if (z.hp <= 0) return false;
          
          let speedMult = z.frozen > now ? 0.5 : 1;
          if (z.type === 'behemoth' && z.hp < z.maxHp * 0.5) speedMult = 3;

          const myPlants = newPlants.filter(p => p.row === z.row && Math.abs(p.col - z.x) < 0.5);
          const firstPlant = myPlants[0];

          if (z.type === 'jumper' && now - z.lastAction > 6000) {
             z.x -= 2; // Jump forward
             z.lastAction = now;
          } else if (z.type === 'dancing' && now - z.lastAction > 5000) {
             z.lastAction = now;
             // Spawn backup
             [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dx]) => {
                const r = z.row + dr;
                if (r >= 0 && r <= 5) {
                   newZombies.push({
                     id: Math.random().toString(), type: 'basic', row: r, x: z.x + dx, hp: 200, maxHp: 200, shieldHp: 0, maxShieldHp: 0, speed: 20, frozen: 0, ethereal: 0, lastAction: now, state: 'walking'
                   });
                }
             });
          } else if (z.type === 'necromancer' && now - z.lastAction > 10000) {
             z.lastAction = now;
             for(let i=0; i<2; i++) {
               newZombies.push({
                 id: Math.random().toString(), type: 'basic', row: Math.floor(Math.random() * 6), x: 13, hp: 200, maxHp: 200, shieldHp: 0, maxShieldHp: 0, speed: 20, frozen: 0, ethereal: 0, lastAction: now, state: 'walking'
               });
             }
          }

          if (firstPlant && firstPlant.type !== 'spikeweed') {
            z.state = 'eating';
            if (z.type === 'zomboni' || z.type === 'gargantuar') {
              firstPlant.hp = 0; // Instakill
            } else {
              firstPlant.hp -= (z.type === 'behemoth' ? 200 : 100) * (dt / 1000);
            }
          } else {
            z.state = 'walking';
            z.x -= (z.speed * speedMult * (dt / 1000)) / CELL_WIDTH;
          }

          // Spikeweed logic
          const spikeweed = newPlants.find(p => p.type === 'spikeweed' && p.row === z.row && Math.abs(p.col - z.x) < 0.5);
          if (spikeweed) {
             if (z.type === 'zomboni') {
               spikeweed.hp = 0;
               z.hp = 0;
             } else {
               z.hp -= 20 * (dt / 1000);
             }
          }

          if (z.x < 0) {
            const mower = newLawnmowers[z.row];
            if (mower && !mower.used) {
              mower.active = true;
            } else if (z.x < -1) {
              triggerGameOver = true;
            }
          }
          return z.hp > 0;
        });

        // Update Lawnmowers
        newLawnmowers.forEach(m => {
          if (m.active) {
            m.x += (dt / 1000) * 8; // Move fast
            newZombies.forEach(z => {
              if (z.row === m.row && z.x <= m.x + 0.5 && z.x >= m.x - 0.5) z.hp = 0;
            });
            if (m.x > 14) {
              m.active = false;
              m.used = true;
            }
          }
        });

        next.zombies = newZombies;
        next.plants = newPlants;
        next.projectiles = newProjectiles;
        next.suns = newSuns;
        next.lawnmowers = newLawnmowers;
        next.gameOver = triggerGameOver;

        return next;
      });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, []);

  return { state, plantSeed, removePlant, collectSun };
}
