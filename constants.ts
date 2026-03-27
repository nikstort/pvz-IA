import { PlantStats, ZombieStats } from './types';

export const GRID_ROWS = 6;
export const GRID_COLS = 13;
export const CELL_SIZE = 80; // For internal positioning scaling

export const PLANTS: Record<string, PlantStats> = {
  PEASHOOTER: { id: 'PEASHOOTER', name: 'Peashooter', cost: 100, hp: 300, maxHp: 300, damage: 20, fireRate: 1.5, cooldown: 7.5, description: 'Shoots peas at attackers.', icon: '🌱' },
  SUNFLOWER: { id: 'SUNFLOWER', name: 'Sunflower', cost: 50, hp: 300, maxHp: 300, damage: 0, fireRate: 24.0, cooldown: 7.5, description: 'Gives additional sun (50).', icon: '🌻' },
  CHERRY_BOMB: { id: 'CHERRY_BOMB', name: 'Cherry Bomb', cost: 150, hp: 300, maxHp: 300, damage: 1800, fireRate: 0, cooldown: 50.0, description: 'Blows up zombies in a 3x3 area.', icon: '🍒', isInstaKill: true },
  WALLNUT: { id: 'WALLNUT', name: 'Wall-nut', cost: 50, hp: 4000, maxHp: 4000, damage: 0, fireRate: 0, cooldown: 30.0, description: 'Blocks zombies and protects plants.', icon: '🌰' },
  POTATO_MINE: { id: 'POTATO_MINE', name: 'Potato Mine', cost: 25, hp: 300, maxHp: 300, damage: 1800, fireRate: 0, cooldown: 30.0, description: 'Explodes on contact, but takes 14s to arm.', icon: '🥔', isInstaKill: true },
  CHOMPER: { id: 'CHOMPER', name: 'Chomper', cost: 150, hp: 300, maxHp: 300, damage: 9999, fireRate: 40.0, cooldown: 7.5, description: 'Eats a zombie whole, but takes 40s to chew.', icon: '👾', isInstaKill: true },
  REPEATER: { id: 'REPEATER', name: 'Repeater', cost: 200, hp: 300, maxHp: 300, damage: 20, fireRate: 1.5, cooldown: 7.5, description: 'Fires two peas at once.', icon: '🌿' },
  SQUASH: { id: 'SQUASH', name: 'Squash', cost: 50, hp: 300, maxHp: 300, damage: 1800, fireRate: 0, cooldown: 30.0, description: 'Crushes the first zombie that approaches it.', icon: '🍐', isInstaKill: true },
  JALAPENO: { id: 'JALAPENO', name: 'Jalapeno', cost: 125, hp: 300, maxHp: 300, damage: 1800, fireRate: 0, cooldown: 50.0, description: 'Destroys an entire lane of zombies.', icon: '🌶️', isInstaKill: true },
  TALLNUT: { id: 'TALLNUT', name: 'Tall-nut', cost: 125, hp: 8000, maxHp: 8000, damage: 0, fireRate: 0, cooldown: 30.0, description: 'Heavy duty wall that cannot be vaulted over.', icon: '🥜' },
  TWIN_SUNFLOWER: { id: 'TWIN_SUNFLOWER', name: 'Twin Sunflower', cost: 150, hp: 300, maxHp: 300, damage: 0, fireRate: 24.0, cooldown: 50.0, description: 'Gives twice as much sun (100).', icon: '🏵️' },
  GATLING_PEA: { id: 'GATLING_PEA', name: 'Gatling Pea', cost: 250, hp: 300, maxHp: 300, damage: 20, fireRate: 1.5, cooldown: 50.0, description: 'Fires four peas at once.', icon: '🔫' },
  MELON_PULT: { id: 'MELON_PULT', name: 'Melon-pult', cost: 300, hp: 300, maxHp: 300, damage: 80, fireRate: 3.0, cooldown: 7.5, description: 'Lobs heavy melons doing massive damage to groups.', icon: '🍉' },
  WINTER_MELON: { id: 'WINTER_MELON', name: 'Winter Melon', cost: 500, hp: 300, maxHp: 300, damage: 80, fireRate: 3.0, cooldown: 50.0, description: 'Lobs freezing melons that damage and slow enemies.', icon: '🧊' },
  LASER_BEAN: { id: 'LASER_BEAN', name: 'Laser Bean', cost: 200, hp: 300, maxHp: 300, damage: 40, fireRate: 3.0, cooldown: 7.5, description: 'Fires a laser that pierces all zombies in a row.', icon: '🛸' },
  PUFF_SHROOM: { id: 'PUFF_SHROOM', name: 'Puff-shroom', cost: 0, hp: 300, maxHp: 300, damage: 20, fireRate: 1.5, cooldown: 7.5, description: 'Free short-range attacker.', icon: '🍄' },
  THREEPEATER: { id: 'THREEPEATER', name: 'Threepeater', cost: 325, hp: 300, maxHp: 300, damage: 20, fireRate: 1.5, cooldown: 7.5, description: 'Shoots peas in 3 adjacent lanes.', icon: '🍀' },
  MAGNET_SHROOM: { id: 'MAGNET_SHROOM', name: 'Magnet-shroom', cost: 100, hp: 300, maxHp: 300, damage: 0, fireRate: 15.0, cooldown: 7.5, description: 'Removes helmets and shields from a zombie periodically.', icon: '🧲' },
  SPIKEWEED: { id: 'SPIKEWEED', name: 'Spikeweed', cost: 100, hp: 300, maxHp: 300, damage: 10, fireRate: 1.0, cooldown: 7.5, description: 'Hurts zombies that walk over it. Immune to standard bites.', icon: '🌵' },
  TORCHWOOD: { id: 'TORCHWOOD', name: 'Torchwood', cost: 175, hp: 300, maxHp: 300, damage: 0, fireRate: 0, cooldown: 7.5, description: 'Doubles the damage of peas passing through it.', icon: '🔥' },
  BLUE_TORCHWOOD: { id: 'BLUE_TORCHWOOD', name: 'Blue Torchwood', cost: 250, hp: 300, maxHp: 300, damage: 0, fireRate: 0, cooldown: 7.5, description: 'Triples the damage of peas passing through it.', icon: '☄️' }
};

