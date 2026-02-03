const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start");
const menuTitle = document.getElementById("menu-title");
const menuSubtitle = document.getElementById("menu-subtitle");
const levelGrid = document.getElementById("level-grid");
const timeEl = document.getElementById("time");
const goldEl = document.getElementById("gold");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const shieldEl = document.getElementById("shield");
const slowEl = document.getElementById("slow");
const swordEl = document.getElementById("sword");
const statusEl = document.getElementById("status");

const state = {
  running: false,
  paused: false,
  levelIndex: 0,
  timeLeft: 60,
  bestTime: null,
};

const keys = new Set();
const pressed = new Set();

const tileSize = 32;
let gradient = null;
const powerupDurations = {
  shield: 6,
  slow: 5,
  sword: 7,
};

const tuning = {
  accel: 6000,
  maxSpeed: 420,
  gravity: 1850,
  jumpVel: 780,
  wallJumpVel: 700,
  wallSlide: 200,
  coyote: 0.18,
  jumpBuffer: 0.16,
  dashSpeed: 980,
  dashTime: 0.16,
  dashCooldown: 0.45,
  sniperChargeRate: 0.7,
  sniperCooldown: 0.8,
  bulletSpeed: 760,
  launcherCooldown: 3.0,
  launcherCooldownJitter: 1.5,
  rocketSpeed: 260,
  rocketTurn: 2.2,
};

const camera = {
  x: 0,
  y: 0,
  shake: 0,
  shakeMag: 0,
};

const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  w: 20,
  h: 20,
  grounded: false,
  wallLeft: false,
  wallRight: false,
  facing: 1,
  coyote: 0,
  jumpBuffer: 0,
  dash: { active: false, time: 0, cooldown: 0, vx: 0, vy: 0 },
  maxLives: 3,
  lives: 3,
  shieldTime: 0,
  slowTime: 0,
  swordTime: 0,
  invuln: 0,
  alive: true,
  deadTimer: 0,
  trail: [],
};

const particles = [];

const levelData = {
  width: 0,
  height: 0,
  tiles: [],
  gold: [],
  mines: [],
  snipers: [],
  launchers: [],
  bullets: [],
  rockets: [],
  exit: null,
  spawn: { x: 0, y: 0 },
};

const levels = [
  [
    "########################################",
    "#.....................*................#",
    "#...................#####..............#",
    "#.....................#................#",
    "#....*................#..........*.....#",
    "#..####...........^...#..^...#####.....#",
    "#..................####..#.............#",
    "#.....S..................#.............#",
    "#...........*............#...........E.#",
    "###########......###############.......#",
    "#...........^.....................*....#",
    "#..*..........#######........#######...#",
    "#.............#.....#........#.....#...#",
    "#....#####....#..o..#....*...#..o..#...#",
    "#........#....#.....#........#.....#...#",
    "#..*.....#....#######........#######...#",
    "#........#.............................#",
    "########################################",
  ],
  [
    "########################################",
    "#.................*..............*.....#",
    "#..####........#########........####...#",
    "#..#..#.....................^...........#",
    "#..#..#....*.......###...........#####..#",
    "#..#..#.............#...............#..#",
    "#..#..####..#####...#..#######..o...#..#",
    "#..#.......#.....#..#..#.....#......#..#",
    "#..######..#..o..#..#..#..o..#..####...#",
    "#..#.......#.....#..#..#.....#.....#..#",
    "#..#..####..#####...#..#######.....#..#",
    "#..#..#.........................*..#..#",
    "#..#..#.....S.......................#E#",
    "#..#..###############################.#",
    "#..#.................................#",
    "########################################",
  ],
  [
    "########################################",
    "#............*...............*........#",
    "#..#######..#####....#######..#####...#",
    "#..#.....#..#...#....#.....#..#...#...#",
    "#..#..o..#..#.^.#....#..o..#..#.^.#...#",
    "#..#.....#..#####....#.....#..#####...#",
    "#..#######.................#######...#",
    "#...........*.......................#",
    "#....#####.............#####........#",
    "#....#...#....S........#...#....E...#",
    "#....#...#.............#...#........#",
    "#....#####.............#####........#",
    "#...................................#",
    "########################################",
  ],
  [
    "########################################",
    "#..............*..............*.......#",
    "#..########..#####..########..#####...#",
    "#..#......#..#...#..#......#..#...#...#",
    "#..#..o...#..#.^.#..#..o...#..#.^.#...#",
    "#..#......#..#####..#......#..#####...#",
    "#..########.................########..#",
    "#...........*....#####....*..........#",
    "#..S.............#...#..............E#",
    "#.............o..#...#..o............#",
    "#................#####...............#",
    "########################################",
  ],
  [
    "########################################",
    "#....*............................*...#",
    "#..####..#########..#####..########...#",
    "#..#...........#....#...#.............#",
    "#..#..o..####...#....#.^.#....####..o..#",
    "#..#......#.....#....#...#....#.......#",
    "#..#####..#..#####....#####....#####..#",
    "#..............*.....................#",
    "#..S..................o.........E....#",
    "#..........................#######...#",
    "########################################",
  ],
];

const enemySpawns = [
  { snipers: [[12, 1], [26, 9]], rockets: [[30, 4], [6, 12]] },
  { snipers: [[9, 1], [26, 9]], rockets: [[32, 2], [12, 7]] },
  { snipers: [[10, 1], [25, 7]], rockets: [[30, 3], [6, 8]] },
  { snipers: [[9, 1], [28, 7]], rockets: [[22, 8], [6, 9]] },
  { snipers: [[8, 1], [27, 6]], rockets: [[20, 4], [12, 7]] },
];

