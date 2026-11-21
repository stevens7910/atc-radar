/**
 * Difficulty modes, map configurations, and aircraft specifications for ATC Radar.
 */

export const DIFFICULTY_MODES = {
  beginner: {
    id: 'beginner',
    label: 'Začátečník',
    desc: 'Velmi pomalý start, pozvolné zrychlení po 15 přistáních.',
    baseSpeedMult: 0.62,
    rampStartScore: 15,
    maxSpeedMult: 1.15,
    spawnIntervalMult: 1.55,
    minSpawnIntervalMult: 1.15,
    maxConcurrentOffset: -2,
    stormsMinScoreBonus: 12,
    vipMinScore: 12
  },
  advanced: {
    id: 'advanced',
    label: 'Pokročilý',
    desc: 'Vyvážený provoz s postupně rostoucí hustotou a rychlostí.',
    baseSpeedMult: 0.92,
    rampStartScore: 8,
    maxSpeedMult: 1.25,
    spawnIntervalMult: 1.0,
    minSpawnIntervalMult: 1.0,
    maxConcurrentOffset: 0,
    stormsMinScoreBonus: 0,
    vipMinScore: 5
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    desc: 'Rychlý a hustý provoz, brzké bouřky a časté VIP lety.',
    baseSpeedMult: 1.15,
    rampStartScore: 0,
    maxSpeedMult: 1.45,
    spawnIntervalMult: 0.78,
    minSpawnIntervalMult: 0.82,
    maxConcurrentOffset: 2,
    stormsMinScoreBonus: -2,
    vipMinScore: 2
  }
};

