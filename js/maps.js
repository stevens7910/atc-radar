/**
 * Map configurations and aircraft type specifications for ATC Radar.
 */

export const AIRCRAFT_TYPES = {
  airliner: {
    id: 'airliner',
    shortCode: 'AIR',
    name: 'Dopravní letadlo',
    color: '#38BDF8',
    confirmColor: '#7DD3FC',
    speed: 64,
    turnRate: 1.65,
    baseFl: 240,
    baseKts: 280,
    size: 14,
    callsignPrefixes: ['CSA', 'LH', 'BAW', 'AFR', 'KLM', 'OK']
  },
  prop: {
    id: 'prop',
    shortCode: 'REG',
    name: 'Regionální / Vrtulové',
    color: '#FACC15',
    confirmColor: '#FEF08A',
    speed: 47,
    turnRate: 2.75,
    baseFl: 110,
    baseKts: 165,
    size: 11,
    callsignPrefixes: ['REG', 'VFR', 'OK', 'SKY', 'AIR']
  },
  helicopter: {
    id: 'helicopter',
    shortCode: 'HELI',
    name: 'Vrtulník',
    color: '#22C55E',
    confirmColor: '#86EFAC',
    speed: 35,
    turnRate: 8.5,
    baseFl: 30,
    baseKts: 110,
    size: 11,
    callsignPrefixes: ['H', 'HELI', 'SAR', 'POL']
  },
  vip: {
    id: 'vip',
    shortCode: 'VIP',
    name: 'VIP / Nouzový let',
    color: '#FF3B30',
    confirmColor: '#FF6961',
    speed: 92,
    turnRate: 2.2,
    baseFl: 310,
    baseKts: 390,
    size: 15,
    callsignPrefixes: ['VIP', 'MED', 'EMG']
  }
};

export const MAPS = {
  basic: {
    id: 'basic',
    name: 'Základní letiště',
    subtitle: 'Dvě kolmé dráhy a heliport • Ideální pro rozehřátí',
    difficultyLabel: 'Standardní provoz',
    baseSpawnInterval: 4.3,
    minSpawnInterval: 1.55,
    maxConcurrentBase: 4,
    maxConcurrentCap: 11,
    vipFrequency: 9,
    stormsEnabled: true,
    stormsMinScore: 10,
    buildLayout(cx, cy, scale) {
      return {
        runways: [
          {
            id: 'rwy-09-27',
            codeA: '09',
            codeB: '27',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx - 10 * scale,
            y: cy - 28 * scale,
            angle: 0, // 09: W -> E, 27: E -> W
            length: 148 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-36-18',
            codeA: '36',
            codeB: '18',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx + 76 * scale,
            y: cy + 36 * scale,
            angle: -Math.PI / 2, // 36: S -> N, 18: N -> S
            length: 102 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-1',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx - 72 * scale,
            y: cy + 52 * scale,
            radius: 23 * scale
          }
        ],
        decor: null
      };
    }
  },
  busy: {
    id: 'busy',
    name: 'Rušný uzel',
    subtitle: 'Křížící se dráhy, bouřky a hustší provoz',
    difficultyLabel: 'Vysoký provoz',
    baseSpawnInterval: 3.5,
    minSpawnInterval: 1.25,
    maxConcurrentBase: 5,
    maxConcurrentCap: 14,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 2,
    buildLayout(cx, cy, scale) {
      return {
        runways: [
          {
            id: 'rwy-06-24',
            codeA: '06',
            codeB: '24',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx,
            y: cy,
            angle: -0.52,
            length: 156 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-31-13',
            codeA: '31',
            codeB: '13',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx,
            y: cy,
            angle: -2.25,
            length: 110 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-1',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx,
            y: cy + 88 * scale,
            radius: 22 * scale
          }
        ],
        decor: null
      };
    }
  },
  lkpr: {
    id: 'lkpr',
    name: 'Praha Ruzyně (LKPR)',
    subtitle: 'Křížící se dráhy 06/24 a 12/30, bouřky a reálné volací znaky',
    difficultyLabel: 'Mezinárodní uzel',
    baseSpawnInterval: 3.4,
    minSpawnInterval: 1.2,
    maxConcurrentBase: 5,
    maxConcurrentCap: 14,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 1,
    callsigns: {
      airliner: [
        'CSA 412', 'TVS 108', 'DLH 34A', 'RYR 882',
        'EWG 714', 'BAW 854', 'AFR 108', 'KLM 35J', 'SWR 148'
      ],
      prop: [
        'OK-SUN', 'CSA 912', 'ATR 421', 'LOT 523', 'VFR 204', 'OK-PRG'
      ],
      helicopter: [
        'KRYSTAL 1', 'KRYSTAL 2', 'DELTA 07', 'SAR 04'
      ],
      vip: [
        'CEF 01', 'VIP 01', 'MEDEVAC'
      ]
    },
    buildLayout(cx, cy, scale, width, height) {
      return {
        runways: [
          {
            id: 'rwy-06-24',
            codeA: '06',
            codeB: '24',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx - 6 * scale,
            y: cy + 8 * scale,
            angle: -Math.PI / 6, // 060° (SW -> NE), opposite 240° (NE -> SW)
            length: 164 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-12-30',
            codeA: '12',
            codeB: '30',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx + 22 * scale,
            y: cy + 16 * scale,
            angle: Math.PI / 6, // 120° (NW -> SE), opposite 300° (SE -> NW)
            length: 118 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-lkpr',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx + 8 * scale,
            y: cy - 78 * scale, // Northern old airport / hangars area
            radius: 22 * scale
          }
        ],
        decor: {
          vltava: [
            { x: width * 0.86, y: 0 },
            { x: width * 0.81, y: height * 0.22 },
            { x: width * 0.89, y: height * 0.44 },
            { x: width * 0.82, y: height * 0.68 },
            { x: width * 0.88, y: height * 0.86 },
            { x: width * 0.84, y: height }
          ],
          vors: [
            { code: 'OKL', x: width * 0.14, y: height * 0.22 },
            { code: 'NER', x: width * 0.84, y: height * 0.16 },
            { code: 'BNO', x: width * 0.85, y: height * 0.84 },
            { code: 'VOZ', x: width * 0.22, y: height * 0.84 }
          ]
        }
      };
    }
  }
};

/**
 * Returns the active runway angle & codes based on current windFromAngle.
 * Aircraft must land INTO the wind (within +-90 deg of windFromAngle).
 */
export function getActiveRunwayDirection(runway, windFromAngle) {
  const angleA = runway.angle;
  const angleB = runway.angle + Math.PI;
  const dotA = Math.cos(angleA - windFromAngle);
  const useA = dotA >= 0;
  return {
    activeAngle: useA ? angleA : angleB,
    activeCode: useA ? runway.codeA : runway.codeB,
    inactiveCode: useA ? runway.codeB : runway.codeA,
    useA
  };
}

/**
 * Computes runway approach threshold (entry) and stop end coordinates
 * for a given approach angle.
 */
export function getRunwayEndpoints(runway, overrideAngle = null) {
  const ang = overrideAngle !== null ? overrideAngle : runway.angle;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const half = runway.length / 2;
  return {
    entryX: runway.x - cos * half,
    entryY: runway.y - sin * half,
    exitX: runway.x + cos * half,
    exitY: runway.y + sin * half,
    dirX: cos,
    dirY: sin,
    angle: ang
  };
}
