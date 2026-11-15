import { SoundEngine } from './audio.js';
import { GameEngine } from './engine.js';
import { RadarRenderer } from './renderer.js';

const STORAGE_KEY_BEST = 'atc_radar_best_v1';
const STORAGE_KEY_MUTE = 'atc_radar_muted_v1';

function loadBestScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_BEST) || '{}');
  } catch {
    return {};
  }
}

function saveBestScore(mapId, score) {
  const best = loadBestScores();
  const prev = best[mapId] || 0;
  if (score > prev) {
    best[mapId] = score;
    try {
      localStorage.setItem(STORAGE_KEY_BEST, JSON.stringify(best));
    } catch {
      // ignore storage quota errors
    }
    return { isNewRecord: true, best: score };
  }
  return { isNewRecord: false, best: prev };
}

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

const canvas = document.getElementById('radar-canvas');
const audio = new SoundEngine();
const engine = new GameEngine(audio);
const renderer = new RadarRenderer(canvas);

try {
  const savedMute = localStorage.getItem(STORAGE_KEY_MUTE) === 'true';
  audio.setMuted(savedMute);
} catch {
  // ignore
}

// DOM elements
const hudScore = document.getElementById('hud-score');
const hudWave = document.getElementById('hud-wave');
const hudTime = document.getElementById('hud-time');
const btnSpeed = document.getElementById('btn-speed');
const btnTags = document.getElementById('btn-tags');
const btnPause = document.getElementById('btn-pause');
const btnSound = document.getElementById('btn-sound');
const iconSoundOn = document.getElementById('icon-sound-on');
const iconSoundOff = document.getElementById('icon-sound-off');

const windHud = document.getElementById('wind-hud');
const windArrow = document.getElementById('wind-arrow');
const windReadout = document.getElementById('wind-readout');

const modalMenu = document.getElementById('modal-menu');
const modalPause = document.getElementById('modal-pause');
const modalGameOver = document.getElementById('modal-gameover');

const bestBasicEl = document.getElementById('best-basic');
const bestBusyEl = document.getElementById('best-busy');
const bestLkprEl = document.getElementById('best-lkpr');

const goTitleEl = document.getElementById('go-title');
const goScoreEl = document.getElementById('go-score');
const goBestEl = document.getElementById('go-best');
const goMapEl = document.getElementById('go-map');
const goRecordBadge = document.getElementById('go-record-badge');

const btnResume = document.getElementById('btn-resume');
const btnPauseRestart = document.getElementById('btn-pause-restart');
const btnPauseMenu = document.getElementById('btn-pause-menu');
const btnRetry = document.getElementById('btn-retry');
const btnGoMenu = document.getElementById('btn-go-menu');

let selectedMapId = 'basic';
let activePointerId = null;
let lastFrameTime = performance.now();

function updateSoundUI() {
  const muted = audio.isMuted();
  iconSoundOn.classList.toggle('hidden', muted);
  iconSoundOff.classList.toggle('hidden', !muted);
  btnSound.setAttribute('aria-pressed', String(muted));
}

function updateSpeedUI() {
  const is2x = engine.speedMultiplier === 2;
  btnSpeed.textContent = is2x ? '2x' : '1x';
  btnSpeed.classList.toggle('is-active', is2x);
}

function updateTagsUI() {
  btnTags.classList.toggle('is-active', engine.showAllTags);
  btnTags.setAttribute('aria-pressed', String(engine.showAllTags));
}

function updateWindUI(deg, knots) {
  const padded = String(deg).padStart(3, '0');
  windReadout.textContent = `${padded}° / ${knots} KT`;
  windArrow.style.transform = `rotate(${deg}deg)`;
}

function refreshMenuBestScores() {
  const best = loadBestScores();
  bestBasicEl.textContent = best.basic || 0;
  bestBusyEl.textContent = best.busy || 0;
  bestLkprEl.textContent = best.lkpr || 0;
}

