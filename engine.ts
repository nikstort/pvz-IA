import { GameState, PlantType, ZombieType, Projectile, PlantInstance, ZombieInstance, Sun, Lawnmower, GameMode } from './types';
import { PLANTS, ZOMBIES, GRID_COLS, GRID_ROWS, FALLING_SUN_VALUE, STANDARD_WAVE_INTERVAL, TURBO_WAVE_INTERVAL } from './constants';
import { playSound } from './audio';

export const createInitialState = (mode: GameMode): GameState => {
  const lawnmowers: Lawnmower[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    lawnmowers.push({ row: r, x: -1, active: false });
  }

  const seedCooldowns: Record<string, number> = {};
  Object.keys(PLANTS).forEach(k => seedCooldowns[k] = 0);

  return {
    mode,
    sun: 50,
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    lawnmowers,
    wave: 0,
    zombiesToSpawn: [],
    timeUntilNextWave: 10, // First wave in 10s
    timeUntilNextSun: 5,
    seedCooldowns,
    isGameOver: false,
    isVictory: false,
    gameTime: 0
  };
};

const getWaveInterval = (mode: GameMode) => mode === 'TURBO' ? TURBO_WAVE_INTERVAL / 1000 : STANDARD_WAVE_INTERVAL / 1000;

const fibonacci = (n: number): number => {
  if (n <= 1) return 1;
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
};

const spawnWave = (state: GameState) => {
  state.wave += 1;
  const numZombies = state.mode === 'SUDDEN_DEATH' ? fibonacci(state.wave + 5) : fibonacci(state.wave);
  
  const pool: ZombieType[] = ['BASIC'];
  if (state.wave > 1) pool.push('CONEHEAD');
  if (state.wave > 2) pool.push('BUCKETHEAD', 'READER');
  if (state.wave > 3) pool.push('SCREEN_DOOR', 'DANCING', 'PHANTOM');
  if (state.wave > 4) pool.push('FOOTBALL', 'ZOMBONI', 'NECROMANCER', 'JUMPER');
  if (state.wave > 5) pool.push('GARGANTUAR', 'MUTANT');

  for (let i = 0; i < numZombies; i++) {
    if (i === 0 && state.wave % 3 === 0) {
      state.zombiesToSpawn.push('FLAG');
    } else {
      const type = pool[Math.floor(Math.random() * pool.length)];
      state.zombiesToSpawn.push(type);
    }
  }
};

