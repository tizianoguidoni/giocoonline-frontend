// Zones. Two are indoor (dungeon/catacombs) and two are outdoor (garden/abyss).
// Outdoor zones have no ceiling and show a starry/moonlit sky above.

export const ZONES = {
  DUNGEON: {
    id: 'dungeon',
    name: 'Dungeon',
    fogColor: 0x0a0608,
    fogNear: 2,
    fogFar: 14,
    wallColor: 0x3d2a28,
    floorColor: 0x1a1210,
    ambient: 0x2a1410,
    ambientIntensity: 0.22,
    particleColor: 0x8a4a3a,
    outdoor: false,
  },
  GARDEN: {
    id: 'garden',
    name: 'Giardino Perduto',
    fogColor: 0x1a2838,
    fogNear: 4,
    fogFar: 32,
    wallColor: 0x2a3a20,
    floorColor: 0x1a2614,
    ambient: 0x4060a0,
    ambientIntensity: 0.55,
    particleColor: 0xaaeacc,
    outdoor: true,       // open sky, moonlight
    skyColor: 0x0a1528,
    moonlight: 0x90b0ff,
  },
  CATACOMBS: {
    id: 'catacombs',
    name: 'Catacombe',
    fogColor: 0x1a1410,
    fogNear: 2,
    fogFar: 12,
    wallColor: 0x4a4238,
    floorColor: 0x1c1814,
    ambient: 0x3a3025,
    ambientIntensity: 0.18,
    particleColor: 0xd0b088,
    outdoor: false,
  },
  ABYSS: {
    id: 'abyss',
    name: 'Abisso Stellato',
    fogColor: 0x080318,
    fogNear: 4,
    fogFar: 28,
    wallColor: 0x1a1530,
    floorColor: 0x050220,
    ambient: 0x4030a0,
    ambientIntensity: 0.35,
    particleColor: 0x8060ff,
    outdoor: true,       // void with stars
    skyColor: 0x050015,
    moonlight: 0x8060ff,
  },
};

export function zoneForCell(x, y, width, height) {
  const left = x < width / 2;
  const top = y < height / 2;
  if (top && left) return ZONES.DUNGEON;
  if (top && !left) return ZONES.GARDEN;
  if (!top && left) return ZONES.CATACOMBS;
  return ZONES.ABYSS;
}

export function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function lerp(a, b, t) { return a + (b - a) * t; }