const audio = {
  context: null,
};

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#1a2f57");
  gradient.addColorStop(0.5, "#0d1628");
  gradient.addColorStop(1, "#070b12");
}

window.addEventListener("resize", resize);
resize();

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "Escape") {
    event.preventDefault();
    togglePause();
    return;
  }
  if (event.code === "KeyM") {
    event.preventDefault();
    openMenu("menu");
    return;
  }
  if (!keys.has(event.code)) {
    pressed.add(event.code);
  }
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

startButton.addEventListener("click", () => {
  resumeGame();
});

function initAudio() {
  if (audio.context) {
    return;
  }
  audio.context = new (window.AudioContext || window.webkitAudioContext)();
}

function buildLevelButtons() {
  levelGrid.innerHTML = "";
  levels.forEach((_, index) => {
    const button = document.createElement("button");
    button.className = "level-btn";
    button.textContent = `${index + 1}`;
    button.addEventListener("click", () => {
      state.levelIndex = index;
      loadLevel(index);
      resumeGame();
    });
    levelGrid.appendChild(button);
  });
}

function updateLevelButtons() {
  const buttons = levelGrid.querySelectorAll(".level-btn");
  buttons.forEach((button, index) => {
    if (index === state.levelIndex) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function openMenu(mode = "menu") {
  state.paused = true;
  if (mode === "pause") {
    menuTitle.textContent = "Paused";
    menuSubtitle.textContent = "Catch your breath, then dive back in.";
    startButton.textContent = "Resume";
    startButton.classList.add("secondary");
  } else {
    menuTitle.textContent = "Neon Runner";
    menuSubtitle.textContent = "Select a level and start your run.";
    startButton.textContent = state.running ? "Resume" : "Start Run";
    startButton.classList.toggle("secondary", state.running);
  }
  updateLevelButtons();
  overlay.classList.add("show");
}

function resumeGame() {
  overlay.classList.remove("show");
  state.running = true;
  state.paused = false;
  initAudio();
  pressed.clear();
  keys.clear();
}

function togglePause() {
  if (!state.running) {
    return;
  }
  if (state.paused) {
    resumeGame();
  } else {
    openMenu("pause");
  }
}

function playTone(freq, duration, type = "sine", gainValue = 0.1) {
  if (!audio.context) {
    return;
  }
  const now = audio.context.currentTime;
  const osc = audio.context.createOscillator();
  const gain = audio.context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gainValue, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audio.context.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function playNoise(duration, gainValue = 0.15) {
  if (!audio.context) {
    return;
  }
  const bufferSize = audio.context.sampleRate * duration;
  const buffer = audio.context.createBuffer(1, bufferSize, audio.context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audio.context.createBufferSource();
  const gain = audio.context.createGain();
  gain.gain.value = gainValue;
  source.buffer = buffer;
  source.connect(gain).connect(audio.context.destination);
  source.start();
}

function loadLevel(index) {
  const data = levels[index];
  const width = Math.max(...data.map((row) => row.length));
  levelData.height = data.length;
  levelData.width = width;
  levelData.tiles = data.map((row) => {
    const padded = row.padEnd(width, "#");
    return padded.split("");
  });
  levelData.gold = [];
  levelData.mines = [];
  levelData.snipers = [];
  levelData.launchers = [];
  levelData.bullets = [];
  levelData.rockets = [];
  levelData.shields = [];
  levelData.slows = [];
  levelData.swords = [];
  levelData.exit = null;

  data.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const wx = x * tileSize + tileSize / 2;
      const wy = y * tileSize + tileSize / 2;
      if (char === "S") {
        levelData.spawn = { x: wx, y: wy };
        levelData.tiles[y][x] = ".";
      }
      if (char === "*") {
        levelData.gold.push({ x: wx, y: wy, collected: false });
      }
      if (char === "^") {
        levelData.tiles[y][x] = ".";
      }
      if (char === "o") {
        levelData.mines.push({
          x: wx,
          y: wy,
          armed: false,
          timer: 0,
          explode: 0,
          gone: false,
        });
      }
      if (char === "E") {
        levelData.exit = { x: wx, y: wy };
      }
    });
  });

  const spawns = enemySpawns[index] || { snipers: [], rockets: [] };
  spawns.snipers.forEach(([tx, ty]) => {
    const spot = findEnemyPlacement(tx, ty, levelData.spawn);
    if (spot) {
      levelData.snipers.push({
        x: spot.x,
        y: spot.y,
        charge: 0,
        cooldown: 0,
      });
    }
  });
  spawns.rockets.forEach(([tx, ty]) => {
    const spot = findEnemyPlacement(tx, ty, levelData.spawn);
    if (spot) {
      levelData.launchers.push({
        x: spot.x,
        y: spot.y,
        cooldown: Math.random() * 1.2,
      });
    }
  });

  const reachableTiles = getReachableTiles();
  const reachableMap = buildReachableMap(reachableTiles);
  levelData.mines.forEach((mine) => {
    const tx = Math.floor(mine.x / tileSize);
    const ty = Math.floor(mine.y / tileSize);
    const placement = findReachablePlacement(tx, ty, reachableMap);
    if (placement) {
      mine.x = placement.x;
      mine.y = placement.y;
    }
  });

  const pickupCandidates = reachableTiles.filter(
    (tile) => levelData.tiles[tile.y][tile.x] === "."
  );
  const fallbackCandidates = reachableTiles.filter(
    (tile) => levelData.tiles[tile.y][tile.x] !== "#"
  );
  const candidates = pickupCandidates.length >= 3 ? pickupCandidates : fallbackCandidates;
  const powerupTiles = pickOpenTiles(3, (index + 1) * 1337, candidates);
  if (powerupTiles[0]) {
    levelData.shields.push({
      x: powerupTiles[0].x * tileSize + tileSize / 2,
      y: powerupTiles[0].y * tileSize + tileSize / 2,
      collected: false,
    });
  }
  if (powerupTiles[1]) {
    levelData.slows.push({
      x: powerupTiles[1].x * tileSize + tileSize / 2,
      y: powerupTiles[1].y * tileSize + tileSize / 2,
      collected: false,
    });
  }
  if (powerupTiles[2]) {
    levelData.swords.push({
      x: powerupTiles[2].x * tileSize + tileSize / 2,
      y: powerupTiles[2].y * tileSize + tileSize / 2,
      collected: false,
    });
  }

  resetPlayer();
  state.timeLeft = 60;
  levelEl.textContent = `${index + 1}`;
  updateHud();
  updateLevelButtons();
}

function resetPlayer() {
  player.x = levelData.spawn.x;
  player.y = levelData.spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.wallLeft = false;
  player.wallRight = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.dash.active = false;
  player.dash.cooldown = 0;
  player.lives = player.maxLives;
  player.shieldTime = 0;
  player.slowTime = 0;
  player.swordTime = 0;
  player.invuln = 0;
  player.alive = true;
  player.deadTimer = 0;
  player.trail = [];
}

function isSolid(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= levelData.width || ty >= levelData.height) {
    return true;
  }
  return levelData.tiles[ty][tx] === "#";
}