function syncUIState(state) {
  modalMenu.classList.toggle('hidden', state !== 'menu');
  modalPause.classList.toggle('hidden', state !== 'paused');
  modalGameOver.classList.toggle('hidden', state !== 'gameover');

  const showHudControls = state === 'playing' || state === 'paused';
  btnPause.classList.toggle('hidden', !showHudControls);
  btnSpeed.classList.toggle('hidden', !showHudControls);
  btnTags.classList.toggle('hidden', !showHudControls);
  windHud.classList.toggle('hidden', !showHudControls);

  if (state === 'menu') {
    refreshMenuBestScores();
  }

  if (state === 'gameover') {
    const { isNewRecord, best } = saveBestScore(engine.mapId, engine.score);
    goTitleEl.textContent = engine.gameOverReason || 'Narušení separace';
    goScoreEl.textContent = engine.score;
    goBestEl.textContent = best;
    goMapEl.textContent = engine.mapConfig.name;
    goRecordBadge.classList.toggle('hidden', !isNewRecord || engine.score === 0);
  }
}

engine.onStateChange = syncUIState;
engine.onWindChange = (deg, knots) => {
  updateWindUI(deg, knots);
};

function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  engine.resize(w, h);
  renderer.resize(w, h);
}

window.addEventListener('resize', handleResize);
handleResize();
updateSoundUI();
updateSpeedUI();
updateTagsUI();
syncUIState('menu');

// Map selection buttons
document.querySelectorAll('[data-map]').forEach((btn) => {
  btn.addEventListener('click', () => {
    audio.init();
    selectedMapId = btn.dataset.map;
    engine.startGame(selectedMapId);
  });
});

// HUD & Modal buttons
btnSpeed.addEventListener('click', () => {
  audio.init();
  engine.toggleSpeed();
  updateSpeedUI();
});

btnTags.addEventListener('click', () => {
  audio.init();
  engine.toggleTags();
  updateTagsUI();
});

btnSound.addEventListener('click', () => {
  audio.init();
  const nextMuted = !audio.isMuted();
  audio.setMuted(nextMuted);
  try {
    localStorage.setItem(STORAGE_KEY_MUTE, String(nextMuted));
  } catch {
    // ignore
  }
  updateSoundUI();
});

btnPause.addEventListener('click', () => {
  audio.init();
  engine.togglePause();
});

btnResume.addEventListener('click', () => {
  audio.init();
  engine.togglePause();
});

btnPauseRestart.addEventListener('click', () => {
  audio.init();
  engine.startGame(selectedMapId);
});

btnPauseMenu.addEventListener('click', () => {
  engine.setMenu();
});

btnRetry.addEventListener('click', () => {
  audio.init();
  engine.startGame(selectedMapId);
});

btnGoMenu.addEventListener('click', () => {
  engine.setMenu();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === ' ') {
    if (engine.state === 'playing' || engine.state === 'paused') {
      e.preventDefault();
      engine.togglePause();
    }
  }
});

// Unified Pointer Events for Touch & Mouse
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

canvas.addEventListener('pointerdown', (e) => {
  audio.init();
  if (engine.state !== 'playing') return;
  if (activePointerId !== null) return;

  const { x, y } = getCanvasCoords(e);
  engine.updateHover(x, y);
  const grabbed = engine.startDrawing(x, y);
  if (grabbed) {
    activePointerId = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  const { x, y } = getCanvasCoords(e);
  if (e.pointerId === activePointerId) {
    engine.continueDrawing(x, y);
  } else if (activePointerId === null) {
    engine.updateHover(x, y);
  }
});

function releasePointer(e) {
  if (e.pointerId !== activePointerId) return;
  engine.endDrawing();
  activePointerId = null;
}

canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);

// Main animation loop
function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  engine.update(dt);
  renderer.render(engine, now);

  if (engine.state === 'playing' || engine.state === 'paused') {
    hudScore.textContent = engine.score;
    hudWave.textContent = `VLNA ${engine.wave}`;
    hudTime.textContent = formatTime(engine.elapsedTime);
    windHud.classList.toggle('is-shifting', engine.windShiftFlash > 0);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
