const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const pauseBtn = document.querySelector("#pauseBtn");
const restartBtn = document.querySelector("#restartBtn");
const soundBtn = document.querySelector("#soundBtn");
const messageEl = document.querySelector("#message");

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  score: 0,
  paused: false,
  soundOn: true,
  lastTime: 0,
  lastCatch: 0,
  effects: [],
  seaPlants: [],
  audioCtx: null,
};

const FISH_COUNT = 4;
const fishes = [];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  const baseRadius = Math.max(36, Math.min(58, Math.min(state.width, state.height) * 0.095));
  for (const fish of fishes) {
    fish.radius = baseRadius * fish.sizeScale;
  }
  createPlants();
  for (const fish of fishes) {
    keepFishInside(fish);
  }
}

function createPlants() {
  const count = Math.max(8, Math.floor(state.width / 110));
  state.seaPlants = Array.from({ length: count }, (_, index) => ({
    x: (index / Math.max(1, count - 1)) * state.width + randomBetween(-18, 18),
    height: randomBetween(56, 128),
    sway: randomBetween(0.5, 1.6),
    color: index % 3 === 0 ? "#06d6a0" : index % 3 === 1 ? "#2ec4b6" : "#84dcc6",
  }));
}

function keepFishInside(fish) {
  const pad = fish.radius + 16;
  fish.x = Math.min(Math.max(fish.x || state.width * 0.5, pad), state.width - pad);
  fish.y = Math.min(Math.max(fish.y || state.height * 0.5, pad + 74), state.height - pad);
}

function spawnFish(fish = createFish()) {
  const pad = fish.radius + 22;
  const topPad = Math.max(112, pad);
  fish.x = randomBetween(pad, Math.max(pad, state.width - pad));
  fish.y = randomBetween(topPad, Math.max(topPad, state.height - pad));
  const angle = randomBetween(0, Math.PI * 2);
  const speed = fish.speed;
  fish.vx = Math.cos(angle) * speed;
  fish.vy = Math.sin(angle) * speed;
  fish.visible = true;
  fish.popScale = 0;
  return fish;
}

function createFish(index = fishes.length) {
  const palette = [18, 51, 142, 194, 284];
  const baseRadius = Math.max(36, Math.min(58, Math.min(state.width || 640, state.height || 640) * 0.095));
  const sizeScale = randomBetween(0.86, 1.14);
  return {
    id: index,
    x: 0,
    y: 0,
    radius: baseRadius * sizeScale,
    sizeScale,
    speed: randomBetween(58, 138),
    vx: 95,
    vy: 70,
    hue: palette[index % palette.length] + randomBetween(-10, 10),
    visible: true,
    popScale: 1,
    wiggleOffset: randomBetween(0, Math.PI * 2),
  };
}

function createFishGroup() {
  fishes.length = 0;
  for (let i = 0; i < FISH_COUNT; i += 1) {
    fishes.push(spawnFish(createFish(i)));
  }
}

function setScore(value) {
  state.score = value;
  scoreEl.textContent = String(value);
}