function isSolidAt(x, y) {
  const tx = Math.floor(x / tileSize);
  const ty = Math.floor(y / tileSize);
  return isSolid(tx, ty);
}

function tileCenter(tx, ty) {
  return {
    x: tx * tileSize + tileSize / 2,
    y: ty * tileSize + tileSize / 2,
  };
}

function findEnemyPlacement(tx, ty, target) {
  if (!isSolid(tx, ty)) {
    const center = tileCenter(tx, ty);
    if (hasLineOfSight(center.x, center.y, target.x, target.y)) {
      return center;
    }
  }

  const maxRadius = 10;
  let best = null;
  let bestDist = Infinity;
  for (let r = 1; r <= maxRadius; r += 1) {
    for (let y = ty - r; y <= ty + r; y += 1) {
      for (let x = tx - r; x <= tx + r; x += 1) {
        if (x < 0 || y < 0 || x >= levelData.width || y >= levelData.height) {
          continue;
        }
        if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) {
          continue;
        }
        if (isSolid(x, y)) {
          continue;
        }
        const center = tileCenter(x, y);
        if (!hasLineOfSight(center.x, center.y, target.x, target.y)) {
          continue;
        }
        const dist = Math.hypot(x - tx, y - ty);
        if (dist < bestDist) {
          bestDist = dist;
          best = center;
        }
      }
    }
    if (best) {
      break;
    }
  }
  return best;
}

function buildReachableMap(tiles) {
  const map = Array.from({ length: levelData.height }, () =>
    Array.from({ length: levelData.width }, () => false)
  );
  tiles.forEach((tile) => {
    map[tile.y][tile.x] = true;
  });
  return map;
}

function findReachablePlacement(tx, ty, reachableMap) {
  if (reachableMap[ty] && reachableMap[ty][tx]) {
    return tileCenter(tx, ty);
  }
  const maxRadius = Math.max(levelData.width, levelData.height);
  for (let r = 1; r <= maxRadius; r += 1) {
    for (let y = ty - r; y <= ty + r; y += 1) {
      for (let x = tx - r; x <= tx + r; x += 1) {
        if (x < 0 || y < 0 || x >= levelData.width || y >= levelData.height) {
          continue;
        }
        if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) {
          continue;
        }
        if (reachableMap[y] && reachableMap[y][x]) {
          return tileCenter(x, y);
        }
      }
    }
  }
  return null;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value & 0xfffffff) / 0xfffffff;
  };
}

function getReachableTiles() {
  const startX = Math.floor(levelData.spawn.x / tileSize);
  const startY = Math.floor(levelData.spawn.y / tileSize);
  if (isSolid(startX, startY)) {
    return [];
  }
  const visited = Array.from({ length: levelData.height }, () =>
    Array.from({ length: levelData.width }, () => false)
  );
  const queue = [[startX, startY]];
  visited[startY][startX] = true;
  const tiles = [];

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    tiles.push({ x, y });
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    neighbors.forEach(([nx, ny]) => {
      if (nx < 0 || ny < 0 || nx >= levelData.width || ny >= levelData.height) {
        return;
      }
      if (visited[ny][nx]) {
        return;
      }
      if (levelData.tiles[ny][nx] === "#") {
        return;
      }
      visited[ny][nx] = true;
      queue.push([nx, ny]);
    });
  }

  return tiles;
}

function pickOpenTiles(count, seed, candidates = null) {
  const open = candidates ? [...candidates] : [];
  if (!candidates) {
    for (let y = 0; y < levelData.height; y += 1) {
      for (let x = 0; x < levelData.width; x += 1) {
        if (levelData.tiles[y][x] === ".") {
          open.push({ x, y });
        }
      }
    }
  }
  const rng = seededRandom(seed);
  const picks = [];
  for (let i = 0; i < count && open.length > 0; i += 1) {
    const idx = Math.floor(rng() * open.length);
    picks.push(open.splice(idx, 1)[0]);
  }
  return picks;
}

function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist / (tileSize * 0.45));
  if (steps <= 1) {
    return true;
  }
  const stepX = dx / steps;
  const stepY = dy / steps;
  for (let i = 1; i < steps; i += 1) {
    const x = x0 + stepX * i;
    const y = y0 + stepY * i;
    if (isSolidAt(x, y)) {
      return false;
    }
  }
  return true;
}