export const ZOMBIES: Record<string, ZombieStats> = {
  BASIC: { id: 'BASIC', name: 'Zombie', hp: 200, maxHp: 200, speed: 0.2, damage: 100, description: 'Regular garden-variety zombie.', icon: '🧟' },
  CONEHEAD: { id: 'CONEHEAD', name: 'Conehead', hp: 560, maxHp: 560, speed: 0.2, damage: 100, description: 'His traffic cone provides twice as much toughness.', icon: '🧟‍♂️' },
  BUCKETHEAD: { id: 'BUCKETHEAD', name: 'Buckethead', hp: 1300, maxHp: 1300, speed: 0.2, damage: 100, description: 'His bucket makes him extremely resilient.', icon: '🪣' },
  READER: { id: 'READER', name: 'Reader', hp: 350, maxHp: 350, speed: 0.2, damage: 100, description: 'Reads paper. Gets enraged (faster) when paper is destroyed.', icon: '📰' },
  FLAG: { id: 'FLAG', name: 'Flag Zombie', hp: 200, maxHp: 200, speed: 0.3, damage: 100, description: 'Marks the arrival of a huge "wave" of zombies.', icon: '🚩' },
  FOOTBALL: { id: 'FOOTBALL', name: 'Football Zombie', hp: 1600, maxHp: 1600, speed: 0.4, damage: 100, description: 'Tough and fast gear provides heavy defense.', icon: '🏈' },
  ZOMBONI: { id: 'ZOMBONI', name: 'Zomboni', hp: 1350, maxHp: 1350, speed: 0.25, damage: 9999, description: 'Crushes plants instantly, immune to normal freeze/slow.', icon: '🚜' },
  GARGANTUAR: { id: 'GARGANTUAR', name: 'Gargantuar', hp: 3000, maxHp: 3000, speed: 0.15, damage: 9999, description: 'A massive beast that smashes plants.', icon: '👹' },
  DANCING: { id: 'DANCING', name: 'Dancing Zombie', hp: 500, maxHp: 500, speed: 0.25, damage: 100, description: 'Summons backup dancers every 5 seconds.', icon: '🕺' },
  SCREEN_DOOR: { id: 'SCREEN_DOOR', name: 'Screen Door Zombie', hp: 200, maxHp: 200, shieldHp: 1100, speed: 0.2, damage: 100, description: 'Door protects him from direct peas. Weak to splash/lasers.', icon: '🚪' },
  PHANTOM: { id: 'PHANTOM', name: 'Phantom', hp: 400, maxHp: 400, speed: 0.2, damage: 100, description: 'Ethereal (invulnerable) for the first 5 seconds.', icon: '👻' },
  NECROMANCER: { id: 'NECROMANCER', name: 'Necromancer', hp: 600, maxHp: 600, speed: 0.15, damage: 100, description: 'Periodically summons basic zombies around him.', icon: '🧙' },
  JUMPER: { id: 'JUMPER', name: 'Jumper', hp: 450, maxHp: 450, speed: 0.3, damage: 100, description: 'Teleports forward a few tiles periodically to skip defenses.', icon: '🦘' },
  MUTANT: { id: 'MUTANT', name: 'Mutant Behemoth', hp: 4000, maxHp: 4000, speed: 0.1, damage: 9999, description: 'Enrages at 50% HP and triples its speed.', icon: '🦖' }
};

export const FALLING_SUN_VALUE = 50; // Was 25, requested to be 50
export const STANDARD_WAVE_INTERVAL = 60000; // 1 minute in ms
export const TURBO_WAVE_INTERVAL = 20000; // 20s in ms
