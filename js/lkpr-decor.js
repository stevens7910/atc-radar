/**
 * High-detail architectural & geographic renderer for Prague Airport (LKPR / Ruzyně).
 * Rendered beneath runways, paths, and aircraft so gameplay readability stays crisp.
 */

function drawPolygon(ctx, pts, fillStyle, strokeStyle = null, lineWidth = 1) {
  if (!pts || pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawPolyline(ctx, pts, strokeStyle, lineWidth, dash = null) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a 2.5D top-down architectural building with subtle drop shadow, roof highlight, and optional ribs.
 */
function drawBuilding(ctx, x, y, w, h, angle, options = {}) {
  const {
    fill = '#18293B',
    roof = '#22384F',
    stroke = '#2D4A66',
    ribs = 0,
    shadowOffset = 2.5
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Drop shadow
  ctx.fillStyle = 'rgba(2, 6, 12, 0.6)';
  ctx.fillRect(-w / 2 + shadowOffset, -h / 2 + shadowOffset, w, h);

  // Main footprint
  ctx.fillStyle = fill;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Inner roof deck
  ctx.fillStyle = roof;
  ctx.fillRect(-w / 2 + 1.5, -h / 2 + 1.5, Math.max(1, w - 3), Math.max(1, h - 3));

  // Optional structural roof ribs (hangars / terminal skylights)
  if (ribs > 0) {
    ctx.strokeStyle = 'rgba(148, 197, 232, 0.16)';
    ctx.lineWidth = 0.8;
    const step = w / (ribs + 1);
    ctx.beginPath();
    for (let i = 1; i <= ribs; i++) {
      const rx = -w / 2 + i * step;
      ctx.moveTo(rx, -h / 2 + 2);
      ctx.lineTo(rx, h / 2 - 2);
    }
    ctx.stroke();
  }

  // Crisp architectural outline
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  ctx.restore();
}

/**
 * Draws a realistic cluster of miniature urban / village buildings around the airport.
 */
function drawUrbanCluster(ctx, baseX, baseY, scale, seed, count, spreadX, spreadY, label) {
  ctx.save();
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const bx = baseX + (rand() - 0.5) * spreadX * scale;
    const by = baseY + (rand() - 0.5) * spreadY * scale;
    const bw = (4.5 + rand() * 8.5) * scale;
    const bh = (3.5 + rand() * 6.5) * scale;
    const ang = (rand() - 0.5) * 0.5;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(18, 33, 49, 0.72)';
    ctx.strokeStyle = 'rgba(42, 74, 102, 0.35)';
    ctx.lineWidth = 0.7;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();
  }

  if (label) {
    ctx.fillStyle = 'rgba(123, 150, 168, 0.36)';
    ctx.font = `600 ${Math.round(8.5 * scale)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, baseX, baseY + (spreadY * 0.52 + 8) * scale);
  }
  ctx.restore();
}

export function drawLkprEnvironment(ctx, cx, cy, scale, width, height, time) {
  const s = scale;
  const pt = (dx, dy) => [cx + dx * s, cy + dy * s];

  ctx.save();

  // 1. Natural Parklands (Divoká Šárka & Obora Hvězda)
  drawPolygon(
    ctx,
    [
      pt(125, -45),
      pt(185, -62),
      pt(215, -18),
      pt(195, 32),
      pt(140, 22),
      pt(118, -10)
    ],
    'rgba(16, 48, 42, 0.28)',
    'rgba(34, 96, 78, 0.22)',
    1
  );
  drawPolygon(
    ctx,
    [
      pt(112, 68),
      pt(166, 62),
      pt(178, 108),
      pt(126, 118)
    ],
    'rgba(16, 48, 42, 0.25)',
    'rgba(34, 96, 78, 0.2)',
    1
  );

  // Parkland labels
  ctx.fillStyle = 'rgba(72, 148, 120, 0.34)';
  ctx.font = `600 ${Math.round(8 * s)}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('DIVOKÁ ŠÁRKA', cx + 166 * s, cy - 16 * s);
  ctx.fillText('OBORA HVĚZDA', cx + 145 * s, cy + 92 * s);

  // 2. Surrounding Prague Neighborhoods & Villages (realistic building clusters)
  drawUrbanCluster(ctx, cx - 138 * s, cy - 92 * s, s, 101, 18, 62, 42, 'KNĚŽEVES');
  drawUrbanCluster(ctx, cx + 12 * s, cy - 134 * s, s, 202, 16, 68, 34, 'PŘEDNÍ KOPANINA');
  drawUrbanCluster(ctx, cx + 145 * s, cy - 102 * s, s, 303, 20, 66, 44, 'NEBUŠICE');
  drawUrbanCluster(ctx, cx + 122 * s, cy + 126 * s, s, 404, 24, 82, 50, 'RUZYNĚ / ŘEPY');
  drawUrbanCluster(ctx, cx - 134 * s, cy + 106 * s, s, 505, 22, 74, 48, 'HOSTIVICE');
  drawUrbanCluster(ctx, cx - 178 * s, cy + 10 * s, s, 606, 15, 48, 56, 'JENEČ');

  // 3. Major Highways (Dálnice D7 / Evropská & Pražský okruh D0)
  const d7 = [
    [0, cy - 145 * s],
    pt(-100, -108),
    pt(-20, -96),
    pt(62, -88),
    pt(138, -68),
    [width, cy - 46 * s]
  ];
  drawPolyline(ctx, d7, '#132638', 5.5 * s);
  drawPolyline(ctx, d7, 'rgba(148, 197, 232, 0.16)', 1 * s, [6 * s, 6 * s]);

  const d0 = [
    [0, cy + 148 * s],
    pt(-125, 118),
    pt(-45, 128),
    pt(58, 134),
    pt(145, 162),
    [width, cy + 185 * s]
  ];
  drawPolyline(ctx, d0, '#132638', 5 * s);
  drawPolyline(ctx, d0, 'rgba(148, 197, 232, 0.14)', 1 * s, [6 * s, 6 * s]);

  // Highway shields
  const drawShield = (x, y, text) => {
    ctx.fillStyle = '#122A3C';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 11 * s, y - 6 * s, 22 * s, 12 * s);
    ctx.strokeRect(x - 11 * s, y - 6 * s, 22 * s, 12 * s);
    ctx.fillStyle = 'rgba(186, 220, 242, 0.55)';
    ctx.font = `700 ${Math.round(7.5 * s)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5);
  };
  drawShield(cx + 88 * s, cy - 82 * s, 'D7');
  drawShield(cx - 72 * s, cy + 124 * s, 'D0');

  // 4. Airfield Perimeter Turf & Security Fence
  const airfieldPoly = [
    pt(-104, 48),
    pt(-88, -8),
    pt(-66, -78),
    pt(34, -82),
    pt(96, -42),
    pt(104, 54),
    pt(52, 92),
    pt(-54, 102)
  ];
  drawPolygon(ctx, airfieldPoly, 'rgba(13, 30, 38, 0.72)', 'rgba(34, 72, 94, 0.45)', 1.2);
  ctx.save();
  ctx.setLineDash([4 * s, 4 * s]);
  drawPolygon(ctx, airfieldPoly, null, 'rgba(56, 189, 248, 0.16)', 0.9);
  ctx.restore();

  // 5. Concrete Aprons (Apron North, Apron South / Staré letiště, Cargo)
  // Apron North (around T1 & T2)
  drawPolygon(
    ctx,
    [
      pt(-62, -20),
      pt(-44, -64),
      pt(28, -68),
      pt(44, -36),
      pt(4, -18)
    ],
    '#111F2E',
    'rgba(78, 118, 148, 0.35)',
    1
  );

  // Apron South (Staré letiště — Terminál 3 & Hangáry)
  drawPolygon(
    ctx,
    [
      pt(-48, 54),
      pt(36, 48),
      pt(46, 86),
      pt(-42, 94)
    ],
    '#111F2E',
    'rgba(78, 118, 148, 0.35)',
    1
  );

  // Cargo Apron (East)
  drawPolygon(
    ctx,
    [
      pt(54, -14),
      pt(84, -22),
      pt(92, 16),
      pt(66, 22)
    ],
    '#101D2B',
    'rgba(78, 118, 148, 0.28)',
    1
  );

  // 6. Taxiway Network (TWY A parallel to 06/24, rapid exits B/C/D/F, TWY L/P to South)
  const drawTaxiway = (pts, widthFactor = 6) => {
    drawPolyline(ctx, pts, '#152536', widthFactor * s);
    drawPolyline(ctx, pts, 'rgba(250, 204, 21, 0.28)', 0.9 * s);
  };

  // TWY A (parallel north of RWY 06/24)
  drawTaxiway([pt(-84, 30), pt(-32, 0), pt(22, -31), pt(58, -50)], 5.5);
  // Rapid exit connectors B, C, D, F into RWY 06/24
  drawTaxiway([pt(-68, 22), pt(-56, 36)], 4.5);
  drawTaxiway([pt(-36, 3), pt(-22, 17)], 4.5);
  drawTaxiway([pt(-8, -13), pt(4, 2)], 4.5);
  drawTaxiway([pt(42, -41), pt(54, -27)], 4.5);
  // Connectors from Apron North to TWY A
  drawTaxiway([pt(-32, -32), pt(-24, -4)], 4.5);
  drawTaxiway([pt(4, -36), pt(14, -26)], 4.5);
  // TWY L / P connecting RWY 06/24 & 12/30 to Apron South
  drawTaxiway([pt(-24, 18), pt(-26, 56)], 4.8);
  drawTaxiway([pt(14, 14), pt(18, 52)], 4.8);
  drawTaxiway([pt(48, 30), pt(34, 58)], 4.5);

  // 7. Aviatická Access Road Loop (connecting D7 to T1/T2 & Parking)
  drawPolyline(
    ctx,
    [pt(-46, -98), pt(-36, -74), pt(22, -76), pt(34, -90)],
    '#1A3147',
    3.2 * s
  );

  // 8. ICONIC LKPR AIRPORT BUILDINGS (2.5D top-down architecture)
  // --- Terminál 1 (Non-Schengen) + Prst A & Prst B ---
  drawBuilding(ctx, cx - 34 * s, cy - 60 * s, 26 * s, 11 * s, -0.08, {
    fill: '#1B3147',
    roof: '#264360',
    stroke: '#3D6B94',
    ribs: 5
  });
  // Prst A (pier extending SW onto Apron North)
  drawBuilding(ctx, cx - 46 * s, cy - 44 * s, 24 * s, 6.5 * s, -1.15, {
    fill: '#192E42',
    roof: '#24405C',
    stroke: '#3B668E',
    ribs: 4
  });
  // Prst B (pier extending SE onto Apron North)
  drawBuilding(ctx, cx - 23 * s, cy - 43 * s, 24 * s, 6.5 * s, 1.32, {
    fill: '#192E42',
    roof: '#24405C',
    stroke: '#3B668E',
    ribs: 4
  });

  // --- Terminál 2 (Schengen) + Curved Concourse & Prst C ---
  drawBuilding(ctx, cx + 6 * s, cy - 62 * s, 30 * s, 12 * s, -0.05, {
    fill: '#1D354C',
    roof: '#2B4C6D',
    stroke: '#467AA8',
    ribs: 6
  });
  // Prst C (pier extending south onto Apron North)
  drawBuilding(ctx, cx + 16 * s, cy - 44 * s, 25 * s, 7 * s, 1.48, {
    fill: '#1A3046',
    roof: '#264462',
    stroke: '#42739F',
    ribs: 5
  });

  // Jetbridges (nástupní mosty) on Piers A, B, C
  const jetbridges = [
    [pt(-51, -48), pt(-57, -45)],
    [pt(-48, -40), pt(-54, -37)],
    [pt(-42, -46), pt(-37, -43)],
    [pt(-25, -45), pt(-31, -43)],
    [pt(-21, -39), pt(-15, -37)],
    [pt(12, -48), pt(6, -46)],
    [pt(12, -40), pt(6, -38)],
    [pt(20, -47), pt(26, -45)],
    [pt(20, -39), pt(26, -37)]
  ];
  for (const jb of jetbridges) {
    drawPolyline(ctx, jb, 'rgba(186, 230, 253, 0.45)', 1.4 * s);
  }

  // AeroParking garages (PA, PB, PC) north of T1/T2
  drawBuilding(ctx, cx - 32 * s, cy - 77 * s, 15 * s, 7 * s, -0.08, {
    fill: '#142333',
    roof: '#1B3045',
    stroke: '#2C4964',
    ribs: 3
  });
  drawBuilding(ctx, cx - 6 * s, cy - 79 * s, 18 * s, 7.5 * s, -0.06, {
    fill: '#142333',
    roof: '#1B3045',
    stroke: '#2C4964',
    ribs: 4
  });
  drawBuilding(ctx, cx + 18 * s, cy - 77 * s, 14 * s, 7 * s, -0.05, {
    fill: '#142333',
    roof: '#1B3045',
    stroke: '#2C4964',
    ribs: 3
  });

  // --- Řídicí věž (ATC Tower LKPR) ---
  const twrX = cx - 8 * s;
  const twrY = cy - 48 * s;
  ctx.save();
  ctx.translate(twrX, twrY);
  // Tower shadow
  ctx.fillStyle = 'rgba(2, 6, 12, 0.7)';
  ctx.beginPath();
  ctx.arc(2.5 * s, 2.5 * s, 5.5 * s, 0, Math.PI * 2);
  ctx.fill();
  // Tower octagonal base & glass cab
  ctx.fillStyle = '#1E3A54';
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 5.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Pulsing cyan beacon on top of ATC Tower
  const beaconAlpha = 0.45 + 0.55 * Math.sin(time * 4.2);
  ctx.fillStyle = `rgba(56, 189, 248, ${beaconAlpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, 2.1 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Staré letiště Jih: Terminál 3 (VIP) & Hangáry F, E (ČSA Technics) ---
  drawBuilding(ctx, cx + 24 * s, cy + 72 * s, 22 * s, 14 * s, 0.08, {
    fill: '#192B3D',
    roof: '#223A52',
    stroke: '#3A6286',
    ribs: 6
  }); // Hangár F
  drawBuilding(ctx, cx + 28 * s, cy + 89 * s, 16 * s, 9 * s, 0.08, {
    fill: '#172738',
    roof: '#1F3449',
    stroke: '#325475',
    ribs: 4
  }); // Hangár E
  drawBuilding(ctx, cx - 35 * s, cy + 78 * s, 18 * s, 10 * s, -0.06, {
    fill: '#1A2D40',
    roof: '#243E57',
    stroke: '#3C658B',
    ribs: 3
  }); // Terminál 3

  // Cargo Hall (East)
  drawBuilding(ctx, cx + 78 * s, cy - 3 * s, 14 * s, 22 * s, 0.25, {
    fill: '#152536',
    roof: '#1D334A',
    stroke: '#305070',
    ribs: 4
  });

  // Subtle apron floodlight dots along stands
  ctx.fillStyle = 'rgba(250, 204, 21, 0.26)';
  const apronLights = [
    pt(-54, -30), pt(-38, -28), pt(-14, -28), pt(8, -30), pt(28, -34),
    pt(-28, 66), pt(8, 62), pt(28, 60)
  ];
  for (const [lx, ly] of apronLights) {
    ctx.beginPath();
    ctx.arc(lx, ly, 1.3 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // 9. Crisp Technical Airport Labels (subtle so they never clash with aircraft tags)
  ctx.font = `700 ${Math.round(7.5 * s)}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(186, 230, 253, 0.62)';
  ctx.fillText('T1', cx - 34 * s, cy - 60 * s);
  ctx.fillText('T2', cx + 6 * s, cy - 62 * s);
  ctx.fillText('T3', cx - 35 * s, cy + 78 * s);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
  ctx.fillText('TWR', twrX, twrY - 9 * s);

  ctx.font = `600 ${Math.round(6.8 * s)}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.fillStyle = 'rgba(148, 184, 212, 0.45)';
  ctx.fillText('HANGÁR F', cx + 24 * s, cy + 72 * s);
  ctx.fillText('CARGO', cx + 78 * s, cy - 3 * s);
  ctx.fillText('TWY A', cx - 28 * s, cy - 8 * s);
  ctx.fillText('VLTAVA', width * 0.87, height * 0.34);

  ctx.restore();
}