function checkHazards(dt) {
  levelData.mines.forEach((mine) => {
    if (mine.gone) {
      return;
    }
    const dist = Math.hypot(player.x - mine.x, player.y - mine.y);
    if (mine.explode > 0) {
      if (dist < 90) {
        killPlayer();
      }
      return;
    }
    if (!mine.armed && dist < 80) {
      mine.armed = true;
      mine.timer = 0.55;
    }
    if (mine.armed) {
      mine.timer -= dt;
      if (mine.timer <= 0) {
        mine.explode = 0.35;
        mine.armed = false;
        mine.timer = 0;
        camera.shake = 0.3;
        camera.shakeMag = 6;
        playNoise(0.2, 0.25);
      }
    }
  });
}

function killPlayer(force = false) {
  if (!player.alive || player.invuln > 0) {
    return;
  }
  if (!force && player.shieldTime > 0) {
    player.shieldTime = 0;
    player.invuln = 0.6;
    spawnBurst(player.x, player.y, "#79f2ff", 26, 200);
    camera.shake = 0.2;
    camera.shakeMag = 5;
    playTone(360, 0.2, "triangle", 0.12);
    return;
  }

  if (!force && player.lives > 1) {
    player.lives -= 1;
    player.invuln = 0.7;
    spawnBurst(player.x, player.y, "#ffb86b", 24, 180);
    camera.shake = 0.2;
    camera.shakeMag = 6;
    playTone(240, 0.2, "triangle", 0.12);
    return;
  }

  player.lives = 0;
  player.alive = false;
  player.deadTimer = 0.7;
  spawnBurst(player.x, player.y, "#ff5f6d", 40, 260);
  camera.shake = 0.25;
  camera.shakeMag = 8;
  playNoise(0.2, 0.2);
}

function spawnBurst(x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * Math.random(),
      vy: Math.sin(angle) * speed * Math.random(),
      life: 0.5 + Math.random() * 0.5,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function spawnSpark(x, y, color = "#79f2ff") {
  spawnBurst(x, y, color, 6, 120);
}

function updateGold() {
  levelData.gold.forEach((orb) => {
    if (orb.collected) {
      return;
    }
    const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
    if (dist < 18) {
      orb.collected = true;
      state.timeLeft = Math.min(99.99, state.timeLeft + 2.0);
      playTone(880, 0.2, "triangle", 0.12);
      spawnBurst(orb.x, orb.y, "#79f2ff", 16, 120);
    }
  });
}

function updatePickups() {
  levelData.shields.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 18) {
      pickup.collected = true;
      player.shieldTime = Math.max(player.shieldTime, powerupDurations.shield);
      playTone(480, 0.2, "triangle", 0.12);
      spawnBurst(pickup.x, pickup.y, "#79f2ff", 18, 140);
    }
  });
  levelData.slows.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 18) {
      pickup.collected = true;
      player.slowTime = Math.max(player.slowTime, powerupDurations.slow);
      playTone(320, 0.2, "sine", 0.12);
      spawnBurst(pickup.x, pickup.y, "#7cf8ff", 18, 140);
    }
  });
  levelData.swords.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 18) {
      pickup.collected = true;
      player.swordTime = Math.max(player.swordTime, powerupDurations.sword);
      playTone(680, 0.18, "square", 0.1);
      spawnBurst(pickup.x, pickup.y, "#ffd66b", 18, 140);
    }
  });
}

function updateSword() {
  if (player.swordTime <= 0) {
    return;
  }
  const radius = 26;
  for (let i = levelData.snipers.length - 1; i >= 0; i -= 1) {
    const sniper = levelData.snipers[i];
    if (Math.hypot(player.x - sniper.x, player.y - sniper.y) < radius) {
      spawnBurst(sniper.x, sniper.y, "#ffd66b", 16, 160);
      levelData.snipers.splice(i, 1);
      playTone(520, 0.12, "triangle", 0.1);
    }
  }
  for (let i = levelData.launchers.length - 1; i >= 0; i -= 1) {
    const launcher = levelData.launchers[i];
    if (Math.hypot(player.x - launcher.x, player.y - launcher.y) < radius) {
      spawnBurst(launcher.x, launcher.y, "#ffd66b", 18, 160);
      levelData.launchers.splice(i, 1);
      playTone(520, 0.12, "triangle", 0.1);
    }
  }
  for (let i = levelData.rockets.length - 1; i >= 0; i -= 1) {
    const rocket = levelData.rockets[i];
    if (Math.hypot(player.x - rocket.x, player.y - rocket.y) < radius) {
      spawnBurst(rocket.x, rocket.y, "#ffd66b", 18, 160);
      levelData.rockets.splice(i, 1);
      playTone(520, 0.1, "triangle", 0.08);
    }
  }
  for (let i = levelData.mines.length - 1; i >= 0; i -= 1) {
    const mine = levelData.mines[i];
    if (!mine.gone && Math.hypot(player.x - mine.x, player.y - mine.y) < radius) {
      mine.gone = true;
      spawnBurst(mine.x, mine.y, "#ffd66b", 14, 140);
    }
  }
  for (let i = levelData.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = levelData.bullets[i];
    if (Math.hypot(player.x - bullet.x, player.y - bullet.y) < 14) {
      spawnSpark(bullet.x, bullet.y, "#ffd66b");
      levelData.bullets.splice(i, 1);
    }
  }
}

function spawnBullet(x, y, dirX, dirY) {
  const length = Math.hypot(dirX, dirY) || 1;
  const speed = tuning.bulletSpeed;
  levelData.bullets.push({
    x,
    y,
    vx: (dirX / length) * speed,
    vy: (dirY / length) * speed,
    life: 1.2,
  });
}