export const updateGameState = (state: GameState, dt: number) => {
  if (state.isGameOver || state.isVictory) return;
  
  state.gameTime += dt;

  // Cooldowns
  Object.keys(state.seedCooldowns).forEach(k => {
    if (state.seedCooldowns[k] > 0) {
      state.seedCooldowns[k] = Math.max(0, state.seedCooldowns[k] - dt);
    }
  });

  // Falling Suns
  state.timeUntilNextSun -= dt;
  if (state.timeUntilNextSun <= 0) {
    state.suns.push({
      id: Math.random().toString(),
      x: Math.floor(Math.random() * (GRID_COLS - 2)) + 1,
      y: -1,
      targetY: Math.floor(Math.random() * GRID_ROWS),
      value: FALLING_SUN_VALUE,
      createdAt: state.gameTime
    });
    state.timeUntilNextSun = 10; // Every 10 seconds
  }

  // Waves
  state.timeUntilNextWave -= dt;
  if (state.timeUntilNextWave <= 0) {
    spawnWave(state);
    state.timeUntilNextWave = getWaveInterval(state.mode);
  }

  // Spawn Zombies from queue
  if (state.zombiesToSpawn.length > 0 && Math.random() < 0.02) { // Spread out spawns
    const type = state.zombiesToSpawn.shift()!;
    const stats = ZOMBIES[type];
    state.zombies.push({
      id: Math.random().toString(),
      row: Math.floor(Math.random() * GRID_ROWS),
      x: GRID_COLS,
      type,
      hp: stats.hp,
      shieldHp: stats.shieldHp || 0,
      speedMultiplier: 1,
      state: type === 'PHANTOM' ? 'ETHEREAL' : 'NORMAL',
      stateTimer: type === 'PHANTOM' ? 5 : 0,
      lastBite: 0,
      lastAbility: 0
    });
  }

  // Update Suns
  state.suns.forEach(sun => {
    if (sun.y < sun.targetY) {
      sun.y += dt * 2; // fall speed
    }
  });
  // Despawn old suns
  state.suns = state.suns.filter(s => state.gameTime - s.createdAt < 15);

  // Update Lawnmowers
  state.lawnmowers.forEach(mower => {
    if (mower.active) {
      mower.x += dt * 5;
      // kill zombies
      state.zombies.forEach(z => {
        if (z.row === mower.row && Math.abs(z.x - mower.x) < 1) {
          z.hp = 0;
        }
      });
    } else {
      // Check collision with zombies at the edge
      const edgeZombie = state.zombies.find(z => z.row === mower.row && z.x <= 0);
      if (edgeZombie) {
        mower.active = true;
        playSound('explode');
      }
    }
  });

  // Update Zombies
  state.zombies.forEach(z => {
    const stats = ZOMBIES[z.type];
    
    // State timers
    if (z.stateTimer > 0) {
      z.stateTimer -= dt;
      if (z.stateTimer <= 0) {
        if (z.state === 'ETHEREAL') z.state = 'NORMAL';
      }
    }
    
    // Reset speed multiplier to 1 if not frozen (we use a simple approach here, freeze wears off quickly or is applied per frame by winter melon pool)
    z.speedMultiplier += dt * 0.5;
    if (z.speedMultiplier > 1) z.speedMultiplier = 1;

    if (z.type === 'MUTANT' && z.hp < stats.hp / 2) {
      z.speedMultiplier = 3;
    }

    // Special Abilities
    if (z.type === 'DANCING' && z.state === 'NORMAL') {
      z.lastAbility += dt;
      if (z.lastAbility > 5) {
        z.lastAbility = 0;
        // spawn backups
        [[-1,0], [1,0], [0,-1], [0,1]].forEach(([dr, dx]) => {
          const nr = z.row + dr, nx = z.x + dx;
          if (nr >= 0 && nr < GRID_ROWS && nx > 0 && nx < GRID_COLS) {
            state.zombies.push({
              id: Math.random().toString(), row: nr, x: nx, type: 'BASIC',
              hp: 200, shieldHp: 0, speedMultiplier: 1, state: 'NORMAL', stateTimer: 0, lastBite: 0, lastAbility: 0
            });
          }
        });
      }
    }
    
    if (z.type === 'NECROMANCER' && z.state === 'NORMAL') {
      z.lastAbility += dt;
      if (z.lastAbility > 8) {
         z.lastAbility = 0;
         state.zombies.push({
              id: Math.random().toString(), row: z.row, x: z.x + 1, type: 'BASIC',
              hp: 200, shieldHp: 0, speedMultiplier: 1, state: 'NORMAL', stateTimer: 0, lastBite: 0, lastAbility: 0
         });
      }
    }

    if (z.type === 'JUMPER' && z.state === 'NORMAL') {
       z.lastAbility += dt;
       if (z.lastAbility > 6) {
          z.lastAbility = 0;
          z.x -= 2;
       }
    }

    // Move or Eat
    let eating = false;
    const plantToEat = state.plants.find(p => p.row === z.row && Math.abs(p.col - z.x) < 0.5 && p.type !== 'SPIKEWEED');

    if (plantToEat && z.state !== 'ETHEREAL') {
      eating = true;
      z.state = 'EATING';
      if (state.gameTime - z.lastBite > 1) {
        plantToEat.hp -= stats.damage;
        z.lastBite = state.gameTime;
        playSound('chomp');
      }
    } else {
      z.state = z.state === 'ETHEREAL' ? 'ETHEREAL' : 'NORMAL';
      z.x -= stats.speed * z.speedMultiplier * dt;
    }

    // Game Over Check
    if (z.x < -1) {
      state.isGameOver = true;
    }
  });

  // Filter dead zombies
  state.zombies = state.zombies.filter(z => z.hp > 0);

  // Update Plants
  state.plants.forEach(p => {
    const stats = PLANTS[p.type];
    
    // States
    if (p.state === 'ARMING') {
      p.stateTimer -= dt;
      if (p.stateTimer <= 0) p.state = 'NORMAL';
      return; // Can't act while arming
    }
    if (p.state === 'DIGESTING') {
      p.stateTimer -= dt;
      if (p.stateTimer <= 0) p.state = 'NORMAL';
      return;
    }

    p.lastFired += dt;

    // Actions
    if (p.type === 'SUNFLOWER' || p.type === 'TWIN_SUNFLOWER') {
      if (p.lastFired >= stats.fireRate) {
        p.lastFired = 0;
        state.suns.push({
          id: Math.random().toString(),
          x: p.col,
          y: p.row,
          targetY: p.row + 0.5,
          value: p.type === 'TWIN_SUNFLOWER' ? 100 : 50,
          createdAt: state.gameTime
        });
        playSound('plant');
      }
    } else if (p.type === 'CHERRY_BOMB' || p.type === 'JALAPENO') {
      if (p.lastFired > 1) { // 1 sec delay before explosion
        playSound('explode');
        state.zombies.forEach(z => {
          if (p.type === 'CHERRY_BOMB' && Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - p.col) <= 1.5) {
             z.hp -= stats.damage;
          } else if (p.type === 'JALAPENO' && z.row === p.row) {
             z.hp -= stats.damage;
          }
        });
        p.hp = 0; // kill self
      }
    } else if (p.type === 'POTATO_MINE') {
      const zombieOnTop = state.zombies.find(z => z.row === p.row && Math.abs(z.x - p.col) < 0.5 && z.state !== 'ETHEREAL');
      if (zombieOnTop) {
        playSound('explode');
        zombieOnTop.hp -= stats.damage;
        p.hp = 0;
      }
    } else if (p.type === 'SQUASH') {
      const closeZombie = state.zombies.find(z => z.row === p.row && Math.abs(z.x - p.col) < 1.5 && z.state !== 'ETHEREAL');
      if (closeZombie) {
        playSound('splat');
        closeZombie.hp -= stats.damage;
        p.hp = 0;
      }
    } else if (p.type === 'CHOMPER') {
      const closeZombie = state.zombies.find(z => z.row === p.row && z.x - p.col >= 0 && z.x - p.col < 1.5 && z.type !== 'GARGANTUAR' && z.type !== 'MUTANT' && z.type !== 'ZOMBONI' && z.state !== 'ETHEREAL');
      if (closeZombie && p.state === 'NORMAL') {
        playSound('chomp');
        closeZombie.hp = 0; // Eat it
        p.state = 'DIGESTING';
        p.stateTimer = 40;
      }
    } else if (p.type === 'MAGNET_SHROOM') {
       if (p.lastFired >= stats.fireRate) {
          const shielded = state.zombies.find(z => (z.shieldHp > 0 || z.type === 'BUCKETHEAD' || z.type === 'FOOTBALL') && Math.abs(z.row - p.row) <= 2 && Math.abs(z.x - p.col) <= 3);
          if (shielded) {
             shielded.shieldHp = 0;
             if (shielded.type === 'BUCKETHEAD' || shielded.type === 'FOOTBALL') shielded.type = 'BASIC';
             p.lastFired = 0;
          }
       }
    } else if (p.type === 'SPIKEWEED') {
       const zOnTop = state.zombies.find(z => z.row === p.row && Math.abs(z.x - p.col) < 0.5);
       if (zOnTop) {
          if (p.lastFired > 1) {
             zOnTop.hp -= stats.damage;
             p.lastFired = 0;
          }
          if (zOnTop.type === 'ZOMBONI') {
             zOnTop.hp = 0;
             p.hp = 0;
          }
       }
    } else if (stats.fireRate > 0 && p.type !== 'MAGNET_SHROOM' && p.type !== 'SPIKEWEED') {
      // Shooters
      const hasZombiesInRow = state.zombies.some(z => z.row === p.row && z.x > p.col);
      const isThreepeater = p.type === 'THREEPEATER';
      const hasZombiesIn3Rows = isThreepeater && state.zombies.some(z => Math.abs(z.row - p.row) <= 1 && z.x > p.col);

      if ((hasZombiesInRow || hasZombiesIn3Rows) && p.lastFired >= stats.fireRate) {
        p.lastFired = 0;
        playSound('shoot');
        
        const shootProjectile = (row: number) => {
          if (p.type === 'LASER_BEAN') {
            state.zombies.filter(z => z.row === row && z.x > p.col).forEach(z => z.hp -= stats.damage);
            playSound('splat'); // laser sound
            return; // Laser hits all instantly
          }
          
          let projectilesToShoot = 1;
          if (p.type === 'REPEATER') projectilesToShoot = 2;
          if (p.type === 'GATLING_PEA') projectilesToShoot = 4;
          
          for (let i = 0; i < projectilesToShoot; i++) {
            state.projectiles.push({
              id: Math.random().toString(),
              row,
              x: p.col + (i * -0.2), // stagger them slightly in space so they hit sequentially
              damage: stats.damage,
              speed: p.type === 'MELON_PULT' || p.type === 'WINTER_MELON' ? 4 : 8,
              isFreeze: p.type === 'WINTER_MELON',
              isSplash: p.type === 'MELON_PULT' || p.type === 'WINTER_MELON',
              icon: p.type === 'WINTER_MELON' ? '🧊' : (p.type === 'MELON_PULT' ? '🍉' : (p.type === 'PUFF_SHROOM' ? '🟣' : '🟢'))
            });
          }
        };

        if (isThreepeater) {
          if (p.row > 0) shootProjectile(p.row - 1);
          shootProjectile(p.row);
          if (p.row < GRID_ROWS - 1) shootProjectile(p.row + 1);
        } else {
          shootProjectile(p.row);
        }
      }
    }
  });

  // Filter dead plants
  state.plants = state.plants.filter(p => p.hp > 0);

  // Update Projectiles & Collisions
  state.projectiles.forEach(proj => {
    proj.x += proj.speed * dt;

    // Check Torchwood logic
    const gridX = Math.round(proj.x);
    if (!proj.isFire && !proj.isBlueFire && !proj.isSplash && proj.icon === '🟢') {
      const torch = state.plants.find(p => p.row === proj.row && p.col === gridX && (p.type === 'TORCHWOOD' || p.type === 'BLUE_TORCHWOOD'));
      if (torch) {
        if (torch.type === 'BLUE_TORCHWOOD') {
          proj.isBlueFire = true;
          proj.damage *= 3;
          proj.icon = '🔵';
        } else {
          proj.isFire = true;
          proj.damage *= 2;
          proj.icon = '🔴';
        }
      }
    }

    // Check collision with zombies
    const hitZombie = state.zombies.find(z => z.row === proj.row && Math.abs(z.x - proj.x) < 0.5 && z.state !== 'ETHEREAL');
    
    if (hitZombie) {
      playSound('hit');
      proj.x = 999; // mark for deletion
      
      // Damage Logic
      let damageDealt = proj.damage;
      if (hitZombie.shieldHp > 0 && !proj.isSplash) {
        hitZombie.shieldHp -= damageDealt;
        if (hitZombie.shieldHp < 0) {
           hitZombie.hp += hitZombie.shieldHp; // spill over to health
           hitZombie.shieldHp = 0;
        }
      } else {
        hitZombie.hp -= damageDealt;
      }

      if (proj.isFreeze) hitZombie.speedMultiplier = 0.5;

      if (proj.isSplash) {
        // Splash damage to surrounding cells
        state.zombies.forEach(sz => {
          if (Math.abs(sz.row - proj.row) <= 1 && Math.abs(sz.x - gridX) <= 1.5 && sz !== hitZombie) {
             sz.hp -= (damageDealt / 2);
             if (proj.isFreeze) sz.speedMultiplier = 0.5;
          }
        });
      }
    }
  });

  // Remove dead projectiles
  state.projectiles = state.projectiles.filter(p => p.x < GRID_COLS);
};
