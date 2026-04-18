// Maze generation + room carving
// Uses recursive backtracking, then carves special rectangular rooms inside the maze.
// Cell values:
//   0 = floor (open)
//   1 = wall
//   2 = door (closed, needs a key)
//   3 = boss-room door
// Returns { grid, rooms, startCell, exitCell }

export const CELL = { FLOOR: 0, WALL: 1, DOOR: 2, BOSS_DOOR: 3 };

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRecursiveBacktracking(width, height) {
  const grid = Array.from({ length: height }, () => Array(width).fill(CELL.WALL));
  const stack = [];
  const sx = 1, sy = 1;
  grid[sy][sx] = CELL.FLOOR;
  stack.push([sx, sy]);

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const dirs = shuffled([[0, -2], [0, 2], [-2, 0], [2, 0]]);
    let carved = false;

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && grid[ny][nx] === CELL.WALL) {
        grid[cy + dy / 2][cx + dx / 2] = CELL.FLOOR;
        grid[ny][nx] = CELL.FLOOR;
        stack.push([nx, ny]);
        carved = true;
        break;
      }
    }
    if (!carved) stack.pop();
  }
  return grid;
}

function canPlaceRoom(grid, x, y, w, h) {
  const height = grid.length;
  const width = grid[0].length;
  if (x < 2 || y < 2) return false;
  if (x + w > width - 2 || y + h > height - 2) return false;
  return true;
}

function carveRoom(grid, x, y, w, h) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      grid[j][i] = CELL.FLOOR;
    }
  }
}

// Place a door at one edge of the room so that there's a wall segment adjacent
function placeDoor(grid, room, doorType = CELL.DOOR) {
  const { x, y, w, h } = room;
  // candidate door positions: middle of each wall
  const candidates = [
    { dx: x + Math.floor(w / 2), dy: y - 1 },       // top
    { dx: x + Math.floor(w / 2), dy: y + h },       // bottom
    { dx: x - 1, dy: y + Math.floor(h / 2) },       // left
    { dx: x + w, dy: y + Math.floor(h / 2) },       // right
  ];
  for (const c of shuffled(candidates)) {
    if (c.dx < 1 || c.dy < 1 || c.dy >= grid.length - 1 || c.dx >= grid[0].length - 1) continue;
    if (grid[c.dy][c.dx] === CELL.WALL) {
      grid[c.dy][c.dx] = doorType;
      return { x: c.dx, y: c.dy };
    }
  }
  // fallback: force one
  const c = candidates[0];
  grid[c.dy][c.dx] = doorType;
  return { x: c.dx, y: c.dy };
}

export function generateMaze({ width = 31, height = 31, roomCount = 5 } = {}) {
  if (width % 2 === 0) width += 1;
  if (height % 2 === 0) height += 1;

  const grid = generateRecursiveBacktracking(width, height);
  const rooms = [];

  // Try to place rooms
  let attempts = 0;
  while (rooms.length < roomCount && attempts < 120) {
    attempts++;
    const w = 3 + Math.floor(Math.random() * 3) * 2; // 3,5,7
    const h = 3 + Math.floor(Math.random() * 3) * 2;
    const x = 2 + Math.floor(Math.random() * (width - w - 4));
    const y = 2 + Math.floor(Math.random() * (height - h - 4));

    // avoid overlap with existing rooms (with 2-cell buffer)
    const overlap = rooms.some(r =>
      x < r.x + r.w + 2 && x + w + 2 > r.x &&
      y < r.y + r.h + 2 && y + h + 2 > r.y
    );
    if (overlap) continue;
    if (!canPlaceRoom(grid, x, y, w, h)) continue;

    carveRoom(grid, x, y, w, h);
    rooms.push({ x, y, w, h, id: rooms.length, type: null, doorPos: null });
  }

  // Assign room types: one boss, one merchant, rest "loot"
  if (rooms.length > 0) {
    // Farthest from center = boss
    const cx = width / 2, cy = height / 2;
    rooms.sort((a, b) => {
      const da = Math.hypot(a.x - cx, a.y - cy);
      const db = Math.hypot(b.x - cx, b.y - cy);
      return db - da;
    });
    rooms[0].type = 'boss';
    rooms[0].doorPos = placeDoor(grid, rooms[0], CELL.BOSS_DOOR);

    if (rooms.length > 1) {
      rooms[1].type = 'merchant';
      rooms[1].doorPos = placeDoor(grid, rooms[1], CELL.DOOR);
    }
    for (let i = 2; i < rooms.length; i++) {
      rooms[i].type = 'loot';
      // Some loot rooms have doors (need keys), others open
      if (Math.random() < 0.5) {
        rooms[i].doorPos = placeDoor(grid, rooms[i], CELL.DOOR);
      }
    }
  }

  const startCell = { x: 1, y: 1 };
  const exitCell = { x: width - 2, y: height - 2 };
  grid[exitCell.y][exitCell.x] = CELL.FLOOR;

  return { grid, rooms, startCell, exitCell, width, height };
}

// World helpers (cells <-> world position)
export const CELL_SIZE = 3;
export function cellToWorld(x, y, grid) {
  const height = grid.length;
  const width = grid[0].length;
  return {
    x: (x - width / 2) * CELL_SIZE,
    z: (y - height / 2) * CELL_SIZE,
  };
}
export function worldToCell(wx, wz, grid) {
  const height = grid.length;
  const width = grid[0].length;
  return {
    x: Math.floor(wx / CELL_SIZE + width / 2),
    y: Math.floor(wz / CELL_SIZE + height / 2),
  };
}