function spawnRocket(x, y) {
  levelData.rockets.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 4.5,
    speed: tuning.rocketSpeed,
    turn: tuning.rocketTurn,
  });
}

function updateSnipers(dt) {
  levelData.snipers.forEach((sniper) => {
    const dx = player.x - sniper.x;
    const dy = player.y - sniper.y;
    const dist = Math.hypot(dx, dy);
    const inRange = dist < 720;
    const hasLOS = inRange && hasLineOfSight(sniper.x, sniper.y, player.x, player.y);

    if (sniper.cooldown > 0) {
      sniper.cooldown -= dt;
    }

    if (hasLOS) {
      sniper.charge = Math.min(1, sniper.charge + dt * tuning.sniperChargeRate);
      if (sniper.charge >= 1 && sniper.cooldown <= 0) {
        spawnBullet(sniper.x, sniper.y, dx, dy);
        sniper.charge = 0;
        sniper.cooldown = tuning.sniperCooldown;
        playTone(720, 0.08, "sawtooth", 0.09);
      }
    } else {
      sniper.charge = Math.max(0, sniper.charge - dt * 0.6);
    }

    sniper.hasLOS = hasLOS;
  });
}

function updateLaunchers(dt) {
  levelData.launchers.forEach((launcher) => {
    if (launcher.cooldown > 0) {
      launcher.cooldown -= dt;
      return;
    }
    const dist = Math.hypot(player.x - launcher.x, player.y - launcher.y);
    if (dist < 820 && hasLineOfSight(launcher.x, launcher.y, player.x, player.y)) {
      spawnRocket(launcher.x, launcher.y);
      launcher.cooldown = tuning.launcherCooldown + Math.random() * tuning.launcherCooldownJitter;
      playTone(180, 0.12, "triangle", 0.1);
    }
  });
}

function updateBullets(dt) {
  for (let i = levelData.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = levelData.bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (bullet.life <= 0 || isSolidAt(bullet.x, bullet.y)) {
      spawnSpark(bullet.x, bullet.y, "#ffe3a3");
      levelData.bullets.splice(i, 1);
      continue;
    }

    if (player.alive && Math.hypot(player.x - bullet.x, player.y - bullet.y) < 12) {
      killPlayer();
      levelData.bullets.splice(i, 1);
    }
  }
}

function updateRockets(dt) {
  for (let i = levelData.rockets.length - 1; i >= 0; i -= 1) {
    const rocket = levelData.rockets[i];
    rocket.life -= dt;

    if (rocket.life <= 0) {
      spawnBurst(rocket.x, rocket.y, "#ffb86b", 30, 200);
      camera.shake = 0.2;
      camera.shakeMag = 6;
      levelData.rockets.splice(i, 1);
      continue;
    }

    const dx = player.x - rocket.x;
    const dy = player.y - rocket.y;
    const dist = Math.hypot(dx, dy) || 1;
    const desiredVX = (dx / dist) * rocket.speed;
    const desiredVY = (dy / dist) * rocket.speed;
    rocket.vx += (desiredVX - rocket.vx) * rocket.turn * dt;
    rocket.vy += (desiredVY - rocket.vy) * rocket.turn * dt;
    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;

    if (dist < 18 || isSolidAt(rocket.x, rocket.y)) {
      spawnBurst(rocket.x, rocket.y, "#ff7b6b", 36, 240);
      camera.shake = 0.25;
      camera.shakeMag = 7;
      playNoise(0.18, 0.2);
      if (dist < 90) {
        killPlayer();
      }
      levelData.rockets.splice(i, 1);
      continue;
    }

    if (Math.random() < 0.3) {
      particles.push({
        x: rocket.x - rocket.vx * 0.02,
        y: rocket.y - rocket.vy * 0.02,
        vx: -rocket.vx * 0.1 + (Math.random() - 0.5) * 40,
        vy: -rocket.vy * 0.1 + (Math.random() - 0.5) * 40,
        life: 0.3,
        size: 2 + Math.random() * 2,
        color: "#ffb86b",
      });
    }
  }
}

function updateExit() {
  if (!levelData.exit) {
    return;
  }
  const dist = Math.hypot(player.x - levelData.exit.x, player.y - levelData.exit.y);
  if (dist < 22 && remainingGold() === 0) {
    nextLevel();
  }
}

function remainingGold() {
  return levelData.gold.filter((orb) => !orb.collected).length;
}

function updateHud() {
  timeEl.textContent = state.timeLeft.toFixed(2);
  goldEl.textContent = `${levelData.gold.filter((orb) => orb.collected).length} / ${levelData.gold.length}`;
  livesEl.textContent = `${player.lives}`;
  shieldEl.textContent = player.shieldTime > 0 ? player.shieldTime.toFixed(1) : "--";
  slowEl.textContent = player.slowTime > 0 ? player.slowTime.toFixed(1) : "--";
  swordEl.textContent = player.swordTime > 0 ? player.swordTime.toFixed(1) : "--";
  const remaining = remainingGold();
  if (remaining === 0) {
    statusEl.textContent = "Exit Open";
  } else {
    statusEl.textContent = `Exit Locked (${remaining})`;
  }
}

function nextLevel() {
  state.levelIndex = (state.levelIndex + 1) % levels.length;
  loadLevel(state.levelIndex);
  playTone(520, 0.3, "sine", 0.12);
}

function prevLevel() {
  state.levelIndex = (state.levelIndex - 1 + levels.length) % levels.length;
  loadLevel(state.levelIndex);
}

function handleLevelKeys() {
  if (pressed.has("KeyR")) {
    loadLevel(state.levelIndex);
  }
  if (pressed.has("KeyN")) {
    nextLevel();
  }
  if (pressed.has("KeyP")) {
    prevLevel();
  }
}