export const AIRCRAFT_TYPES = {
  airliner: {
    id: 'airliner',
    shortCode: 'AIR',
    name: 'Dopravní letadlo',
    color: '#38BDF8',
    confirmColor: '#7DD3FC',
    speed: 64,
    turnRate: 2.35,
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
    turnRate: 2.95,
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
    turnRate: 2.4,
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
            angle: 0,
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
            angle: -Math.PI / 2,
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
    subtitle: 'Dráhy 06/24 & 12/30, Vltava, VOR majáky a reálné volací znaky',
    baseSpawnInterval: 3.4,
    minSpawnInterval: 1.2,
    maxConcurrentBase: 5,
    maxConcurrentCap: 14,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 1,
    callsigns: {
      airliner: ['CSA 412', 'TVS 108', 'DLH 34A', 'RYR 882', 'EWG 714', 'BAW 854', 'AFR 108', 'KLM 35J', 'SWR 148'],
      prop: ['OK-SUN', 'CSA 912', 'ATR 421', 'LOT 523', 'VFR 204', 'OK-PRG'],
      helicopter: ['KRYSTAL 1', 'KRYSTAL 2', 'DELTA 07', 'SAR 04'],
      vip: ['CEF 01', 'VIP 01', 'MEDEVAC']
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
            angle: -Math.PI / 6,
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
            angle: Math.PI / 6,
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
            x: cx - 10 * scale,
            y: cy + 76 * scale, // Staré letiště Jih (Terminál 3 / Hangáry)
            radius: 21 * scale
          }
        ],
        decor: {
          detailedMap: 'lkpr',
          water: [
            { x: width * 0.87, y: 0 },
            { x: width * 0.83, y: height * 0.22 },
            { x: width * 0.90, y: height * 0.44 },
            { x: width * 0.84, y: height * 0.68 },
            { x: width * 0.89, y: height * 0.86 },
            { x: width * 0.85, y: height }
          ],
          vors: [
            { code: 'OKL', x: width * 0.12, y: height * 0.20 },
            { code: 'NER', x: width * 0.85, y: height * 0.14 },
            { code: 'BNO', x: width * 0.86, y: height * 0.86 },
            { code: 'VOZ', x: width * 0.18, y: height * 0.86 }
          ]
        }
      };
    }
  },
  eddf: {
    id: 'eddf',
    name: 'Frankfurt nad Mohanem (EDDF)',
    subtitle: 'Hlavní 07C/25C, kolmá 18/36, řeka Mohan a německý provoz',
    baseSpawnInterval: 3.3,
    minSpawnInterval: 1.15,
    maxConcurrentBase: 5,
    maxConcurrentCap: 15,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 2,
    callsigns: {
      airliner: ['DLH 402', 'DLH 918', 'CFG 114', 'UAE 045', 'SIA 326', 'UAL 945', 'ANA 204', 'THY 159'],
      prop: ['DLH 12K', 'CLH 314', 'EWG 882', 'D-EFRA', 'AUA 212'],
      helicopter: ['ADAC 02', 'POLIZEI 1', 'HELI 07'],
      vip: ['GAF 01', 'VIP 07', 'MEDEVAC']
    },
    buildLayout(cx, cy, scale, width, height) {
      return {
        runways: [
          {
            id: 'rwy-07c-25c',
            codeA: '07',
            codeB: '25',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx + 10 * scale,
            y: cy - 26 * scale,
            angle: -0.35, // ~070° / 250°
            length: 168 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-18-36',
            codeA: '18',
            codeB: '36',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx - 64 * scale,
            y: cy + 44 * scale,
            angle: Math.PI / 2, // 180° / 360°
            length: 118 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-eddf',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx + 68 * scale,
            y: cy + 54 * scale,
            radius: 22 * scale
          }
        ],
        decor: {
          water: [
            { x: 0, y: height * 0.28 },
            { x: width * 0.28, y: height * 0.21 },
            { x: width * 0.56, y: height * 0.24 },
            { x: width * 0.82, y: height * 0.16 },
            { x: width, y: height * 0.19 }
          ],
          vors: [
            { code: 'TAU', x: width * 0.16, y: height * 0.16 },
            { code: 'GED', x: width * 0.84, y: height * 0.18 },
            { code: 'RID', x: width * 0.22, y: height * 0.84 },
            { code: 'FFM', x: width * 0.82, y: height * 0.82 }
          ]
        }
      };
    }
  },
  egll: {
    id: 'egll',
    name: 'Londýn Heathrow (EGLL)',
    subtitle: 'Paralelní dráhy 09L/27R & 09R/27L, řeka Temže a stacky VOR',
    baseSpawnInterval: 3.2,
    minSpawnInterval: 1.12,
    maxConcurrentBase: 5,
    maxConcurrentCap: 15,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 2,
    callsigns: {
      airliner: ['BAW 117', 'BAW 284', 'VIR 003', 'AAL 101', 'QFA 002', 'UAE 007', 'SWR 318', 'SAS 502'],
      prop: ['EIN 154', 'EZY 842', 'LOG 312', 'G-LHR1', 'BAW 84C'],
      helicopter: ['METPOL 1', 'HELI 09', 'SAR 27'],
      vip: ['RRR 01', 'VIP 09', 'MEDEVAC']
    },
    buildLayout(cx, cy, scale, width, height) {
      return {
        runways: [
          {
            id: 'rwy-09l-27r',
            codeA: '09',
            codeB: '27',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx,
            y: cy - 42 * scale,
            angle: 0, // 090° / 270°
            length: 170 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-09r-27l',
            codeA: '09',
            codeB: '27',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx + 10 * scale,
            y: cy + 44 * scale,
            angle: 0,
            length: 136 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-egll',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx,
            y: cy + 1 * scale,
            radius: 21 * scale
          }
        ],
        decor: {
          water: [
            { x: 0, y: height * 0.78 },
            { x: width * 0.28, y: height * 0.84 },
            { x: width * 0.56, y: height * 0.75 },
            { x: width * 0.82, y: height * 0.81 },
            { x: width, y: height * 0.76 }
          ],
          vors: [
            { code: 'BNN', x: width * 0.16, y: height * 0.18 },
            { code: 'LAM', x: width * 0.84, y: height * 0.20 },
            { code: 'OCK', x: width * 0.18, y: height * 0.84 },
            { code: 'BIG', x: width * 0.84, y: height * 0.84 }
          ]
        }
      };
    }
  },
  lfpg: {
    id: 'lfpg',
    name: 'Paříž Charles de Gaulle (LFPG)',
    subtitle: 'Posunuté paralelní dráhy 08L/26R & 08R/26L a francouzský provoz',
    baseSpawnInterval: 3.3,
    minSpawnInterval: 1.15,
    maxConcurrentBase: 5,
    maxConcurrentCap: 15,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 2,
    callsigns: {
      airliner: ['AFR 006', 'AFR 448', 'DAL 263', 'TVF 309', 'QTR 039', 'JAL 045', 'KLM 123', 'IBE 340'],
      prop: ['HOP 112', 'HOP 408', 'EZY 41B', 'F-CDG1', 'BEL 204'],
      helicopter: ['SAMU 75', 'DRAGON 1', 'HELI 26'],
      vip: ['COTAM 01', 'VIP 08', 'MEDEVAC']
    },
    buildLayout(cx, cy, scale, width, height) {
      return {
        runways: [
          {
            id: 'rwy-08l-26r',
            codeA: '08',
            codeB: '26',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx - 18 * scale,
            y: cy - 40 * scale,
            angle: -0.14, // ~082° / 262°
            length: 168 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-08r-26l',
            codeA: '08',
            codeB: '26',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx + 24 * scale,
            y: cy + 44 * scale,
            angle: -0.14,
            length: 130 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-lfpg',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx - 64 * scale,
            y: cy + 56 * scale,
            radius: 21 * scale
          }
        ],
        decor: {
          water: [
            { x: 0, y: height * 0.84 },
            { x: width * 0.3, y: height * 0.78 },
            { x: width * 0.62, y: height * 0.86 },
            { x: width, y: height * 0.79 }
          ],
          vors: [
            { code: 'PON', x: width * 0.16, y: height * 0.22 },
            { code: 'CTL', x: width * 0.84, y: height * 0.18 },
            { code: 'PGS', x: width * 0.18, y: height * 0.82 },
            { code: 'CLM', x: width * 0.84, y: height * 0.84 }
          ]
        }
      };
    }
  },
  lirf: {
    id: 'lirf',
    name: 'Řím Fiumicino (LIRF)',
    subtitle: 'Pobřežní dráhy 16R/34L a 07/25, Tyrhénské moře a italský provoz',
    baseSpawnInterval: 3.4,
    minSpawnInterval: 1.2,
    maxConcurrentBase: 5,
    maxConcurrentCap: 14,
    vipFrequency: 7,
    stormsEnabled: true,
    stormsMinScore: 2,
    callsigns: {
      airliner: ['ITY 610', 'ITY 204', 'RYR 552', 'WZZ 318', 'VLG 621', 'ELY 386', 'UAE 097', 'AAL 235'],
      prop: ['ITY 118', 'NOS 402', 'I-ROMA', 'VFR 164', 'AEE 652'],
      helicopter: ['PEGASO 1', 'DRAGO 04', 'POLI 16'],
      vip: ['IAM 01', 'VIP 16', 'MEDEVAC']
    },
    buildLayout(cx, cy, scale, width, height) {
      return {
        runways: [
          {
            id: 'rwy-16r-34l',
            codeA: '16',
            codeB: '34',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx - 34 * scale,
            y: cy,
            angle: 1.26, // ~162° / 342°
            length: 164 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-07-25',
            codeA: '07',
            codeB: '25',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx + 48 * scale,
            y: cy + 44 * scale,
            angle: -0.35, // ~070° / 250°
            length: 120 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-lirf',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx + 52 * scale,
            y: cy - 52 * scale,
            radius: 22 * scale
          }
        ],
        decor: {
          water: [
            { x: width * 0.14, y: 0 },
            { x: width * 0.11, y: height * 0.32 },
            { x: width * 0.16, y: height * 0.65 },
            { x: width * 0.19, y: height }
          ],
          vors: [
            { code: 'TZO', x: width * 0.18, y: height * 0.16 },
            { code: 'CMP', x: width * 0.84, y: height * 0.22 },
            { code: 'OST', x: width * 0.20, y: height * 0.84 },
            { code: 'LAT', x: width * 0.84, y: height * 0.84 }
          ]
        }
      };
    }
  },
  kjfk: {
    id: 'kjfk',
    name: 'New York JFK (KJFK)',
    subtitle: 'Křížící se dráhy 04R/22L & 13L/31R u Jamaica Bay a hustý provoz',
    baseSpawnInterval: 3.15,
    minSpawnInterval: 1.1,
    maxConcurrentBase: 5,
    maxConcurrentCap: 15,
    vipFrequency: 6,
    stormsEnabled: true,
    stormsMinScore: 1,
    callsigns: {
      airliner: ['AAL 001', 'DAL 404', 'JBU 118', 'UAL 882', 'BAW 177', 'AFR 007', 'CPA 841', 'KAL 081'],
      prop: ['EDV 481', 'RPA 342', 'N-JFK4', 'JBU 602', 'SKW 512'],
      helicopter: ['NYPD 01', 'BLADE 4', 'HELI 04'],
      vip: ['AF1 001', 'VIP 04', 'MEDEVAC']
    },
    buildLayout(cx, cy, scale, width, height) {
      return {
        runways: [
          {
            id: 'rwy-04r-22l',
            codeA: '04',
            codeB: '22',
            kind: 'runway',
            accepts: 'airliner',
            color: '#38BDF8',
            x: cx + 10 * scale,
            y: cy - 6 * scale,
            angle: -0.82, // ~043° / 223°
            length: 168 * scale,
            width: 24 * scale
          },
          {
            id: 'rwy-13l-31r',
            codeA: '13',
            codeB: '31',
            kind: 'runway',
            accepts: 'prop',
            color: '#FACC15',
            x: cx - 10 * scale,
            y: cy + 16 * scale,
            angle: 0.72, // ~131° / 311° (crosses 04/22!)
            length: 126 * scale,
            width: 20 * scale
          }
        ],
        heliports: [
          {
            id: 'heli-kjfk',
            code: 'H1',
            kind: 'heliport',
            accepts: 'helicopter',
            color: '#22C55E',
            x: cx - 72 * scale,
            y: cy - 62 * scale,
            radius: 22 * scale
          }
        ],
        decor: {
          water: [
            { x: 0, y: height * 0.86 },
            { x: width * 0.26, y: height * 0.80 },
            { x: width * 0.54, y: height * 0.88 },
            { x: width * 0.78, y: height * 0.81 },
            { x: width, y: height * 0.85 }
          ],
          vors: [
            { code: 'JFK', x: width * 0.16, y: height * 0.20 },
            { code: 'DPK', x: width * 0.84, y: height * 0.18 },
            { code: 'CRI', x: width * 0.18, y: height * 0.84 },
            { code: 'CCC', x: width * 0.84, y: height * 0.84 }
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
