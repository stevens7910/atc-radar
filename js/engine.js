import {
  AIRCRAFT_TYPES,
  MAPS,
  getActiveRunwayDirection,
  getRunwayEndpoints
} from './maps.js';

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Applies gentle Laplacian smoothing to interior waypoints
 * while preserving the start and end points.
 */
function smoothWaypoints(points) {
  if (points.length < 3) return points;
  const smoothed = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    smoothed.push({
      x: prev.x * 0.22 + curr.x * 0.56 + next.x * 0.22,
      y: prev.y * 0.22 + curr.y * 0.56 + next.y * 0.22
    });
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
}

export class GameEngine {
  constructor(audio) {
    this.audio = audio;
    this.width = 800;
    this.height = 600;
    this.scale = 1;

    this.mapId = 'basic';
    this.mapConfig = MAPS.basic;
    this.layout = { runways: [], heliports: [], decor: null };

    this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover'
    this.gameOverReason = 'Narušení separace';
    this.score = 0;
    this.elapsedTime = 0;
    this.wave = 1;

    // Simulation QoL controls
    this.speedMultiplier = 1;
    this.showAllTags = true;
    this.hoveredAircraftId = null;

    // Wind state
    this.windFromDeg = 240;
    this.windFromAngle = ((240 - 90) * Math.PI) / 180;
    this.windKnots = 16;
    this.windTimer = 75;
    this.windShiftFlash = 0;

    this.aircraft = [];
    this.pendingSpawns = [];
    this.storms = [];
    this.stormTimer = 14;
    this.warningPairs = [];
    this.effects = [];
    this.collisionPoint = null;

    this.activeAircraft = null;
    this.nextId = 1;
    this.spawnCount = 0;
    this.spawnTimer = 1.2;
    this.radarAngle = 0;

    this.onStateChange = null;
    this.onWindChange = null;
  }

  resize(width, height) {
    this.width = Math.max(320, width);
    this.height = Math.max(320, height);
    const minDim = Math.min(this.width, this.height);
    this.scale = Math.max(0.65, Math.min(1.25, minDim / 720));
    this._rebuildLayout();
  }