function updatePlayer(dt) {
  const accel = tuning.accel;
  const maxSpeed = tuning.maxSpeed;
  const gravity = tuning.gravity;
  const jumpVel = tuning.jumpVel;
  const wallJumpVel = tuning.wallJumpVel;
  const wallSlide = tuning.wallSlide;

  const left = keys.has("KeyA") || keys.has("ArrowLeft");
  const right = keys.has("KeyD") || keys.has("ArrowRight");
  const up = keys.has("KeyW") || keys.has("ArrowUp");
  const down = keys.has("KeyS") || keys.has("ArrowDown");

  if (left) {
    player.vx -= accel * dt;
    player.facing = -1;
  }
  if (right) {
    player.vx += accel * dt;
    player.facing = 1;
  }

  if (!left && !right) {
    player.vx *= 1 - Math.min(1, dt * 8);
  }

  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

  if (player.grounded) {
    player.coyote = tuning.coyote;
  } else {
    player.coyote -= dt;
  }

  if (pressed.has("Space") || pressed.has("KeyW") || pressed.has("ArrowUp")) {
    player.jumpBuffer = tuning.jumpBuffer;
  } else {
    player.jumpBuffer -= dt;
  }

  if (player.dash.cooldown > 0) {
    player.dash.cooldown -= dt;
  }

  if (pressed.has("ShiftLeft") || pressed.has("ShiftRight")) {
    if (!player.dash.active && player.dash.cooldown <= 0) {
      const dirX = (right ? 1 : 0) - (left ? 1 : 0);
      const dirY = (down ? 1 : 0) - (up ? 1 : 0);
      const length = Math.hypot(dirX, dirY) || 1;
      const dashSpeed = tuning.dashSpeed;
      player.dash.active = true;
      player.dash.time = tuning.dashTime;
      player.dash.cooldown = tuning.dashCooldown;
      player.dash.vx = (dirX || player.facing) / length * dashSpeed;
      player.dash.vy = dirY / length * dashSpeed;
      player.vx = player.dash.vx;
      player.vy = player.dash.vy;
      camera.shake = 0.15;
      camera.shakeMag = 4;
      playTone(220, 0.1, "sawtooth", 0.12);
      spawnBurst(player.x, player.y, "#79f2ff", 12, 160);
    }
  }

  if (player.jumpBuffer > 0) {
    if (player.grounded || player.coyote > 0) {
      player.vy = -jumpVel;
      player.jumpBuffer = 0;
      player.coyote = 0;
      playTone(520, 0.1, "square", 0.08);
      spawnBurst(player.x, player.y + player.h * 0.4, "#ffd66b", 10, 140);
    } else if (player.wallLeft || player.wallRight) {
      const dir = player.wallLeft ? 1 : -1;
      player.vx = dir * wallJumpVel;
      player.vy = -jumpVel * 0.9;
      player.jumpBuffer = 0;
      playTone(600, 0.1, "square", 0.08);
    }
  }

  if (player.dash.active) {
    player.dash.time -= dt;
    if (player.dash.time <= 0) {
      player.dash.active = false;
    }
  } else {
    player.vy += gravity * dt;
  }

  if (!player.grounded && (player.wallLeft || player.wallRight) && player.vy > wallSlide) {
    player.vy = wallSlide;
  }

  movePlayer(dt);
}

