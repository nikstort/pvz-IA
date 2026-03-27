# Flora vs. Undead - Game Documentation

## Introduction
Welcome to **Flora vs. Undead**, a complete overhaul and expansive update of the beloved garden-defense genre, fully built in React utilizing an advanced 60-FPS custom DOM engine.

## File Architecture and System Explanations

1. **`src/types.ts`**: The backbone of the game. Defines all structural interfaces including `GameState`, `PlantStats`, `ZombieStats`, and types like `PlantType` and `ZombieType`. It ensures type safety across the application.
2. **`src/constants.ts`**: Acts as the game's database. Contains exact numeric values for every single plant and zombie (Health, Damage, Speed, Cost, Cooldown). Modifying this file alters the meta of the game. Also stores constants like `STANDARD_WAVE_INTERVAL` (60,000ms = 1 minute).
3. **`src/audio.ts`**: A custom, lightweight Audio Synthesizer utilizing the HTML5 Web Audio API (`AudioContext`). It dynamically generates sound waves for shooting (sine), sun dropping (triangle), splats (square), and chomping (sawtooth). This allows the game to have full audio without relying on external `.mp3` assets!
4. **`src/engine.ts`**: The core physics and logic simulator. It runs detached from React's rendering lifecycle to calculate math. It exports `createInitialState` and `updateGameState(state, dt)`. This handles the Fibonacci wave generation, collision detection (Zombies vs Plants, Projectiles vs Zombies), Torchwood multiplier math, and movement.
5. **`src/components/GameView.tsx`**: The main playable React component. It uses a `useRef` to hold the `GameState` to prevent React re-renders from slowing down the game logic. It runs a `requestAnimationFrame` loop that calls `updateGameState` and then forcefully triggers a UI update at 60 Frames Per Second. It handles user inputs (clicking to plant, clicking suns, using the shovel).
6. **`src/components/AlmanacView.tsx`**: The Encyclopedia view. Reads data directly from `constants.ts` to display stats, including exact damage numbers, costs, and descriptions of every unit in a visually appealing UI.
7. **`src/App.tsx`**: The router and main menu. Handles navigation between the Game Mode selector, the Almanac, and the actual Game. 

## Mechanics Update

- **Waves (1 Minute Timer):** Waves now operate strictly on a 60-second timer per wave in Adventure mode. The amount of zombies spawned follows a strict **Fibonacci sequence** (1, 1, 2, 3, 5, 8, 13, etc.). The game displays incoming wave numbers and active counts.
- **Sun Value:** Suns falling from the sky now yield exactly **50 energy** (previously 25).
- **The Shovel:** Completely functional. Click the shovel icon, click a planted plant, and receive an instant **100% refund** of its sun cost.
- **Torchwood Mechanics:** Peashooter projectiles passing through a regular Torchwood multiply their damage by **2x** and turn Red. Passing through a Blue Torchwood multiplies damage by **3x** and turns Blue.
- **60 FPS Fidelity:** Moving objects no longer jitter. The game uses a continuous `dt` (Delta Time) loop to calculate precise floating-point positions.

---

## 🌻 Complete Plant List (21 Total)

| Icon | Name | Cost | Recharge | Damage | Description |
|---|---|---|---|---|---|
| 🌱 | Peashooter | 100 | 7.5s | 20 | Shoots peas at attackers. |
| 🌻 | Sunflower | 50 | 7.5s | 0 | Gives additional sun (50). |
| 🍒 | Cherry Bomb | 150 | 50s | 1800 (Insta) | Blows up zombies in a 3x3 area. |
| 🌰 | Wall-nut | 50 | 30s | 0 | High HP (4000). Blocks zombies. |
| 🥔 | Potato Mine | 25 | 30s | 1800 (Insta) | Explodes on contact, takes 14s to arm. |
| 👾 | Chomper | 150 | 7.5s | 9999 (Insta) | Eats a zombie whole, digests for 40s. |
| 🌿 | Repeater | 200 | 7.5s | 20 (x2) | Fires two peas at once. |
| 🍐 | Squash | 50 | 30s | 1800 (Insta) | Crushes the first zombie that approaches it. |
| 🌶️ | Jalapeno | 125 | 50s | 1800 (Insta) | Destroys an entire lane of zombies instantly. |
| 🥜 | Tall-nut | 125 | 30s | 0 | Massive HP (8000). |
| 🏵️ | Twin Sunflower | 150 | 50s | 0 | Gives twice as much sun (100). |
| 🔫 | Gatling Pea | 250 | 50s | 20 (x4) | Fires four peas at once. |
| 🍉 | Melon-pult | 300 | 7.5s | 80 (Splash) | Lobs heavy melons with splash damage. |
| 🧊 | Winter Melon | 500 | 50s | 80 (Splash) | Freezing melons that damage and slow. |
| 🛸 | Laser Bean | 200 | 7.5s | 40 (Pierce) | Laser pierces all zombies in a row (ignores shields). |
| 🍄 | Puff-shroom | 0 | 7.5s | 20 | Free short-range attacker. |
| 🍀 | Threepeater | 325 | 7.5s | 20 (x3 rows) | Shoots peas in 3 adjacent lanes. |
| 🧲 | Magnet-shroom | 100 | 7.5s | 0 | Removes helmets and shields periodically. |
| 🌵 | Spikeweed | 100 | 7.5s | 10 (DPS) | Hurts zombies walking over it. Pops Zomboni tires. |
| 🔥 | Torchwood | 175 | 7.5s | 0 (Buff) | Doubles the damage of peas passing through it. |
| ☄️ | Blue Torchwood | 250 | 7.5s | 0 (Buff) | Triples the damage of peas passing through it. |

---

## 🧟 Complete Zombie List (14 Total)

| Icon | Name | Toughness | Speed | Special Ability |
|---|---|---|---|---|
| 🧟 | Basic Zombie | 200 HP | 0.2 | Normal walking speed. |
| 🧟‍♂️ | Conehead | 560 HP | 0.2 | Extra tough cone. |
| 🪣 | Buckethead | 1300 HP | 0.2 | High resilience. |
| 📰 | Reader | 350 HP | 0.2 | - |
| 🚩 | Flag Zombie | 200 HP | 0.3 | Faster, indicates waves. |
| 🏈 | Football | 1600 HP | 0.4 | Extremely tough and fast. |
| 🚜 | Zomboni | 1350 HP | 0.25 | Destroys plants instantly, immune to normal slow. |
| 👹 | Gargantuar | 3000 HP | 0.15 | Massive beast. Smashing attacks. |
| 🕺 | Dancing Zombie | 500 HP | 0.25 | Summons basic zombies around him every 5s. |
| 🚪 | Screen Door | 200 + 1100 Shield | 0.2 | Door absorbs physical pea damage. |
| 👻 | Phantom | 400 HP | 0.2 | Ethereal (invulnerable) for the first 5 seconds. |
| 🧙 | Necromancer | 600 HP | 0.15 | Summons basic zombies forward periodically. |
| 🦘 | Jumper | 450 HP | 0.3 | Teleports forward to skip defenses. |
| 🦖 | Mutant Behemoth | 4000 HP | 0.1 | Enrages at <50% HP, tripling its speed! |
