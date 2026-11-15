import {
  AIRCRAFT_TYPES,
  getActiveRunwayDirection
} from './maps.js';

export class RadarRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.width = 800;
    this.height = 600;
  }

  resize(width, height) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  render(engine, nowMs) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const time = nowMs * 0.001;

    // 1. Background
    ctx.fillStyle = '#080C14';
    ctx.fillRect(0, 0, w, h);

    // 2. Radar Grid & Sweep
    this._drawRadarGrid(ctx, cx, cy, w, h, engine.radarAngle, engine.scale);

    // 3. Map background decor (e.g. Vltava river & VOR beacons on LKPR)
    if (engine.layout.decor) {
      this._drawMapDecor(ctx, engine.layout.decor, engine.scale);
    }

    // 4. Storm Cells (Weather Radar Echoes)
    for (const storm of engine.storms) {
      this._drawStorm(ctx, storm, time);
    }

    // 5. Runways & Heliports (with active into-the-wind PAPI/ILS arrows)
    const activeType = engine.activeAircraft ? engine.activeAircraft.type : null;
    for (const rwy of engine.layout.runways) {
      this._drawRunway(
        ctx,
        rwy,
        engine.windFromAngle,
        activeType === rwy.accepts,
        time,
        engine.scale
      );
    }
    for (const heli of engine.layout.heliports) {
      this._drawHeliport(ctx, heli, activeType === heli.accepts, time, engine.scale);
    }

    // 6. Flight Paths
    for (const ac of engine.aircraft) {
      this._drawPath(ctx, ac, time, engine.scale);
    }

    // 7. Proximity Warning Links
    for (const pair of engine.warningPairs) {
      this._drawWarningLink(ctx, pair.a, pair.b, time);
    }

    // 8. Aircraft & Safety Circles
    for (const ac of engine.aircraft) {
      const showTag =
        engine.showAllTags ||
        engine.hoveredAircraftId === ac.id ||
        ac.isDrawing ||
        ac.warning ||
        ac.deniedFlash > 0;
      this._drawAircraft(ctx, ac, showTag, time, engine.scale);
    }

    // 9. Pending Spawn Edge Warnings
    for (const pending of engine.pendingSpawns) {
      this._drawSpawnWarning(ctx, pending, w, h, time, engine.scale);
    }

    // 10. Visual Effects
    for (const fx of engine.effects) {
      this._drawEffect(ctx, fx, engine.scale);
    }
  }

  _drawRadarGrid(ctx, cx, cy, w, h, radarAngle, scale) {
    const maxR = Math.hypot(w, h) * 0.55;
    const step = 110 * scale;

    ctx.save();
    ctx.strokeStyle = '#132A3A';
    ctx.lineWidth = 1;

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Diagonal faint sector lines
    ctx.strokeStyle = 'rgba(19, 42, 58, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - maxR, cy - maxR);
    ctx.lineTo(cx + maxR, cy + maxR);
    ctx.moveTo(cx + maxR, cy - maxR);
    ctx.lineTo(cx - maxR, cy + maxR);
    ctx.stroke();

    // Concentric range rings
    ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.36)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    let ringIndex = 1;
    for (let r = step; r < maxR; r += step) {
      ctx.strokeStyle = ringIndex % 2 === 0 ? '#132A3A' : 'rgba(19, 42, 58, 0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      if (ringIndex <= 4) {
        ctx.fillText(`${ringIndex * 10} NM`, cx + 6, cy - r + 13);
      }
      ringIndex++;
    }

    // Rotating radar sweep cone
    const sweepSpan = 0.55;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.03)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, radarAngle - sweepSpan, radarAngle);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(radarAngle) * maxR,
      cy + Math.sin(radarAngle) * maxR
    );
    ctx.stroke();

    ctx.restore();
  }

  _drawMapDecor(ctx, decor, scale) {
    ctx.save();

    // Subtle Vltava river meander
    if (decor.vltava && decor.vltava.length > 1) {
      ctx.strokeStyle = '#0F2230';
      ctx.lineWidth = 7 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(decor.vltava[0].x, decor.vltava[0].y);
      for (let i = 1; i < decor.vltava.length - 1; i++) {
        const xc = (decor.vltava[i].x + decor.vltava[i + 1].x) / 2;
        const yc = (decor.vltava[i].y + decor.vltava[i + 1].y) / 2;
        ctx.quadraticCurveTo(decor.vltava[i].x, decor.vltava[i].y, xc, yc);
      }
      const last = decor.vltava[decor.vltava.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }

    // VOR / radio beacons
    if (decor.vors) {
      ctx.font = `600 ${Math.round(9 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (const vor of decor.vors) {
        ctx.strokeStyle = '#143044';
        ctx.fillStyle = '#0F2230';
        ctx.lineWidth = 1.2;

        // Hexagon VOR symbol
        const r = 5 * scale;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          const px = vor.x + Math.cos(a) * r;
          const py = vor.y + Math.sin(a) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(123, 150, 168, 0.42)';
        ctx.fillText(vor.code, vor.x, vor.y + 7 * scale);
      }
    }

    ctx.restore();
  }

  _drawStorm(ctx, storm, time) {
    if (storm.opacity <= 0.01) return;

    ctx.save();
    ctx.translate(storm.x, storm.y);
    ctx.globalAlpha = storm.opacity;

    // Helper to draw multi-lobe organic echo layer
    const drawLayer = (scaleFactor, fillStyle) => {
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.arc(0, 0, storm.radius * 0.68 * scaleFactor, 0, Math.PI * 2);
      for (const lobe of storm.lobes) {
        const wobble = Math.sin(time * 1.1 + lobe.phase) * 0.06;
        const lx = Math.cos(lobe.angle + wobble) * storm.radius * lobe.distFactor * scaleFactor;
        const ly = Math.sin(lobe.angle + wobble) * storm.radius * lobe.distFactor * scaleFactor;
        const lr = storm.radius * lobe.sizeFactor * scaleFactor;
        ctx.moveTo(lx + lr, ly);
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    // Outer green weather echo (turbulence zone)
    drawLayer(1.0, 'rgba(34, 197, 94, 0.22)');

    // Middle yellow echo
    drawLayer(0.7, 'rgba(250, 204, 21, 0.26)');

    // Inner pulsing red core (fatal zone)
    const corePulse = 0.94 + 0.08 * Math.sin(time * 5);
    drawLayer(0.42 * corePulse, 'rgba(255, 59, 48, 0.44)');

    // Subtle turbulence boundary ring
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, storm.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  _drawRunway(ctx, rwy, windFromAngle, highlight, time, scale) {
    const { activeAngle, activeCode, inactiveCode } = getActiveRunwayDirection(
      rwy,
      windFromAngle
    );

    ctx.save();
    ctx.translate(rwy.x, rwy.y);
    ctx.rotate(activeAngle);

    const hw = rwy.length / 2;
    const hh = rwy.width / 2;

    if (highlight) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 7);
      ctx.shadowColor = rwy.color;
      ctx.shadowBlur = 14 + pulse * 10;
      ctx.strokeStyle = rwy.color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-hw - 5, -hh - 5, rwy.length + 10, rwy.width + 10);
      ctx.shadowBlur = 0;
    }

    // Subtle ILS approach beam extending from active threshold (-hw)
    const beamLen = 58 * scale;
    const beamGrad = ctx.createLinearGradient(-hw - beamLen, 0, -hw, 0);
    beamGrad.addColorStop(0, 'rgba(0,0,0,0)');
    beamGrad.addColorStop(1, highlight ? 'rgba(226, 241, 248, 0.22)' : 'rgba(226, 241, 248, 0.08)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-hw, -hh * 0.45);
    ctx.lineTo(-hw - beamLen, -hh * 1.45);
    ctx.lineTo(-hw - beamLen, hh * 1.45);
    ctx.lineTo(-hw, hh * 0.45);
    ctx.closePath();
    ctx.fill();

    // Runway surface
    ctx.fillStyle = '#0D1726';
    ctx.fillRect(-hw, -hh, rwy.length, rwy.width);

    // Runway border
    ctx.strokeStyle = rwy.color;
    ctx.lineWidth = 1.75;
    ctx.strokeRect(-hw, -hh, rwy.length, rwy.width);

    // Dashed centerline
    ctx.strokeStyle = 'rgba(226, 241, 248, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7 * scale, 6 * scale]);
    ctx.beginPath();
    ctx.moveTo(-hw + 14 * scale, 0);
    ctx.lineTo(hw - 14 * scale, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Active threshold piano keys (-hw)
    ctx.fillStyle = rwy.color;
    const stripeCount = 3;
    const stripeGap = rwy.width / (stripeCount + 1);
    for (let i = 1; i <= stripeCount; i++) {
      const y = -hh + i * stripeGap - 1.2;
      ctx.fillRect(-hw + 3, y, 7 * scale, 2.4);
    }

    // Animated PAPI / approach chevrons on active end (-hw)
    for (let k = 0; k < 2; k++) {
      const phase = (time * 3 - k * 0.45) % 1;
      const alpha = Math.max(0.2, 1 - Math.abs(phase - 0.5) * 2);
      ctx.strokeStyle = rwy.color;
      ctx.globalAlpha = highlight ? 1 : alpha;
      ctx.lineWidth = 2;
      const ax = -hw - (10 + k * 9) * scale;
      ctx.beginPath();
      ctx.moveTo(ax - 5 * scale, -4.5 * scale);
      ctx.lineTo(ax, 0);
      ctx.lineTo(ax - 5 * scale, 4.5 * scale);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Active runway code (bright) & inactive opposite code (dimmed)
    ctx.font = `700 ${Math.round(9.5 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rwy.color;
    ctx.fillText(activeCode, -hw + 20 * scale, 0);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.fillText(inactiveCode, hw - 14 * scale, 0);

    ctx.restore();
  }

  _drawHeliport(ctx, heli, highlight, time, scale) {
    ctx.save();
    ctx.translate(heli.x, heli.y);

    if (highlight) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 7);
      ctx.shadowColor = heli.color;
      ctx.shadowBlur = 14 + pulse * 10;
      ctx.strokeStyle = heli.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, heli.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#0D1726';
    ctx.beginPath();
    ctx.arc(0, 0, heli.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = heli.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, heli.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, heli.radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = heli.color;
    ctx.font = `700 ${Math.round(15 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 0, 1);

    ctx.restore();
  }

  _drawPath(ctx, ac, time, scale) {
    if (!ac.path || ac.path.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ac.x, ac.y);
    for (const pt of ac.path) {
      ctx.lineTo(pt.x, pt.y);
    }

    if (ac.isVip) {
      ctx.strokeStyle = 'rgba(255, 59, 48, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8 * scale, 7 * scale]);
      ctx.lineDashOffset = -time * 40;
      ctx.stroke();
    } else if (ac.lockedTarget) {
      ctx.strokeStyle = ac.confirmColor;
      ctx.lineWidth = 2.6;
      ctx.shadowColor = ac.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const end = ac.path[ac.path.length - 1];
      ctx.fillStyle = ac.confirmColor;
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = ac.color;
      ctx.globalAlpha = 0.78;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6 * scale, 5 * scale]);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawWarningLink(ctx, a, b, time) {
    ctx.save();
    const alpha = 0.45 + 0.45 * Math.sin(time * 14);
    ctx.strokeStyle = `rgba(255, 59, 48, ${alpha})`;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  _drawAircraft(ctx, ac, showTag, time, scale) {
    const jx = ac.turbulent ? Math.sin(time * 55 + ac.id) * 2.2 * scale : 0;
    const jy = ac.turbulent ? Math.cos(time * 49 + ac.id) * 2.2 * scale : 0;

    ctx.save();
    ctx.translate(ac.x + jx, ac.y + jy);

    // Safety zone circle
    const safetyRadius = 24 * scale;
    if (ac.warning) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 14);
      ctx.fillStyle = `rgba(255, 59, 48, ${0.1 + pulse * 0.14})`;
      ctx.strokeStyle = `rgba(255, 59, 48, ${0.65 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, safetyRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (ac.isDrawing) {
      ctx.strokeStyle = ac.color;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, safetyRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = 'rgba(226, 241, 248, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, safetyRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Aircraft icon
    ctx.save();
    ctx.rotate(ac.heading + Math.PI / 2);
    const s = (ac.size / 14) * ac.landingScale;
    ctx.scale(s, s);

    let bodyColor = '#E2F1F8';
    if (ac.isVip) {
      bodyColor = Math.sin(time * 12) > 0 ? '#FF3B30' : '#FFE4E6';
    } else if (ac.warning) {
      bodyColor = '#FF9500';
    }

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = ac.color;
    ctx.lineWidth = 1.2;

    if (ac.type === 'airliner' || ac.type === 'vip') {
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(3, -5);
      ctx.lineTo(14, 2);
      ctx.lineTo(14, 5);
      ctx.lineTo(3, 2);
      ctx.lineTo(2, 10);
      ctx.lineTo(7, 13);
      ctx.lineTo(7, 15);
      ctx.lineTo(0, 13);
      ctx.lineTo(-7, 15);
      ctx.lineTo(-7, 13);
      ctx.lineTo(-2, 10);
      ctx.lineTo(-3, 2);
      ctx.lineTo(-14, 5);
      ctx.lineTo(-14, 2);
      ctx.lineTo(-3, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (ac.type === 'prop') {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(2.2, -4);
      ctx.lineTo(13, -3);
      ctx.lineTo(13, 0.5);
      ctx.lineTo(2, 0.5);
      ctx.lineTo(1.5, 9);
      ctx.lineTo(5.5, 11.5);
      ctx.lineTo(5.5, 13.5);
      ctx.lineTo(0, 12);
      ctx.lineTo(-5.5, 13.5);
      ctx.lineTo(-5.5, 11.5);
      ctx.lineTo(-1.5, 9);
      ctx.lineTo(-2, 0.5);
      ctx.lineTo(-13, 0.5);
      ctx.lineTo(-13, -3);
      ctx.lineTo(-2.2, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -2, 4.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillRect(-1, 5, 2, 8);
      ctx.fillRect(-3.5, 12, 7, 1.8);

      ctx.save();
      ctx.translate(0, -2);
      ctx.rotate(ac.rotorAngle);
      ctx.strokeStyle = ac.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 12);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // 2-line Monospace Data Tag
    if (showTag) {
      const tagY = 20 * scale;
      ctx.font = `600 ${Math.round(10 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      if (ac.deniedFlash > 0) {
        ctx.fillStyle = '#FF3B30';
        ctx.fillText('VIP PRIORITA', 0, tagY);
      } else if (ac.turbulent) {
        ctx.fillStyle = '#FACC15';
        ctx.fillText(ac.callsign, 0, tagY);
        ctx.font = `${Math.round(9 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = '#FF9500';
        ctx.fillText(`TURB / ${Math.round(ac.kts * 0.7)}kt`, 0, tagY + 11 * scale);
      } else {
        ctx.fillStyle = ac.isVip ? '#FF6961' : ac.color;
        ctx.fillText(ac.callsign, 0, tagY);
        ctx.font = `${Math.round(9 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = 'rgba(226, 241, 248, 0.65)';
        ctx.fillText(`${ac.shortCode} / ${ac.kts}kt`, 0, tagY + 11 * scale);
      }
    }

    ctx.restore();
  }

  _drawSpawnWarning(ctx, pending, w, h, time, scale) {
    const spec = AIRCRAFT_TYPES[pending.type];
    const inset = 24 * scale;
    const x = Math.max(inset, Math.min(w - inset, pending.edgeX));
    const y = Math.max(inset, Math.min(h - inset, pending.edgeY));

    const pulse = 0.55 + 0.45 * Math.sin(time * 10);

    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = spec.color;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(pending.heading);
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.lineTo(-4 * scale, -6 * scale);
    ctx.lineTo(-2 * scale, 0);
    ctx.lineTo(-4 * scale, 6 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#E2F1F8';
    ctx.font = `700 ${Math.round(10 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const secs = Math.ceil(pending.countdown);
    ctx.fillText(pending.isVip ? `VIP ${secs}` : `${secs}`, 0, -22 * scale);

    ctx.restore();
  }

  _drawEffect(ctx, fx, scale) {
    const t = Math.min(1, fx.age / fx.duration);
    ctx.save();
    ctx.translate(fx.x, fx.y);

    if (fx.kind === 'land') {
      const r = (10 + t * 32) * scale;
      ctx.strokeStyle = fx.color;
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.kind === 'collision') {
      const r = (12 + t * 65) * scale;
      ctx.strokeStyle = '#FF3B30';
      ctx.globalAlpha = (1 - t) * 0.95;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 59, 48, ${(1 - t) * 0.35})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