function movePlayer(dt) {
  const halfW = player.w / 2;
  const halfH = player.h / 2;
  player.wallLeft = false;
  player.wallRight = false;

  player.x += player.vx * dt;
  const minTileX = Math.floor((player.x - halfW) / tileSize);
  const maxTileX = Math.floor((player.x + halfW) / tileSize);
  const minTileY = Math.floor((player.y - halfH) / tileSize);
  const maxTileY = Math.floor((player.y + halfH) / tileSize);

  for (let y = minTileY; y <= maxTileY; y += 1) {
    for (let x = minTileX; x <= maxTileX; x += 1) {
      if (!isSolid(x, y)) {
        continue;
      }
      const tileX = x * tileSize;
      const tileY = y * tileSize;
      const tileRect = { x: tileX, y: tileY, w: tileSize, h: tileSize };
      const playerRect = {
        x: player.x - halfW,
        y: player.y - halfH,
        w: player.w,
        h: player.h,
      };
      if (rectsOverlap(playerRect, tileRect)) {
        if (player.vx > 0) {
          player.x = tileX - halfW;
          player.vx = 0;
          player.wallRight = true;
        } else if (player.vx < 0) {
          player.x = tileX + tileSize + halfW;
          player.vx = 0;
          player.wallLeft = true;
        }
      }
    }
  }

  player.y += player.vy * dt;
  player.grounded = false;
  const minTileX2 = Math.floor((player.x - halfW) / tileSize);
  const maxTileX2 = Math.floor((player.x + halfW) / tileSize);
  const minTileY2 = Math.floor((player.y - halfH) / tileSize);
  const maxTileY2 = Math.floor((player.y + halfH) / tileSize);

  for (let y = minTileY2; y <= maxTileY2; y += 1) {
    for (let x = minTileX2; x <= maxTileX2; x += 1) {
      if (!isSolid(x, y)) {
        continue;
      }
      const tileX = x * tileSize;
      const tileY = y * tileSize;
      const tileRect = { x: tileX, y: tileY, w: tileSize, h: tileSize };
      const playerRect = {
        x: player.x - halfW,
        y: player.y - halfH,
        w: player.w,
        h: player.h,
      };
      if (rectsOverlap(playerRect, tileRect)) {
        if (player.vy > 0) {
          player.y = tileY - halfH;
          player.vy = 0;
          player.grounded = true;
        } else if (player.vy < 0) {
          player.y = tileY + tileSize + halfH;
          player.vy = 0;
        }
      }
    }
  }
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function updateCamera(dt) {
  const targetX = player.x + player.vx * 0.15;
  const targetY = player.y + player.vy * 0.1;
  const maxX = levelData.width * tileSize;
  const maxY = levelData.height * tileSize;

  camera.x += (targetX - camera.x) * (1 - Math.exp(-dt * 5));
  camera.y += (targetY - camera.y) * (1 - Math.exp(-dt * 5));

  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;
  const clampMaxX = Math.max(halfW, maxX - halfW);
  const clampMaxY = Math.max(halfH, maxY - halfH);
  camera.x = Math.max(halfW, Math.min(clampMaxX, camera.x));
  camera.y = Math.max(halfH, Math.min(clampMaxY, camera.y));

  if (camera.shake > 0) {
    camera.shake -= dt;
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function updateTrail(dt) {
  player.trail.push({ x: player.x, y: player.y, life: 0.4 });
  for (let i = player.trail.length - 1; i >= 0; i -= 1) {
    player.trail[i].life -= dt;
    if (player.trail[i].life <= 0) {
      player.trail.splice(i, 1);
    }
  }
}

function updateMines(dt) {
  levelData.mines.forEach((mine) => {
    if (mine.explode > 0) {
      mine.explode -= dt;
      if (mine.explode <= 0) {
        mine.gone = true;
      }
    }
  });
}

function update(dt) {
  handleLevelKeys();

  const timeScale = player.slowTime > 0 ? 0.55 : 1;
  const dtWorld = dt * timeScale;

  if (player.shieldTime > 0) {
    player.shieldTime = Math.max(0, player.shieldTime - dt);
  }
  if (player.slowTime > 0) {
    player.slowTime = Math.max(0, player.slowTime - dt);
  }
  if (player.swordTime > 0) {
    player.swordTime = Math.max(0, player.swordTime - dt);
  }
  if (player.invuln > 0) {
    player.invuln = Math.max(0, player.invuln - dt);
  }

  if (!player.alive) {
    player.deadTimer -= dt;
    if (player.deadTimer <= 0) {
      loadLevel(state.levelIndex);
    }
    updateParticles(dtWorld);
    updateTrail(dtWorld);
    pressed.clear();
    return;
  }

  state.timeLeft -= dtWorld;
  if (state.timeLeft <= 0) {
    killPlayer(true);
    pressed.clear();
    return;
  }

  updatePlayer(dtWorld);
  updateSnipers(dtWorld);
  updateLaunchers(dtWorld);
  updateBullets(dtWorld);
  updateRockets(dtWorld);
  updateGold();
  updatePickups();
  updateSword();
  updateExit();
  updateMines(dtWorld);
  updateCamera(dtWorld);
  updateParticles(dtWorld);
  updateTrail(dtWorld);
  updateHud();
  checkHazards(dtWorld);

  pressed.clear();
}

function drawBackground() {
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#15223b";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    const x = (i * 220 + (camera.x * 0.2)) % (window.innerWidth + 300) - 150;
    const y = 120 + (i % 2) * 80;
    ctx.ellipse(x, y, 180, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function worldToScreen(x, y) {
  return {
    x: x - camera.x + window.innerWidth / 2,
    y: y - camera.y + window.innerHeight / 2,
  };
}

function drawLevel() {
  const viewLeft = camera.x - window.innerWidth / 2 - tileSize;
  const viewRight = camera.x + window.innerWidth / 2 + tileSize;
  const viewTop = camera.y - window.innerHeight / 2 - tileSize;
  const viewBottom = camera.y + window.innerHeight / 2 + tileSize;

  const startX = Math.max(0, Math.floor(viewLeft / tileSize));
  const endX = Math.min(levelData.width - 1, Math.floor(viewRight / tileSize));
  const startY = Math.max(0, Math.floor(viewTop / tileSize));
  const endY = Math.min(levelData.height - 1, Math.floor(viewBottom / tileSize));

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const tile = levelData.tiles[y][x];
      const wx = x * tileSize;
      const wy = y * tileSize;
      const screen = worldToScreen(wx, wy);

      if (tile === "#") {
        ctx.fillStyle = "#1c2b44";
        ctx.fillRect(screen.x, screen.y, tileSize, tileSize);
        ctx.strokeStyle = "rgba(121, 242, 255, 0.1)";
        ctx.strokeRect(screen.x + 2, screen.y + 2, tileSize - 4, tileSize - 4);
      }

    }
  }
}

function drawGold() {
  levelData.gold.forEach((orb) => {
    if (orb.collected) {
      return;
    }
    const screen = worldToScreen(orb.x, orb.y);
    ctx.save();
    ctx.shadowColor = "rgba(121, 242, 255, 0.8)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#79f2ff";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPickups() {
  levelData.shields.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    const screen = worldToScreen(pickup.x, pickup.y);
    ctx.save();
    ctx.shadowColor = "rgba(121, 242, 255, 0.8)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "#79f2ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  levelData.slows.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    const screen = worldToScreen(pickup.x, pickup.y);
    ctx.save();
    ctx.shadowColor = "rgba(124, 248, 255, 0.8)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#7cf8ff";
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - 8);
    ctx.lineTo(screen.x + 6, screen.y);
    ctx.lineTo(screen.x, screen.y + 8);
    ctx.lineTo(screen.x - 6, screen.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  levelData.swords.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }
    const screen = worldToScreen(pickup.x, pickup.y);
    ctx.save();
    ctx.shadowColor = "rgba(255, 214, 107, 0.8)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "#ffd66b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - 10);
    ctx.lineTo(screen.x, screen.y + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(screen.x - 6, screen.y);
    ctx.lineTo(screen.x + 6, screen.y);
    ctx.stroke();
    ctx.restore();
  });
}

function drawSnipers() {
  levelData.snipers.forEach((sniper) => {
    const screen = worldToScreen(sniper.x, sniper.y);
    const dx = player.x - sniper.x;
    const dy = player.y - sniper.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    if (sniper.charge > 0.05 && sniper.hasLOS) {
      ctx.strokeStyle = `rgba(255, 120, 120, ${0.3 + sniper.charge * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const end = worldToScreen(player.x, player.y);
      ctx.moveTo(screen.x, screen.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#ff5f6d";
    ctx.shadowColor = "rgba(255, 95, 109, 0.6)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0b101a";
    ctx.fillRect(2, -2, 12, 4);
    ctx.restore();
  });
}

function drawLaunchers() {
  levelData.launchers.forEach((launcher) => {
    const screen = worldToScreen(launcher.x, launcher.y);
    const dx = player.x - launcher.x;
    const dy = player.y - launcher.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#ffb86b";
    ctx.shadowColor = "rgba(255, 184, 107, 0.6)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(12, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

function drawBullets() {
  levelData.bullets.forEach((bullet) => {
    const screen = worldToScreen(bullet.x, bullet.y);
    ctx.save();
    ctx.fillStyle = "#ffe3a3";
    ctx.shadowColor = "rgba(255, 227, 163, 0.8)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawRockets() {
  levelData.rockets.forEach((rocket) => {
    const screen = worldToScreen(rocket.x, rocket.y);
    const angle = Math.atan2(rocket.vy, rocket.vx);
    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#ff7b6b";
    ctx.shadowColor = "rgba(255, 123, 107, 0.8)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffd66b";
    ctx.beginPath();
    ctx.arc(-10, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawMines() {
  levelData.mines.forEach((mine) => {
    if (mine.gone) {
      return;
    }
    const screen = worldToScreen(mine.x, mine.y);
    if (mine.explode > 0) {
      const radius = (1 - mine.explode / 0.35) * 100;
      ctx.strokeStyle = `rgba(255, 95, 109, ${mine.explode})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    ctx.save();
    ctx.fillStyle = "#ff5f6d";
    ctx.shadowColor = mine.armed ? "rgba(255, 95, 109, 0.9)" : "rgba(255, 95, 109, 0.3)";
    ctx.shadowBlur = mine.armed ? 16 : 6;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawExit() {
  if (!levelData.exit) {
    return;
  }
  const screen = worldToScreen(levelData.exit.x, levelData.exit.y);
  const open = remainingGold() === 0;
  ctx.save();
  ctx.strokeStyle = open ? "#79f2ff" : "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 3;
  ctx.shadowColor = open ? "rgba(121, 242, 255, 0.8)" : "rgba(0,0,0,0)";
  ctx.shadowBlur = open ? 20 : 0;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 16 + Math.sin(perfTime * 2) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  particles.forEach((p) => {
    const screen = worldToScreen(p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawTrail() {
  player.trail.forEach((t) => {
    const screen = worldToScreen(t.x, t.y);
    ctx.fillStyle = `rgba(121, 242, 255, ${t.life})`;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 8 * t.life, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  const screen = worldToScreen(player.x, player.y);
  const run = Math.min(1, Math.abs(player.vx) / 320);
  const swing = Math.sin(perfTime * 12) * run;
  const jumpPose = !player.grounded;
  const armSwing = jumpPose ? 0.4 : swing;
  const legSwing = jumpPose ? 0.6 : swing;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  if (player.invuln > 0 && Math.floor(perfTime * 16) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  if (player.shieldTime > 0) {
    ctx.strokeStyle = "rgba(121, 242, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + Math.sin(perfTime * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.swordTime > 0) {
    ctx.strokeStyle = "rgba(255, 214, 107, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + Math.sin(perfTime * 8) * 2, Math.PI * 0.2, Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.shadowColor = "rgba(121, 242, 255, 0.8)";
  ctx.shadowBlur = player.dash.active ? 16 : 8;

  ctx.fillStyle = "#f1f6ff";
  ctx.beginPath();
  ctx.arc(0, -10, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0b101a";
  ctx.beginPath();
  ctx.arc(2 * player.facing, -11, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f1f6ff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(7 * player.facing * armSwing, 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(-7 * player.facing * armSwing, 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(6 * legSwing, 16);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-6 * legSwing, 16);
  ctx.stroke();

  ctx.strokeStyle = "rgba(121, 242, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3 * player.facing, -6);
  ctx.lineTo(-12 * player.facing - player.vx * 0.01, -2 + Math.sin(perfTime * 6) * 2);
  ctx.stroke();

  ctx.restore();
}

let lastTime = performance.now();
let perfTime = 0;

function tick(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000);
  lastTime = time;
  perfTime = time / 1000;

  if (state.running && !state.paused) {
    update(dt);
  }

  draw();
  requestAnimationFrame(tick);
}

function draw() {
  drawBackground();

  let shakeX = 0;
  let shakeY = 0;
  if (camera.shake > 0) {
    shakeX = (Math.random() - 0.5) * camera.shakeMag;
    shakeY = (Math.random() - 0.5) * camera.shakeMag;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawLevel();
  drawGold();
  drawPickups();
  drawSnipers();
  drawLaunchers();
  drawMines();
  drawExit();
  drawBullets();
  drawRockets();
  drawTrail();
  drawParticles();
  if (player.alive) {
    drawPlayer();
  }
  ctx.restore();
}

buildLevelButtons();
loadLevel(0);
openMenu("menu");
requestAnimationFrame(tick);