function drawBackground(time) {
  ctx.clearRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    const y = 118 + i * 86 + Math.sin(time * 0.001 + i) * 10;
    ctx.beginPath();
    for (let x = -40; x < state.width + 50; x += 24) {
      const waveY = y + Math.sin(x * 0.024 + time * 0.0016 + i) * 7;
      if (x === -40) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
  ctx.restore();

  drawSeaFloor(time);
}

function drawSeaFloor(time) {
  const floorY = state.height - 50;

  ctx.save();
  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.moveTo(0, state.height);
  ctx.lineTo(0, floorY);
  for (let x = 0; x <= state.width; x += 44) {
    ctx.quadraticCurveTo(x + 22, floorY - 12 + Math.sin(time * 0.001 + x) * 4, x + 44, floorY);
  }
  ctx.lineTo(state.width, state.height);
  ctx.closePath();
  ctx.fill();

  for (const plant of state.seaPlants) {
    const bend = Math.sin(time * 0.0012 * plant.sway + plant.x) * 12;
    ctx.strokeStyle = plant.color;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(plant.x, state.height - 24);
    ctx.quadraticCurveTo(plant.x + bend, state.height - plant.height * 0.55, plant.x + bend * 0.5, state.height - plant.height);
    ctx.stroke();
  }
  ctx.restore();
}

function updateFish(fish, delta) {
  if (!fish.visible) return;

  fish.x += fish.vx * delta;
  fish.y += fish.vy * delta;

  const topPad = Math.max(104, fish.radius + 16);
  const bottomPad = fish.radius + 62;
  const sidePad = fish.radius + 14;

  if (fish.x < sidePad || fish.x > state.width - sidePad) {
    fish.x = Math.min(Math.max(fish.x, sidePad), state.width - sidePad);
    fish.vx *= -1;
  }

  if (fish.y < topPad || fish.y > state.height - bottomPad) {
    fish.y = Math.min(Math.max(fish.y, topPad), state.height - bottomPad);
    fish.vy *= -1;
  }

  fish.popScale = Math.min(1, fish.popScale + delta * 5);
}

function drawFish(fish, time) {
  if (!fish.visible) return;

  const facing = fish.vx >= 0 ? 1 : -1;
  const wiggle = Math.sin(time * 0.012 + fish.wiggleOffset) * 0.14;
  const scale = fish.popScale;

  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.scale(facing * scale, scale);
  ctx.rotate(wiggle);

  const bodyColor = `hsl(${fish.hue} 86% 62%)`;
  const finColor = `hsl(${(fish.hue + 34) % 360} 92% 70%)`;

  ctx.fillStyle = "rgba(5, 45, 79, 0.18)";
  ctx.beginPath();
  ctx.ellipse(-4, fish.radius * 0.72, fish.radius * 0.76, fish.radius * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = finColor;
  ctx.beginPath();
  ctx.moveTo(-fish.radius * 0.82, 0);
  ctx.lineTo(-fish.radius * 1.45, -fish.radius * 0.52);
  ctx.lineTo(-fish.radius * 1.35, fish.radius * 0.52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.radius * 0.98, fish.radius * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = finColor;
  ctx.beginPath();
  ctx.moveTo(-fish.radius * 0.1, -fish.radius * 0.12);
  ctx.quadraticCurveTo(-fish.radius * 0.34, -fish.radius * 0.78, fish.radius * 0.32, -fish.radius * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(fish.radius * 0.42, -fish.radius * 0.14, fish.radius * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#07334c";
  ctx.beginPath();
  ctx.arc(fish.radius * 0.46, -fish.radius * 0.13, fish.radius * 0.065, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(fish.radius * 0.62, fish.radius * 0.1, fish.radius * 0.13, 0.2, 1.8);
  ctx.stroke();

  ctx.restore();
}

function createCatchEffects(x, y) {
  const colors = ["#ffffff", "#ffd166", "#ef476f", "#06d6a0", "#a7f3ff"];
  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18 + randomBetween(-0.2, 0.2);
    const speed = randomBetween(90, 210);
    state.effects.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0.72,
      maxLife: 0.72,
      size: randomBetween(7, 16),
      color: colors[i % colors.length],
      kind: i % 3 === 0 ? "star" : "bubble",
    });
  }
}

function updateEffects(delta) {
  for (const effect of state.effects) {
    effect.x += effect.vx * delta;
    effect.y += effect.vy * delta;
    effect.vy -= 35 * delta;
    effect.life -= delta;
  }
  state.effects = state.effects.filter((effect) => effect.life > 0);
}

function drawStar(x, y, radius, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEffects() {
  for (const effect of state.effects) {
    const progress = effect.life / effect.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, progress);
    if (effect.kind === "star") {
      drawStar(effect.x, effect.y, effect.size, effect.color);
    } else {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * (1.1 - progress * 0.35), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.remove("show");
  window.setTimeout(() => messageEl.classList.add("show"), 20);
}

function playPop() {
  if (!state.soundOn) return;

  state.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  const now = state.audioCtx.currentTime;
  const oscillator = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, now);
  oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.connect(gain);
  gain.connect(state.audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.18);
}

function catchFish(x, y) {
  const now = performance.now();
  if (now - state.lastCatch < 100 || state.paused) return;

  let caughtFish = null;
  for (const fish of fishes) {
    if (!fish.visible) continue;
    const dx = x - fish.x;
    const dy = y - fish.y;
    const hitRadius = fish.radius * 1.18;
    if (Math.hypot(dx, dy) <= hitRadius) {
      caughtFish = fish;
      break;
    }
  }

  if (!caughtFish) return;

  state.lastCatch = now;
  caughtFish.visible = false;
  setScore(state.score + 1);
  createCatchEffects(caughtFish.x, caughtFish.y);
  showMessage("抓到啦！");
  playPop();
  window.setTimeout(() => spawnFish(caughtFish), 240);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function frame(time) {
  const delta = Math.min(0.032, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;

  if (!state.paused) {
    for (const fish of fishes) {
      updateFish(fish, delta);
    }
    updateEffects(delta);
  }

  drawBackground(time);
  drawEffects();
  for (const fish of fishes) {
    drawFish(fish, time);
  }
  requestAnimationFrame(frame);
}

function setPaused(paused) {
  state.paused = paused;
  pauseBtn.setAttribute("aria-label", paused ? "继续" : "暂停");
  pauseBtn.title = paused ? "继续" : "暂停";
  pauseBtn.querySelector("span").textContent = paused ? "▶" : "Ⅱ";
  if (paused) showMessage("暂停");
}

function restart() {
  setScore(0);
  state.effects = [];
  setPaused(false);
  createFishGroup();
  showMessage("开始！");
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  catchFish(...Object.values(pointerPosition(event)));
});

pauseBtn.addEventListener("click", () => setPaused(!state.paused));
restartBtn.addEventListener("click", restart);
soundBtn.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundBtn.setAttribute("aria-label", state.soundOn ? "关闭音效" : "打开音效");
  soundBtn.title = state.soundOn ? "关闭音效" : "打开音效";
  soundBtn.querySelector("span").textContent = state.soundOn ? "♪" : "×";
});

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);

resize();
createFishGroup();
requestAnimationFrame(frame);
