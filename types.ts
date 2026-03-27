export type PlantType = 
  | 'PEASHOOTER' | 'SUNFLOWER' | 'CHERRY_BOMB' | 'WALLNUT' | 'POTATO_MINE' 
  | 'CHOMPER' | 'REPEATER' | 'SQUASH' | 'JALAPENO' | 'TALLNUT' 
  | 'TWIN_SUNFLOWER' | 'GATLING_PEA' | 'MELON_PULT' | 'WINTER_MELON' 
  | 'LASER_BEAN' | 'PUFF_SHROOM' | 'THREEPEATER' | 'MAGNET_SHROOM' 
  | 'SPIKEWEED' | 'TORCHWOOD' | 'BLUE_TORCHWOOD';

export type ZombieType = 
  | 'BASIC' | 'CONEHEAD' | 'BUCKETHEAD' | 'READER' | 'FLAG' | 'FOOTBALL' 
  | 'ZOMBONI' | 'GARGANTUAR' | 'DANCING' | 'SCREEN_DOOR' | 'PHANTOM' 
  | 'NECROMANCER' | 'JUMPER' | 'MUTANT';

export type GameMode = 'ADVENTURE' | 'TURBO' | 'SUDDEN_DEATH';

export interface PlantStats {
  id: PlantType;
  name: string;
  cost: number;
  hp: number;
  maxHp: number;
  damage: number;
  fireRate: number; // Seconds between shots
  cooldown: number; // Seconds before you can plant again
  description: string;
  icon: string;
  isInstaKill?: boolean;
}

export interface ZombieStats {
  id: ZombieType;
  name: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number; // DPS
  description: string;
  icon: string;
  shieldHp?: number;
}

export interface Projectile {
  id: string;
  row: number;
  x: number;
  damage: number;
  speed: number;
  isFreeze?: boolean;
  isSplash?: boolean;
  isLaser?: boolean;
  isFire?: boolean;
  isBlueFire?: boolean;
  icon: string;
}

export interface PlantInstance {
  id: string;
  row: number;
  col: number;
  type: PlantType;
  hp: number;
  lastFired: number;
  state: 'NORMAL' | 'ARMING' | 'DIGESTING' | 'EXPLODING';
  stateTimer: number;
}

export interface ZombieInstance {
  id: string;
  row: number;
  x: number;
  type: ZombieType;
  hp: number;
  shieldHp: number;
  speedMultiplier: number; // For freeze or enrage
  state: 'NORMAL' | 'ETHEREAL' | 'EATING' | 'DANCING';
  stateTimer: number;
  lastBite: number;
  lastAbility: number;
}

export interface Sun {
  id: string;
  x: number;
  y: number;
  targetY: number;
  value: number;
  createdAt: number;
}

export interface Lawnmower {
  row: number;
  x: number;
  active: boolean;
}

export interface GameState {
  mode: GameMode;
  sun: number;
  plants: PlantInstance[];
  zombies: ZombieInstance[];
  projectiles: Projectile[];
  suns: Sun[];
  lawnmowers: Lawnmower[];
  wave: number;
  zombiesToSpawn: ZombieType[];
  timeUntilNextWave: number;
  timeUntilNextSun: number;
  seedCooldowns: Record<PlantType, number>;
  isGameOver: boolean;
  isVictory: boolean;
  gameTime: number;
}