  _rebuildLayout() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    this.layout = this.mapConfig.buildLayout(cx, cy, this.scale, this.width, this.height);
  }

  _randomizeWind(notify = false) {
    const deg = Math.floor(Math.random() * 36) * 10;
    this.windFromDeg = deg === 0 ? 360 : deg;
    this.windFromAngle = ((this.windFromDeg - 90) * Math.PI) / 180;
    this.windKnots = 10 + Math.floor(Math.random() * 18); // 10 - 27 KT
    this.windTimer = 60 + Math.random() * 30; // 60 - 90s
    if (notify) {
      this.windShiftFlash = 3.2;
      this.audio.playWindShift();
    }
    if (this.onWindChange) {
      this.onWindChange(this.windFromDeg, this.windKnots, notify);
    }
  }

  startGame(mapId = 'basic') {
    this.mapId = MAPS[mapId] ? mapId : 'basic';
    this.mapConfig = MAPS[this.mapId];
    this._rebuildLayout();

    this.state = 'playing';
    this.gameOverReason = 'Narušení separace';
    this.score = 0;
    this.elapsedTime = 0;
    this.wave = 1;

    this.aircraft = [];
    this.pendingSpawns = [];
    this.storms = [];
    this.stormTimer = 10;
    this.warningPairs = [];
    this.effects = [];
    this.collisionPoint = null;
    this.activeAircraft = null;
    this.hoveredAircraftId = null;

    this.nextId = 1;
    this.spawnCount = 0;
    this.spawnTimer = 0.6;

    this._randomizeWind(false);

    // Immediately queue 2 initial aircraft
    this._queueSpawn(false);
    this._queueSpawn(false);

    if (this.onStateChange) this.onStateChange(this.state);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.activeAircraft = null;
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
    if (this.onStateChange) this.onStateChange(this.state);
  }

  setMenu() {
    this.state = 'menu';
    this.activeAircraft = null;
    if (this.onStateChange) this.onStateChange(this.state);
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
    return this.speedMultiplier;
  }

  toggleTags() {
    this.showAllTags = !this.showAllTags;
    return this.showAllTags;
  }

  updateHover(x, y) {
    if (this.state !== 'playing') {
      this.hoveredAircraftId = null;
      return;
    }
    const hitRadius = Math.max(24, 24 * this.scale);
    let best = null;
    let bestDist = hitRadius;
    for (const ac of this.aircraft) {
      const d = dist(x, y, ac.x, ac.y);
      if (d <= bestDist) {
        bestDist = d;
        best = ac;
      }
    }
    this.hoveredAircraftId = best ? best.id : null;
  }

  _generateCallsign(typeKey) {
    const customList = this.mapConfig.callsigns?.[typeKey];
    if (customList && customList.length > 0) {
      return customList[Math.floor(Math.random() * customList.length)];
    }
    const typeSpec = AIRCRAFT_TYPES[typeKey];
    const prefixes = typeSpec.callsignPrefixes;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 89);
    return `${prefix}-${num}`;
  }

  _getCurrentSpawnInterval() {
    const progress = Math.min(1, this.score / 45);
    const { baseSpawnInterval, minSpawnInterval } = this.mapConfig;
    return baseSpawnInterval - (baseSpawnInterval - minSpawnInterval) * progress;
  }

  _getMaxConcurrent() {
    const extra = Math.floor(this.score / 5);
    return Math.min(
      this.mapConfig.maxConcurrentCap,
      this.mapConfig.maxConcurrentBase + extra
    );
  }

  _queueSpawn(allowVip = true) {
    this.spawnCount++;
    const isVip =
      allowVip &&
      this.score >= 5 &&
      this.spawnCount % this.mapConfig.vipFrequency === 0;

    let typeKey = 'airliner';
    if (isVip) {
      typeKey = 'vip';
    } else {
      const r = Math.random();
      if (r < 0.42) typeKey = 'airliner';
      else if (r < 0.78) typeKey = 'prop';
      else typeKey = 'helicopter';
    }

    const margin = 34 * this.scale;
    const side = Math.floor(Math.random() * 4);

    let edgeX = 0;
    let edgeY = 0;
    let spawnX = 0;
    let spawnY = 0;

    const padX = Math.min(110, this.width * 0.18);
    const padY = Math.min(110, this.height * 0.18);

    if (side === 0) {
      edgeX = padX + Math.random() * (this.width - padX * 2);
      edgeY = 0;
      spawnX = edgeX;
      spawnY = -margin;
    } else if (side === 1) {
      edgeX = this.width;
      edgeY = padY + Math.random() * (this.height - padY * 2);
      spawnX = this.width + margin;
      spawnY = edgeY;
    } else if (side === 2) {
      edgeX = padX + Math.random() * (this.width - padX * 2);
      edgeY = this.height;
      spawnX = edgeX;
      spawnY = this.height + margin;
    } else {
      edgeX = 0;
      edgeY = padY + Math.random() * (this.height - padY * 2);
      spawnX = -margin;
      spawnY = edgeY;
    }

    const targetX = this.width / 2 + (Math.random() - 0.5) * this.width * 0.25;
    const targetY = this.height / 2 + (Math.random() - 0.5) * this.height * 0.25;
    const heading = Math.atan2(targetY - spawnY, targetX - spawnX);

    const countdown = isVip ? 3.2 : 2.1;

    if (isVip) {
      this.audio.playVipAlert();
    }

    this.pendingSpawns.push({
      id: this.nextId++,
      type: typeKey,
      isVip,
      callsign: this._generateCallsign(typeKey),
      spawnX,
      spawnY,
      edgeX,
      edgeY,
      side,
      heading,
      countdown,
      maxCountdown: countdown
    });
  }

  _materializeSpawn(pending) {
    const typeSpec = AIRCRAFT_TYPES[pending.type];
    const speed = typeSpec.speed * this.scale;

    const ac = {
      id: pending.id,
      type: pending.type,
      shortCode: typeSpec.shortCode,
      isVip: pending.isVip,
      editable: !pending.isVip,
      callsign: pending.callsign,
      color: typeSpec.color,
      confirmColor: typeSpec.confirmColor,
      speed,
      turnRate: typeSpec.turnRate,
      size: typeSpec.size * this.scale,
      fl: typeSpec.baseFl + Math.floor((Math.random() - 0.5) * 20),
      kts: typeSpec.baseKts + Math.floor((Math.random() - 0.5) * 20),
      x: pending.spawnX,
      y: pending.spawnY,
      heading: pending.heading,
      path: [],
      lockedTarget: null,
      lockedAngle: null,
      hasEntered: false,
      warning: false,
      turbulent: false,
      deniedFlash: 0,
      rotorAngle: 0,
      landingScale: 1
    };

    if (ac.isVip) {
      const farDist = Math.hypot(this.width, this.height) + 120;
      ac.path = [
        {
          x: ac.x + Math.cos(ac.heading) * farDist,
          y: ac.y + Math.sin(ac.heading) * farDist
        }
      ];
    }

    this.aircraft.push(ac);
  }

  _spawnStorm() {
    const radius = (56 + Math.random() * 18) * this.scale;
    const coreRadius = radius * 0.42;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = this.width * (0.2 + Math.random() * 0.6);
      y = -radius;
    } else if (side === 1) {
      x = this.width + radius;
      y = this.height * (0.2 + Math.random() * 0.6);
    } else if (side === 2) {
      x = this.width * (0.2 + Math.random() * 0.6);
      y = this.height + radius;
    } else {
      x = -radius;
      y = this.height * (0.2 + Math.random() * 0.6);
    }

    // Aim across the airspace (slightly off-center so it doesn't sit directly on the airport forever)
    const tx = this.width * (0.25 + Math.random() * 0.5);
    const ty = this.height * (0.25 + Math.random() * 0.5);
    const moveAngle = Math.atan2(ty - y, tx - x);
    const moveSpeed = (13 + Math.random() * 6) * this.scale;

    const lobes = [];
    const lobeCount = 7;
    for (let i = 0; i < lobeCount; i++) {
      lobes.push({
        angle: (i / lobeCount) * Math.PI * 2 + Math.random() * 0.4,
        distFactor: 0.25 + Math.random() * 0.3,
        sizeFactor: 0.48 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.storms.push({
      id: this.nextId++,
      x,
      y,
      vx: Math.cos(moveAngle) * moveSpeed,
      vy: Math.sin(moveAngle) * moveSpeed,
      radius,
      coreRadius,
      lobes,
      age: 0,
      maxAge: 36 + Math.random() * 12,
      opacity: 0
    });
  }

  /**
   * Input: Pointer down on canvas
   */
  startDrawing(x, y) {
    if (this.state !== 'playing') return null;

    const hitRadius = Math.max(26, 28 * this.scale);
    let best = null;
    let bestDist = hitRadius;

    for (const ac of this.aircraft) {
      const d = dist(x, y, ac.x, ac.y);
      if (d <= bestDist) {
        bestDist = d;
        best = ac;
      }
    }

    if (!best) return null;

    if (!best.editable) {
      best.deniedFlash = 0.65;
      this.audio.playDenied();
      return null;
    }

    this.activeAircraft = best;
    best.isDrawing = true;
    best.lockedTarget = null;
    best.lockedAngle = null;
    best.path = [{ x: best.x, y: best.y }, { x, y }];
    this.audio.playGrab();
    return best;
  }

  /**
   * Input: Pointer move while drawing
   */
  continueDrawing(x, y) {
    const ac = this.activeAircraft;
    if (!ac || this.state !== 'playing') return;

    if (ac.lockedTarget) {
      const t = ac.lockedTarget;
      const d = dist(x, y, t.x, t.y);
      const unlockDist = t.kind === 'heliport' ? t.radius * 2.2 : t.length * 0.85;
      if (d < unlockDist) {
        return;
      }
      ac.lockedTarget = null;
      ac.lockedAngle = null;
    }

    const last = ac.path[ac.path.length - 1];
    const d = dist(x, y, last.x, last.y);

    if (d >= 13) {
      ac.path.push({ x, y });
      if (ac.path.length > 3) {
        ac.path = smoothWaypoints(ac.path);
      }
      this._tryLockTarget(ac, last, { x, y });
    }
  }

  _tryLockTarget(ac, prevPt, currPt) {
    // 1. Heliports (any direction)
    if (ac.type === 'helicopter') {
      for (const heli of this.layout.heliports) {
        if (dist(currPt.x, currPt.y, heli.x, heli.y) <= heli.radius * 1.3) {
          ac.path.push({ x: heli.x, y: heli.y });
          ac.lockedTarget = heli;
          this.audio.playLock();
          return;
        }
      }
    }

    // 2. Runways (must align with active into-the-wind direction!)
    for (const rwy of this.layout.runways) {
      if (rwy.accepts !== ac.type) continue;

      const { activeAngle } = getActiveRunwayDirection(rwy, this.windFromAngle);
      const cos = Math.cos(activeAngle);
      const sin = Math.sin(activeAngle);
      const dx = currPt.x - rwy.x;
      const dy = currPt.y - rwy.y;

      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;

      const segLen = dist(prevPt.x, prevPt.y, currPt.x, currPt.y);
      const dirX = segLen > 0.001 ? (currPt.x - prevPt.x) / segLen : cos;
      const dirY = segLen > 0.001 ? (currPt.y - prevPt.y) / segLen : sin;
      const dot = dirX * cos + dirY * sin;

      const inCorridor =
        Math.abs(localY) <= rwy.width * 1.2 &&
        localX >= -rwy.length * 0.78 &&
        localX <= rwy.length * 0.35;

      if (inCorridor && dot > 0.25) {
        const ep = getRunwayEndpoints(rwy, activeAngle);
        if (localX < -rwy.length * 0.15) {
          ac.path.push({ x: ep.entryX, y: ep.entryY });
        }
        ac.path.push({ x: rwy.x, y: rwy.y });
        ac.path.push({
          x: rwy.x + ep.dirX * (rwy.length * 0.25),
          y: rwy.y + ep.dirY * (rwy.length * 0.25)
        });
        ac.lockedTarget = rwy;
        ac.lockedAngle = activeAngle;
        this.audio.playLock();
        return;
      }
    }
  }

  endDrawing() {
    if (this.activeAircraft) {
      const ac = this.activeAircraft;
      ac.isDrawing = false;
      if (ac.path.length <= 2 && !ac.lockedTarget) {
        const total =
          ac.path.length === 2
            ? dist(ac.path[0].x, ac.path[0].y, ac.path[1].x, ac.path[1].y)
            : 0;
        if (total < 14) {
          ac.path = [];
        }
      }
      this.activeAircraft = null;
    }
  }

  update(rawDt) {
    const dt = Math.min(0.05, Math.max(0, rawDt));

    // Radar sweep & visual effects run smoothly at 1x
    this.radarAngle = (this.radarAngle + dt * 0.65) % (Math.PI * 2);
    if (this.windShiftFlash > 0) {
      this.windShiftFlash = Math.max(0, this.windShiftFlash - dt);
    }

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.age += dt;
      if (fx.age >= fx.duration) {
        this.effects.splice(i, 1);
      }
    }

    if (this.state !== 'playing') return;

    // Sub-step at 2x speed so collision & waypoint checks stay 100% accurate
    const steps = this.speedMultiplier === 2 ? 2 : 1;
    for (let s = 0; s < steps; s++) {
      if (this.state !== 'playing') break;
      this._stepSimulation(dt);
    }
  }

  _stepSimulation(dt) {
    this.elapsedTime += dt;
    this.wave = 1 + Math.floor(this.score / 5);

    // Wind shift timer
    this.windTimer -= dt;
    if (this.windTimer <= 0) {
      this._randomizeWind(true);
    }

    // Spawn management
    this.spawnTimer -= dt;
    const totalTraffic = this.aircraft.length + this.pendingSpawns.length;
    if (this.spawnTimer <= 0 && totalTraffic < this._getMaxConcurrent()) {
      this._queueSpawn(true);
      this.spawnTimer = this._getCurrentSpawnInterval();
    }

    // Pending spawns
    for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
      const p = this.pendingSpawns[i];
      p.countdown -= dt;
      if (p.countdown <= 0) {
        this._materializeSpawn(p);
        this.pendingSpawns.splice(i, 1);
      }
    }

    // Storm cell spawning & movement
    if (this.mapConfig.stormsEnabled && this.score >= this.mapConfig.stormsMinScore) {
      this.stormTimer -= dt;
      if (this.stormTimer <= 0 && this.storms.length < 2) {
        this._spawnStorm();
        this.stormTimer = 20 + Math.random() * 12;
      }
    }

    for (let i = this.storms.length - 1; i >= 0; i--) {
      const st = this.storms[i];
      st.age += dt;
      st.x += st.vx * dt;
      st.y += st.vy * dt;

      if (st.age < 3) {
        st.opacity = st.age / 3;
      } else if (st.age > st.maxAge - 4) {
        st.opacity = Math.max(0, (st.maxAge - st.age) / 4);
      } else {
        st.opacity = 1;
      }

      if (st.age >= st.maxAge) {
        this.storms.splice(i, 1);
      }
    }

    // Aircraft updates
    const waypointReach = 14 * this.scale;
    const edgeMargin = 20 * this.scale;

    for (let i = this.aircraft.length - 1; i >= 0; i--) {
      const ac = this.aircraft[i];
      ac.warning = false;
      ac.turbulent = false;

      if (ac.deniedFlash > 0) ac.deniedFlash = Math.max(0, ac.deniedFlash - dt);
      if (ac.type === 'helicopter') {
        ac.rotorAngle = (ac.rotorAngle + dt * 18) % (Math.PI * 2);
      }

      if (
        !ac.hasEntered &&
        ac.x >= 8 &&
        ac.x <= this.width - 8 &&
        ac.y >= 8 &&
        ac.y <= this.height - 8
      ) {
        ac.hasEntered = true;
      }

      // Check storm cell interaction
      if (ac.hasEntered) {
        for (const st of this.storms) {
          if (st.opacity < 0.35) continue;
          const dStorm = dist(ac.x, ac.y, st.x, st.y);
          if (dStorm < st.coreRadius) {
            this.state = 'gameover';
            this.gameOverReason = 'Ztráta letadla v silné turbulenci';
            this.activeAircraft = null;
            this.collisionPoint = { x: ac.x, y: ac.y };
            ac.warning = true;
            this.effects.push({
              kind: 'collision',
              x: ac.x,
              y: ac.y,
              color: '#FF3B30',
              age: 0,
              duration: 1.4
            });
            this.audio.playCollision();
            if (this.onStateChange) this.onStateChange(this.state);
            return;
          } else if (dStorm < st.radius) {
            ac.turbulent = true;
            ac.warning = true;
          }
        }
      }

      // Waypoint navigation
      if (ac.path.length > 0) {
        while (
          ac.path.length > 0 &&
          dist(ac.x, ac.y, ac.path[0].x, ac.path[0].y) < waypointReach
        ) {
          ac.path.shift();
        }
      }

      let desiredHeading = ac.heading;
      if (ac.path.length > 0) {
        const nextPt = ac.path[0];
        desiredHeading = Math.atan2(nextPt.y - ac.y, nextPt.x - ac.x);
      } else if (!ac.isVip && ac.hasEntered) {
        if (
          ac.x < edgeMargin ||
          ac.x > this.width - edgeMargin ||
          ac.y < edgeMargin ||
          ac.y > this.height - edgeMargin
        ) {
          desiredHeading = Math.atan2(
            this.height / 2 - ac.y,
            this.width / 2 - ac.x
          );
        }
      }

      const diff = normalizeAngle(desiredHeading - ac.heading);
      const maxTurn = ac.turnRate * dt;
      if (Math.abs(diff) <= maxTurn) {
        ac.heading = desiredHeading;
      } else {
        ac.heading = normalizeAngle(ac.heading + Math.sign(diff) * maxTurn);
      }

      const effectiveSpeed = ac.turbulent ? ac.speed * 0.7 : ac.speed;
      ac.x += Math.cos(ac.heading) * effectiveSpeed * dt;
      ac.y += Math.sin(ac.heading) * effectiveSpeed * dt;

      if (ac.lockedTarget && ac.path.length <= 2) {
        ac.landingScale = Math.max(0.62, ac.landingScale - dt * 0.45);
      } else {
        ac.landingScale = Math.min(1, ac.landingScale + dt * 0.8);
      }

      if (ac.lockedTarget && ac.path.length === 0) {
        this.score += 1;
        this.audio.playLand();
        this.effects.push({
          kind: 'land',
          x: ac.x,
          y: ac.y,
          color: ac.color,
          age: 0,
          duration: 0.65
        });
        if (this.activeAircraft === ac) this.activeAircraft = null;
        this.aircraft.splice(i, 1);
        continue;
      }

      if (
        ac.isVip &&
        ac.hasEntered &&
        (ac.x < -30 ||
          ac.x > this.width + 30 ||
          ac.y < -30 ||
          ac.y > this.height + 30)
      ) {
        this.score += 2;
        this.audio.playLand();
        this.aircraft.splice(i, 1);
        continue;
      }

      if (!ac.isVip && ac.hasEntered && ac.path.length > 0) {
        if (
          ac.x < 4 ||
          ac.x > this.width - 4 ||
          ac.y < 4 ||
          ac.y > this.height - 4
        ) {
          ac.x = Math.max(4, Math.min(this.width - 4, ac.x));
          ac.y = Math.max(4, Math.min(this.height - 4, ac.y));
        }
      }
    }

    // Aircraft-to-aircraft collision & proximity warning
    this.warningPairs = [];
    const collisionDist = 25 * this.scale;
    const warningDist = 74 * this.scale;

    for (let i = 0; i < this.aircraft.length; i++) {
      const a = this.aircraft[i];
      if (!a.hasEntered) continue;

      for (let j = i + 1; j < this.aircraft.length; j++) {
        const b = this.aircraft[j];
        if (!b.hasEntered) continue;

        const d = dist(a.x, a.y, b.x, b.y);
        if (d < collisionDist) {
          this.state = 'gameover';
          this.gameOverReason = 'Narušení separace';
          this.activeAircraft = null;
          this.collisionPoint = {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2
          };
          a.warning = true;
          b.warning = true;
          this.effects.push({
            kind: 'collision',
            x: this.collisionPoint.x,
            y: this.collisionPoint.y,
            color: '#FF3B30',
            age: 0,
            duration: 1.4
          });
          this.audio.playCollision();
          if (this.onStateChange) this.onStateChange(this.state);
          return;
        } else if (d < warningDist) {
          a.warning = true;
          b.warning = true;
          this.warningPairs.push({ a, b, dist: d });
        }
      }
    }

    if (this.warningPairs.length > 0 || this.aircraft.some((a) => a.turbulent)) {
      this.audio.playWarningBeep();
    }
  }
}
