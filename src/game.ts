import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  BACK_LABEL,
  BINDINGS,
  BOARD_CX,
  BOARD_CY,
  CAMPAIGN_LENGTH,
  CHANNELS,
  CELL_PITCH,
  CLEAR_LABEL,
  CUES,
  GRID_MAX_COLS,
  GRID_MAX_ROWS,
  HUD_SOLVED_LABEL,
  HUD_TIER_LABEL,
  MAX_TIER,
  NODE_HIT_R,
  NODE_R,
  REFRACT_DEBUG_VERSION,
  SET_LABELS,
  SOLVED_ITEMS,
  SOLVED_TITLE_TEXT,
  STAGE_H,
  STAGE_W,
  TAGLINE_TEXT,
  TIER_ADVANCE,
  TIERS,
  TITLE_ITEMS,
  TITLE_TEXT,
} from "./constants";
import type { ChannelName } from "./constants";

export type Screen =
  "title" | "howto" | "select" | "playing" | "solved" | "complete";
export type Mode = "campaign" | "cascade";
export type Channel = ChannelName;
export type NodeKind = "emitter" | "lens" | "crystal";
export interface Cell {
  readonly col: number;
  readonly row: number;
}
export interface NodeState {
  readonly col: number;
  readonly row: number;
  readonly kind: NodeKind;
  readonly channel: Channel | null;
  readonly charges: number | null;
}
export interface BoardState {
  readonly cols: number;
  readonly rows: number;
  readonly nodes: readonly NodeState[];
}
export interface BeamState {
  readonly channel: Channel;
  readonly cells: readonly Cell[];
}
export interface TraceState {
  readonly channel: Channel;
}
export type PointerDevice = "mouse" | "pen" | "touch";
export interface PointerState {
  readonly x: number;
  readonly y: number;
  readonly down: boolean;
  readonly device: PointerDevice;
}
export interface RefractState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly board: BoardState;
  readonly beams: readonly BeamState[];
  readonly tracing: TraceState | null;
  readonly boardIndex: number;
  readonly solvedBoards: readonly number[];
  readonly unlockedCount: number;
  readonly selectIndex: number;
  readonly solvedCount: number;
  readonly tier: number;
  readonly pointer: PointerState;
  readonly armedTarget: string | null;
  readonly simTime: number;
  readonly muted: boolean;
}
type Target = { id: string; x: number; y: number; w: number; h: number };
type Snapshot = Record<string, unknown>;
export interface RefractDebugApi {
  readonly version: number;
  reset(s: DeepReadonly<RefractState>): RefractState;
  snapshot(s: DeepReadonly<RefractState>): Snapshot;
  reconcile(s: DeepReadonly<RefractState>): RefractState;
  setMode(s: DeepReadonly<RefractState>, mode: Mode): RefractState;
  setScreen(s: DeepReadonly<RefractState>, screen: Screen): RefractState;
  setMenuIndex(s: DeepReadonly<RefractState>, index: number): RefractState;
  setSolvedCount(s: DeepReadonly<RefractState>, count: number): RefractState;
  setTier(s: DeepReadonly<RefractState>, tier: number): RefractState;
  generateBoard(s: DeepReadonly<RefractState>, tier: number): RefractState;
  loadBoard(
    s: DeepReadonly<RefractState>,
    board: readonly string[],
  ): RefractState;
  pointerDown(
    s: DeepReadonly<RefractState>,
    x: number,
    y: number,
    device?: PointerDevice,
  ): RefractState;
  pointerMove(
    s: DeepReadonly<RefractState>,
    x: number,
    y: number,
    device?: PointerDevice,
  ): RefractState;
  pointerUp(
    s: DeepReadonly<RefractState>,
    device?: PointerDevice,
  ): RefractState;
  clear(s: DeepReadonly<RefractState>): RefractState;
}
export const BACKGROUND = "#080d18";
const EMPTY: BoardState = { cols: 0, rows: 0, nodes: [] };
const cellX = (c: number, cols: number) =>
  BOARD_CX - ((cols - 1) * CELL_PITCH) / 2 + c * CELL_PITCH;
const cellY = (r: number, rows: number) =>
  BOARD_CY - ((rows - 1) * CELL_PITCH) / 2 + r * CELL_PITCH;
const key = (c: number, r: number) => `${c},${r}`;
const COLORS: Record<Channel, string> = {
  triangle: "#42e6cf",
  square: "#ffbd59",
  diamond: "#c79bff",
};
const CAMPAIGN: readonly string[][] = [
  [".Tt", "ttT", ".tt"],
  [".tt", "TtT", "tt."],
  ["tTtt", "ttTt", "ttt."],
  ["Tt.t", "tTtt", ".ttt"],
  [".tTt", ".ttt", "ttTt", "tttt"],
  ["tttT", "ttt.", "t.tt", "ttTt"],
  ["STtt", "sstt", "ssTt", "Sss."],
  ["Sst..", "stTtt", "ssttt", "SsstT"],
  ["tSss", "2tss", "Ttss", "tTS."],
  ["Tt.T.", "ttt..", "t2sSs", "tSsss"],
  ["..t.s", "ttT2s", "ttS2S", "t.Tss"],
  ["Tttt.", "ttsSt", ".22t.", "ssST."],
  [".Ddd", "tTdD", "t22.", "tsSs", "T.S."],
  ["..tT.", "t2dD.", "T2t.s", "d2sss", "DSssS"],
  [".T.2t", "sDttt", "sS2Td", "ss22D", ".S.d."],
  ["..ttt", ".S2tt", "DsTsT", "d22d.", "SddD."],
  ["...ttd", "S2Ttdd", "t32Ddd", "Tss2d.", "sS.dD."],
  ["T.....", "ttDsss", "dd3222", ".dt3Ss", "DddTSs"],
  [".Dttt", ".dd3t", ".d2TT", "S2s2D", ".sSss"],
  [".S.tT.", "s2ttDd", "s2T2.d", "s22d3.", "ssSddD"],
  ["S2D..T", "d2ssts", ".D3S3s", ".dT32t", ".d2tt."],
  [".tt2d.", ".t2t2d", "t1DdSd", "2.S3dD", "TT2sd.", ".ssss."],
  ["s2SST..", "2232.t.", "stTsttt", "..t.t.t", "d22ttdD", "dD2dddd"],
  ["ssdd.d.", "2S.dd2d", "ssD..d.", "t2ttTdd", ".t323Dd", "ttT2sS."],
];
const notationBoard = (lines: readonly string[]): BoardState => {
  const rows = lines.length,
    cols = lines[0]?.length ?? 0;
  if (
    !cols ||
    cols > GRID_MAX_COLS ||
    rows > GRID_MAX_ROWS ||
    lines.some((x) => x.length !== cols)
  )
    throw new Error("Invalid board dimensions");
  const nodes: NodeState[] = [];
  const channels: Record<string, Channel> = {
    T: "triangle",
    t: "triangle",
    S: "square",
    s: "square",
    D: "diamond",
    d: "diamond",
  };
  lines.forEach((line, row) =>
    [...line].forEach((ch, col) => {
      if (ch === ".") return;
      if ("TtSDd s".replace(" ", "").includes(ch))
        nodes.push({
          col,
          row,
          kind:
            ch === ch.toUpperCase()
              ? "emitter"
              : ch === ch.toLowerCase()
                ? "lens"
                : "lens",
          channel: channels[ch]!,
          charges: null,
        });
      else if ("123".includes(ch))
        nodes.push({
          col,
          row,
          kind: "crystal",
          channel: null,
          charges: Number(ch),
        });
      else throw new Error(`Invalid notation: ${ch}`);
    }),
  );
  return { cols, rows, nodes };
};
const channelsOf = (b: BoardState): Channel[] =>
  CHANNELS.filter((c) => b.nodes.some((n) => n.channel === c));
const freshBeams = (b: BoardState): BeamState[] =>
  channelsOf(b).map((channel) => ({ channel, cells: [] }));
const nodeAt = (b: BoardState, c: Cell) =>
  b.nodes.find((n) => n.col === c.col && n.row === c.row);
const cellsEqual = (a: Cell, b: Cell) => a.col === b.col && a.row === b.row;
const segmentKey = (a: Cell, b: Cell) =>
  [key(a.col, a.row), key(b.col, b.row)].sort().join("|");
function degree(beam: BeamState, cell: Cell): number {
  return beam.cells.reduce((total, point, index) => {
    if (!cellsEqual(point, cell)) return total;
    return total + Number(index > 0) + Number(index < beam.cells.length - 1);
  }, 0);
}
function complete(
  s: Pick<RefractState, "board" | "beams">,
  channel: Channel,
): boolean {
  const beam = s.beams.find((b) => b.channel === channel);
  if (!beam || beam.cells.length < 2) return false;
  const es = s.board.nodes.filter(
    (n) => n.kind === "emitter" && n.channel === channel,
  );
  if (es.length !== 2 || !es.every((e) => degree(beam, e) === 1)) return false;
  return s.board.nodes
    .filter((n) => n.kind === "lens" && n.channel === channel)
    .every((n) => degree(beam, n) === 2);
}
function solved(s: Pick<RefractState, "board" | "beams">): boolean {
  if (!channelsOf(s.board).every((c) => complete(s, c))) return false;
  return s.board.nodes
    .filter((n) => n.kind === "crystal")
    .every((n) => {
      const count = s.beams.reduce(
        (a, b) =>
          a + b.cells.filter((c) => c.col === n.col && c.row === n.row).length,
        0,
      );
      return count === n.charges;
    });
}
function targets(s: DeepReadonly<RefractState>): Target[] {
  const target = (
    id: string,
    x: number,
    y: number,
    w = 160,
    h = 76,
  ): Target => ({ id, x, y, w, h });
  if (s.screen === "title")
    return TITLE_ITEMS.map((_, i) =>
      target(`menu-${i}`, 490, 350 + i * 88, 300, 72),
    );
  if (s.screen === "howto") return [target("back", 72, 610)];
  if (s.screen === "select")
    return [
      ...Array.from({ length: CAMPAIGN_LENGTH }, (_, i) =>
        target(
          `board-${i + 1}`,
          280 + (i % 6) * 126,
          220 + Math.floor(i / 6) * 82,
          104,
          72,
        ),
      ),
      target("back", 72, 610),
    ];
  if (s.screen === "playing")
    return [
      target("clear", 1010, 640, 120, 72),
      target("back", 1150, 640, 120, 72),
    ];
  if (s.screen === "solved")
    return (
      s.mode === "cascade"
        ? SOLVED_ITEMS
        : Array.from({ length: s.boardIndex < CAMPAIGN_LENGTH - 1 ? 3 : 2 })
    ).map((_, i) => target(`menu-${i}`, 490, 360 + i * 88, 300, 72));
  if (s.screen === "complete")
    return [
      target("menu-0", 490, 410, 300, 72),
      target("menu-1", 490, 500, 300, 72),
    ];
  return [];
}
function initial(): RefractState {
  return {
    screen: "title",
    mode: "campaign",
    menuIndex: 0,
    board: EMPTY,
    beams: [],
    tracing: null,
    boardIndex: 0,
    solvedBoards: [],
    unlockedCount: 1,
    selectIndex: 0,
    solvedCount: 0,
    tier: 1,
    pointer: { x: 0, y: 0, down: false, device: "mouse" },
    armedTarget: null,
    simTime: 0,
    muted: false,
  };
}
const poseBoard = (
  s: DeepReadonly<RefractState>,
  board: BoardState,
): RefractState => ({
  ...s,
  screen: "playing",
  menuIndex: 0,
  board,
  beams: freshBeams(board),
  tracing: null,
  armedTarget: null,
});
const clampMenu = (i: number, len: number) => ((i % len) + len) % len;
function legal(
  s: Pick<RefractState, "board" | "beams">,
  ch: Channel,
  a: Cell,
  b: Cell,
): boolean {
  if (Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row)) !== 1)
    return false;
  const n = nodeAt(s.board, b);
  const origin = nodeAt(s.board, a);
  if (!n || !origin) return false;
  if (n.channel && n.channel !== ch) return false;
  const beam = s.beams.find((x) => x.channel === ch)!;
  if (origin.kind === "emitter" && degree(beam, a) >= 1) return false;
  if (
    beam.cells.some(
      (c, i) =>
        i < beam.cells.length - 1 &&
        segmentKey(c, beam.cells[i + 1]!) === segmentKey(a, b),
    )
  )
    return false;
  if (
    s.beams.some(
      (x) =>
        x.channel !== ch &&
        x.cells.some(
          (c, i) =>
            i < x.cells.length - 1 &&
            segmentKey(c, x.cells[i + 1]!) === segmentKey(a, b),
        ),
    )
  )
    return false;
  const count = s.beams.reduce((total, current) => {
    if (n.kind === "crystal")
      return total + current.cells.filter((c) => cellsEqual(c, b)).length;
    return total + degree(current, b);
  }, 0);
  if (n.kind === "emitter" && count >= 1) return false;
  if (n.kind === "lens" && count >= 2) return false;
  if (n.kind === "crystal" && count >= (n.charges ?? 0)) return false;
  // Diagonal crossing exclusivity in any shared 2x2 square.
  if (a.col !== b.col && a.row !== b.row) {
    const other = segmentKey(
      { col: a.col, row: b.row },
      { col: b.col, row: a.row },
    );
    if (
      s.beams.some((x) =>
        x.cells.some(
          (c, i) =>
            i < x.cells.length - 1 && segmentKey(c, x.cells[i + 1]!) === other,
        ),
      )
    )
      return false;
  }
  return true;
}
function applyPointer(
  s: RefractState,
  kind: "down" | "move" | "up",
  x: number,
  y: number,
  device: PointerDevice,
  play?: (cue: string) => void,
): RefractState {
  let n: RefractState = {
    ...s,
    pointer: {
      x,
      y,
      down: kind === "up" ? false : kind === "down" ? true : s.pointer.down,
      device,
    },
  };
  const hitTarget = targets(n).find(
    (t) => x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h,
  );
  if (kind === "move" && !n.pointer.down && hitTarget) {
    const m = Number(
      hitTarget.id.split("-")[hitTarget.id.split("-").length - 1],
    );
    if (hitTarget.id.startsWith("menu-")) n = { ...n, menuIndex: m };
    if (hitTarget.id.startsWith("board-")) n = { ...n, selectIndex: m - 1 };
    return n;
  }
  if (kind === "down") {
    if (hitTarget) {
      if (hitTarget.id.startsWith("menu-"))
        n = { ...n, menuIndex: Number(hitTarget.id.slice(5)) };
      if (hitTarget.id.startsWith("board-"))
        n = { ...n, selectIndex: Number(hitTarget.id.slice(6)) - 1 };
      return { ...n, armedTarget: hitTarget.id };
    }
    if (n.screen !== "playing") return n;
    const cell = targetNode(n, x, y);
    if (!cell) return n;
    const nod = nodeAt(n.board, cell)!;
    const beam = n.beams.find((b) => b.channel === nod.channel);
    if (nod.kind === "emitter" && beam?.cells.length === 0) {
      n = {
        ...n,
        beams: n.beams.map((b) =>
          b.channel === beam!.channel ? { ...b, cells: [cell] } : b,
        ),
        tracing: { channel: beam.channel },
      };
      return n;
    }
    if (beam && beam.cells.length >= 2) {
      let cells = [...beam.cells];
      if (cellsEqual(cells[0]!, cell)) cells.reverse();
      else {
        const idx = cells
          .map((c, i) => (cellsEqual(c, cell) ? i : -1))
          .lastIndexOf(
            Math.max(...cells.map((c, i) => (cellsEqual(c, cell) ? i : -1))),
          );
        if (idx < 0) return n;
        cells = cells.slice(0, idx + 1);
      }
      n = {
        ...n,
        beams: n.beams.map((b) =>
          b.channel === beam!.channel ? { ...b, cells } : b,
        ),
        tracing: { channel: beam.channel },
      };
      return n;
    }
    return n;
  }
  if (kind === "move" && n.tracing) {
    const beam = n.beams.find((b) => b.channel === n.tracing!.channel)!;
    const end = beam.cells[beam.cells.length - 1];
    const cell = targetNode(n, x, y);
    if (end && cell && !cellsEqual(end, cell)) {
      if (
        beam.cells.length > 1 &&
        cellsEqual(beam.cells[beam.cells.length - 2]!, cell)
      ) {
        n = {
          ...n,
          beams: n.beams.map((b) =>
            b.channel === beam.channel
              ? { ...b, cells: b.cells.slice(0, -1) }
              : b,
          ),
        };
        play?.(CUES.retract);
      } else if (legal(n, n.tracing.channel, end, cell)) {
        n = {
          ...n,
          beams: n.beams.map((b) =>
            b.channel === beam.channel
              ? { ...b, cells: [...b.cells, cell] }
              : b,
          ),
        };
        play?.(CUES.connect);
      }
    }
  }
  if (kind === "up") {
    if (n.armedTarget) {
      const armed = n.armedTarget;
      n = { ...n, armedTarget: null };
      if (hitTarget?.id === armed) {
        const hadSegments = n.beams.some((beam) => beam.cells.length > 1);
        if (armed === "clear" && hadSegments) play?.(CUES.clear);
        return takeTarget(n, armed);
      }
    }
    if (n.tracing) {
      const b = n.beams.find((b) => b.channel === n.tracing!.channel)!;
      n = {
        ...n,
        tracing: null,
        beams: n.beams.map((x) =>
          x.channel === b.channel && x.cells.length < 2
            ? { ...x, cells: [] }
            : x,
        ),
      };
    }
  }
  return n;
}
function targetNode(
  s: Pick<RefractState, "board">,
  x: number,
  y: number,
): Cell | null {
  const found = s.board.nodes.find(
    (n) =>
      Math.hypot(
        cellX(n.col, s.board.cols) - x,
        cellY(n.row, s.board.rows) - y,
      ) <= NODE_HIT_R,
  );
  return found ? { col: found.col, row: found.row } : null;
}
function takeTarget(s: RefractState, id: string): RefractState {
  if (id === "back") return back(s);
  if (id === "clear") return clearState(s);
  if (id.startsWith("board-")) {
    const i = Number(id.slice(6)) - 1;
    if (i < s.unlockedCount || s.solvedBoards.includes(i))
      return enterCampaign({ ...s, boardIndex: i }, i);
    return s;
  }
  if (id.startsWith("menu-"))
    return confirm({ ...s, menuIndex: Number(id.slice(5)) });
  return s;
}
function back(s: RefractState): RefractState {
  if (s.screen === "playing")
    return {
      ...s,
      screen: s.mode === "campaign" ? "select" : "title",
      menuIndex: s.mode === "campaign" ? 0 : 1,
      beams: [],
      tracing: null,
      armedTarget: null,
    };
  if (s.screen === "howto")
    return { ...s, screen: "title", menuIndex: 2, armedTarget: null };
  if (s.screen === "select" || s.screen === "solved" || s.screen === "complete")
    return {
      ...s,
      screen: s.mode === "campaign" ? "select" : "title",
      menuIndex: s.mode === "campaign" ? 0 : 1,
      armedTarget: null,
    };
  return s;
}
function enterCampaign(s: RefractState, i: number): RefractState {
  return {
    ...poseBoard(
      { ...s, boardIndex: i, selectIndex: i },
      notationBoard(CAMPAIGN[i]!),
    ),
    mode: "campaign",
  };
}
function randomBoard(tier: number): BoardState {
  const t = TIERS[tier - 1]!;
  const cols =
    t.minCols + Math.floor(Math.random() * (t.maxCols - t.minCols + 1));
  const rows =
    t.minRows + Math.floor(Math.random() * (t.maxRows - t.minRows + 1));
  const channels = CHANNELS.slice(0, t.channels);
  const grid = Array.from({ length: rows }, () => Array(cols).fill("."));
  const routes: { channel: number; row: number; col: number }[][] =
    channels.map(() => []);
  for (let row = 0; row < rows; row++) {
    const owner = Math.min(
      channels.length - 1,
      Math.floor((row * channels.length) / rows),
    );
    const bandRows = new Set(routes[owner]!.map((cell) => cell.row)).size;
    const leftToRight = bandRows % 2 === 0;
    const ordered = Array.from({ length: cols }, (_, col) =>
      leftToRight ? col : cols - col - 1,
    );
    for (const col of ordered)
      routes[owner]!.push({ channel: owner, row, col });
  }
  // Each channel gets one continuous serpentine route through its own row band.
  // This makes every generated board solvable while keeping all nodes connected.
  const routeCells = routes.flat();
  routeCells.forEach((cell) => {
    const route = routes[cell.channel]!;
    const first = route[0] === cell;
    const last = route[route.length - 1] === cell;
    const letter = ["T", "S", "D"][cell.channel]!;
    grid[cell.row]![cell.col] = first || last ? letter : letter.toLowerCase();
  });
  const minCrystals = t.minCrystals;
  const crystalCount =
    minCrystals + Math.floor(Math.random() * (t.maxCrystals - minCrystals + 1));
  const candidates = routeCells.filter((cell) => {
    const route = routes[cell.channel]!;
    return route[0] !== cell && route[route.length - 1] !== cell;
  });
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  for (const cell of candidates.slice(0, crystalCount))
    grid[cell.row]![cell.col] = "1";
  return notationBoard(grid.map((row) => row.join("")));
}
function clearState(s: RefractState): RefractState {
  return {
    ...s,
    beams: s.beams.map((b) => ({ ...b, cells: [] })),
    tracing: null,
  };
}
function confirm(s: RefractState): RefractState {
  if (s.screen === "title") {
    if (s.menuIndex === 0)
      return {
        ...s,
        mode: "campaign",
        screen: "select",
        menuIndex: 0,
        armedTarget: null,
      };
    if (s.menuIndex === 1)
      return {
        ...poseBoard(
          { ...s, mode: "cascade", solvedCount: 0, tier: 1 },
          randomBoard(1),
        ),
        mode: "cascade",
      };
    return { ...s, screen: "howto", menuIndex: 0, armedTarget: null };
  }
  if (s.screen === "select") {
    if (
      s.selectIndex < s.unlockedCount ||
      s.solvedBoards.includes(s.selectIndex)
    )
      return enterCampaign(
        { ...s, mode: "campaign", boardIndex: s.selectIndex },
        s.selectIndex,
      );
    return s;
  }
  if (s.screen === "solved") {
    if (s.mode === "cascade") {
      if (s.menuIndex === 1)
        return {
          ...poseBoard({ ...s, solvedCount: 0, tier: 1 }, randomBoard(1)),
          mode: "cascade",
        };
      return { ...poseBoard(s, randomBoard(s.tier)), mode: "cascade" };
    }
    if (s.menuIndex === (s.boardIndex < CAMPAIGN_LENGTH - 1 ? 0 : -1))
      return enterCampaign(
        { ...s, boardIndex: s.boardIndex + 1 },
        s.boardIndex + 1,
      );
    if (s.menuIndex === 1) return enterCampaign(s, s.boardIndex);
    return { ...s, screen: "select", selectIndex: s.boardIndex, menuIndex: 0 };
  }
  if (s.screen === "complete") {
    return s.menuIndex === 0
      ? { ...s, screen: "select", selectIndex: s.boardIndex }
      : { ...s, screen: "title", menuIndex: 0 };
  }
  return s;
}
function moveMenu(s: RefractState, delta: number): RefractState {
  const len =
    s.screen === "title"
      ? 3
      : s.screen === "solved"
        ? s.mode === "cascade"
          ? 2
          : s.boardIndex < CAMPAIGN_LENGTH - 1
            ? 3
            : 2
        : s.screen === "complete"
          ? 2
          : 0;
  return len ? { ...s, menuIndex: clampMenu(s.menuIndex + delta, len) } : s;
}
function snap(s: DeepReadonly<RefractState>): Snapshot {
  const b = s.board;
  return {
    version: REFRACT_DEBUG_VERSION,
    screen: s.screen,
    mode: s.mode,
    menuIndex: s.menuIndex,
    boardIndex: s.boardIndex,
    solvedBoards: [...s.solvedBoards],
    unlockedCount: s.unlockedCount,
    selectIndex: s.selectIndex,
    solvedCount: s.solvedCount,
    tier: s.tier,
    board: {
      cols: b.cols,
      rows: b.rows,
      nodes: b.nodes.map((n) => ({
        col: n.col,
        row: n.row,
        x: cellX(n.col, b.cols),
        y: cellY(n.row, b.rows),
        kind: n.kind,
        channel: n.channel,
        charges: n.charges,
        spent:
          n.kind === "crystal"
            ? s.beams.reduce(
                (v, beam) =>
                  v +
                  beam.cells.filter((c) => c.col === n.col && c.row === n.row)
                    .length,
                0,
              )
            : null,
      })),
    },
    beams: Object.fromEntries(
      s.beams.map((x) => [
        x.channel,
        {
          cells: x.cells.map((c) => ({ ...c })),
          complete: complete(s, x.channel),
        },
      ]),
    ),
    solved: solved(s),
    tracing: s.tracing
      ? {
          channel: s.tracing.channel,
          live: {
            ...s.beams.find((b) => b.channel === s.tracing!.channel)!.cells[
              s.beams.find((b) => b.channel === s.tracing!.channel)!.cells
                .length - 1
            ]!,
          },
        }
      : null,
    pointer: { ...s.pointer },
    targets: targets(s),
    muted: s.muted,
    simTime: s.simTime,
  };
}
const debug: RefractDebugApi = {
  version: REFRACT_DEBUG_VERSION,
  reset(s) {
    return { ...initial(), muted: s.muted };
  },
  snapshot: snap,
  reconcile(s) {
    return { ...s };
  },
  setMode(s, mode) {
    return { ...s, mode };
  },
  setScreen(s, screen) {
    return { ...s, screen, armedTarget: null };
  },
  setMenuIndex(s, menuIndex) {
    return { ...s, menuIndex };
  },
  setSolvedCount(s, solvedCount) {
    if (!Number.isInteger(solvedCount) || solvedCount < 0)
      throw new Error("Invalid solvedCount");
    return { ...s, solvedCount };
  },
  setTier(s, tier) {
    if (!Number.isInteger(tier) || tier < 1 || tier > MAX_TIER)
      throw new Error("Invalid tier");
    return { ...s, tier };
  },
  generateBoard(s, tier) {
    if (!Number.isInteger(tier) || tier < 1 || tier > MAX_TIER)
      throw new Error("Invalid tier");
    return poseBoard(s, randomBoard(tier));
  },
  loadBoard(s, board) {
    return poseBoard(s, notationBoard(board));
  },
  pointerDown(s, x, y, device = "mouse") {
    return applyPointer(s as RefractState, "down", x, y, device);
  },
  pointerMove(s, x, y, device = "mouse") {
    return applyPointer(s as RefractState, "move", x, y, device);
  },
  pointerUp(s, device = "mouse") {
    return applyPointer(
      s as RefractState,
      "up",
      s.pointer.x,
      s.pointer.y,
      device,
    );
  },
  clear(s) {
    return clearState(s as RefractState);
  },
};
export const game: Game<RefractState, RefractDebugApi> = {
  initialize(api: InitApi<RefractState>) {
    for (const a of ACTIONS) api.input.register(a, { keys: [...BINDINGS[a]] });
    for (const [cue, freq] of [
      [CUES.connect, 620],
      [CUES.retract, 260],
      [CUES.channelComplete, 820],
      [CUES.solved, 980],
      [CUES.clear, 180],
    ] as const)
      api.audio.define(cue, {
        wave: "sine",
        freq,
        freqTo: freq * 0.72,
        gain: 0.13,
        durationMs: 110,
      });
    const sources: [string, (s: DeepReadonly<RefractState>) => string][] = [
      ["screen", (s) => s.screen],
      ["mode", (s) => s.mode],
      ["board", (s) => `${s.board.cols}×${s.board.rows}`],
      ["solved", (s) => String(solved(s))],
      [
        "crystals",
        (s) =>
          s.board.nodes
            .filter((node) => node.kind === "crystal")
            .map((node) => {
              const spent = s.beams.reduce(
                (total, beam) =>
                  total +
                  beam.cells.filter(
                    (cell) => cell.col === node.col && cell.row === node.row,
                  ).length,
                0,
              );
              return `${spent}/${node.charges}`;
            })
            .join(" ") || "—",
      ],
      [
        "pointer",
        (s) =>
          `${Math.round(s.pointer.x)},${Math.round(s.pointer.y)} ${s.pointer.device}`,
      ],
      ...CHANNELS.map(
        (c) =>
          [
            c,
            (s) => {
              const b = s.beams.find((x) => x.channel === c);
              return b
                ? `${b.cells.length} ${complete(s, c) ? "complete" : "open"}`
                : "—";
            },
          ] as [string, (s: DeepReadonly<RefractState>) => string],
      ),
    ];
    for (const [name, source] of sources)
      api.diagnostics.register(name, source);
    return [initial(), debug];
  },
  update(
    state: DeepReadonly<RefractState>,
    api: UpdateApi,
    dt: number,
  ): RefractState {
    let s = { ...state, simTime: state.simTime + dt, muted: api.audio.muted() };
    if (api.input.pressed("mute")) {
      api.audio.setMuted(!s.muted);
      s = { ...s, muted: !s.muted };
    }
    const actions = {
      up: api.input.pressed("up"),
      down: api.input.pressed("down"),
      left: api.input.pressed("left"),
      right: api.input.pressed("right"),
      confirm: api.input.pressed("confirm"),
      back: api.input.pressed("back"),
      clear: api.input.pressed("clear"),
    };
    if (s.screen === "playing" && actions.clear) {
      const had = s.beams.some((b) => b.cells.length > 1);
      s = clearState(s);
      if (had) api.audio.play(CUES.clear);
    }
    if (actions.back) s = back(s);
    if (actions.up) s = moveMenu(s, -1);
    if (actions.down) s = moveMenu(s, 1);
    if (s.screen === "select") {
      if (actions.left)
        s = {
          ...s,
          selectIndex:
            Math.floor(s.selectIndex / 6) * 6 +
            clampMenu((s.selectIndex % 6) - 1, 6),
        };
      if (actions.right)
        s = {
          ...s,
          selectIndex:
            Math.floor(s.selectIndex / 6) * 6 +
            clampMenu((s.selectIndex % 6) + 1, 6),
        };
      if (actions.up)
        s = {
          ...s,
          selectIndex: clampMenu(s.selectIndex - 6, CAMPAIGN_LENGTH),
        };
      if (actions.down)
        s = {
          ...s,
          selectIndex: clampMenu(s.selectIndex + 6, CAMPAIGN_LENGTH),
        };
    }
    if (actions.confirm) s = confirm(s);
    const previousBeams = s.beams;
    const pointer = api.input.pointer();
    const samples = api.input.pointerSamples().filter((p) => p.primary);
    if (samples.length) {
      for (const p of samples) {
        s = applyPointer(s, p.type, p.x, p.y, p.device, (c) =>
          api.audio.play(c),
        );
        if (s.screen === "playing" && solved(s)) break;
      }
    } else {
      if (api.input.pointerPressed())
        s = applyPointer(s, "down", pointer.x, pointer.y, pointer.device, (c) =>
          api.audio.play(c),
        );
      if (pointer.down)
        s = applyPointer(s, "move", pointer.x, pointer.y, pointer.device, (c) =>
          api.audio.play(c),
        );
      if (api.input.pointerReleased() && !(s.screen === "playing" && solved(s)))
        s = applyPointer(s, "up", pointer.x, pointer.y, pointer.device, (c) =>
          api.audio.play(c),
        );
    }
    s = {
      ...s,
      pointer: {
        x: pointer.x,
        y: pointer.y,
        down: pointer.down,
        device: pointer.device,
      },
    };
    for (const beam of s.beams) {
      if (
        !complete({ board: s.board, beams: previousBeams }, beam.channel) &&
        complete(s, beam.channel)
      )
        api.audio.play(CUES.channelComplete);
    }
    if (s.screen === "playing" && solved(s)) {
      api.audio.play(CUES.solved);
      if (s.mode === "campaign") {
        const solvedBoards = s.solvedBoards.includes(s.boardIndex)
          ? s.solvedBoards
          : [...s.solvedBoards, s.boardIndex].sort((a, b) => a - b);
        const unlockedCount = Math.min(
          CAMPAIGN_LENGTH,
          Math.max(s.unlockedCount, s.boardIndex + 2),
        );
        s = {
          ...s,
          solvedBoards,
          unlockedCount,
          screen:
            solvedBoards.length === CAMPAIGN_LENGTH ? "complete" : "solved",
          selectIndex: s.boardIndex,
          menuIndex: 0,
          tracing: null,
        };
      } else {
        const solvedCount = s.solvedCount + 1;
        s = {
          ...s,
          solvedCount,
          tier: Math.min(Math.floor(solvedCount / TIER_ADVANCE) + 1, MAX_TIER),
          screen: "solved",
          menuIndex: 0,
          tracing: null,
        };
      }
    }
    if (s.screen !== state.screen) s = { ...s, armedTarget: null };
    return s;
  },
  render(state: DeepReadonly<RefractState>, api: RenderApi) {
    draw(state, api.ctx);
  },
};
function draw(
  s: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  const grad = ctx.createRadialGradient(640, 355, 20, 640, 355, 700);
  grad.addColorStop(0, "#14233a");
  grad.addColorStop(1, BACKGROUND);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.strokeStyle = "rgba(111,157,197,.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < STAGE_W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, STAGE_H);
    ctx.stroke();
  }
  for (let y = 20; y < STAGE_H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(STAGE_W, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#d8e9f5";
  ctx.font = "600 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("OPTICAL BENCH   /   FIELD STUDY", 640, 42);
  if (s.screen === "title") {
    ctx.textAlign = "center";
    ctx.font = "800 86px system-ui";
    ctx.fillStyle = "#f1f8ff";
    ctx.fillText(TITLE_TEXT, 640, 230);
    ctx.font = "600 19px system-ui";
    ctx.fillStyle = "#61ddcf";
    ctx.fillText(TAGLINE_TEXT, 640, 272);
    menuItems(ctx, TITLE_ITEMS, s.menuIndex, 350);
    ctx.fillStyle = "#71879a";
    ctx.font = "14px system-ui";
    ctx.fillText("TRACE THE NODES. LET THE LIGHT FIND ITS WAY.", 640, 650);
    return;
  }
  if (s.screen === "howto") {
    heading(ctx, "HOW TO PLAY", "Every route begins with a touch.");
    const lines = [
      "Each channel has two outlined emitters. Press one and drag to draw its beam.",
      "Thread every filled lens of that shape, then finish at the other emitter.",
      "Move between neighboring nodes in any direction. Empty cells block the way.",
      "Crystals accept any channel. Spend every charge exactly once.",
      "A beam cannot share segments or cross another beam's diagonal.",
      "Release to keep a route. Backtrack along it to retract; press R to clear.",
      "The rules refuse an invalid move, so keep tracing until the board glows.",
    ];
    ctx.textAlign = "left";
    ctx.font = "20px system-ui";
    lines.forEach((l, i) => {
      ctx.fillStyle = i === 0 ? "#55dfcc" : "#c3d5e4";
      ctx.fillText(l, 250, 230 + i * 48);
    });
    control(ctx, 72, 610, BACK_LABEL);
    return;
  }
  if (s.screen === "select") {
    heading(
      ctx,
      "CAMPAIGN",
      "Choose any unlocked board. The course remembers your solved routes.",
    );
    for (let row = 0; row < 4; row++) {
      ctx.textAlign = "left";
      ctx.font = "700 13px system-ui";
      ctx.fillStyle = "#718aa2";
      ctx.fillText(SET_LABELS[row]!, 240, 214 + row * 82);
    }
    for (let i = 0; i < CAMPAIGN_LENGTH; i++) {
      const x = 280 + (i % 6) * 126,
        y = 220 + Math.floor(i / 6) * 82,
        locked = i >= s.unlockedCount && !s.solvedBoards.includes(i),
        done = s.solvedBoards.includes(i),
        sel = s.selectIndex === i;
      ctx.fillStyle = sel
        ? "#275a70"
        : done
          ? "#173e3c"
          : locked
            ? "#151c28"
            : "#1a2a3c";
      roundRect(ctx, x, y, 104, 72, 12, true);
      ctx.strokeStyle = sel ? "#62e8d7" : done ? "#5ed4a8" : "#334a61";
      ctx.lineWidth = sel ? 2 : 1;
      roundRect(ctx, x, y, 104, 72, 12, false);
      ctx.fillStyle = locked ? "#596879" : done ? "#8ff2c8" : "#e5f0f8";
      ctx.textAlign = "center";
      ctx.font = "700 20px system-ui";
      ctx.fillText(String(i + 1).padStart(2, "0"), x + 52, y + 26);
      ctx.font = "10px system-ui";
      ctx.fillText(
        locked ? "LOCKED" : done ? "SOLVED" : "OPEN",
        x + 52,
        y + 45,
      );
    }
    control(ctx, 72, 610, BACK_LABEL);
    return;
  }
  if (s.board.cols) {
    drawBoard(s, ctx);
  }
  if (s.screen === "playing") {
    control(ctx, 1010, 640, CLEAR_LABEL);
    control(ctx, 1150, 640, BACK_LABEL);
    ctx.textAlign = "left";
    ctx.font = "600 15px system-ui";
    ctx.fillStyle = "#8ea9be";
    ctx.fillText("R  /  CLEAR", 1044, 620);
    if (s.mode === "campaign") {
      ctx.textAlign = "center";
      ctx.fillStyle = "#dcebf5";
      ctx.font = "600 18px system-ui";
      ctx.fillText(
        `BOARD ${String(s.boardIndex + 1).padStart(2, "0")}  /  ${CAMPAIGN_LENGTH}`,
        640,
        86,
      );
      ctx.font = "13px system-ui";
      ctx.fillStyle = "#7f9bb2";
      ctx.fillText(SET_LABELS[Math.floor(s.boardIndex / 6)]!, 640, 108);
    } else {
      ctx.fillStyle = "#dcebf5";
      ctx.font = "600 15px system-ui";
      ctx.fillText(`${HUD_SOLVED_LABEL}  ${s.solvedCount}`, 56, 105);
      ctx.fillText(`${HUD_TIER_LABEL}  ${s.tier}`, 56, 130);
    }
  }
  if (s.screen === "solved") {
    overlay(ctx);
    heading(
      ctx,
      SOLVED_TITLE_TEXT,
      s.mode === "cascade"
        ? `Cascade ${s.solvedCount} complete · tier ${s.tier}`
        : `BOARD ${String(s.boardIndex + 1).padStart(2, "0")} COMPLETE`,
    );
    const items =
      s.mode === "cascade"
        ? SOLVED_ITEMS
        : s.boardIndex < CAMPAIGN_LENGTH - 1
          ? ["NEXT BOARD", "REPLAY", "BACK TO SELECT"]
          : ["REPLAY", "BACK TO SELECT"];
    menuItems(ctx, items, s.menuIndex, 360);
  }
  if (s.screen === "complete") {
    overlay(ctx);
    heading(
      ctx,
      "COURSE COMPLETE",
      `All ${CAMPAIGN_LENGTH} boards solved. Every path is yours to revisit.`,
    );
    menuItems(ctx, ["BACK TO SELECT", "TITLE SCREEN"], s.menuIndex, 410);
  }
}
function drawBoard(
  s: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  const { board } = s;
  ctx.save();
  for (let r = 0; r < board.rows; r++)
    for (let c = 0; c < board.cols; c++) {
      const x = cellX(c, board.cols),
        y = cellY(r, board.rows);
      ctx.fillStyle = "rgba(145,188,220,.045)";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  for (const beam of s.beams) {
    const color = COLORS[beam.channel];
    if (beam.cells.length > 1) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 17;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      beam.cells.forEach((p, i) =>
        i
          ? ctx.lineTo(cellX(p.col, board.cols), cellY(p.row, board.rows))
          : ctx.moveTo(cellX(p.col, board.cols), cellY(p.row, board.rows)),
      );
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const n of board.nodes) {
    const x = cellX(n.col, board.cols),
      y = cellY(n.row, board.rows);
    if (n.kind === "crystal") {
      const spent = s.beams.reduce(
        (v, b) =>
          v + b.cells.filter((p) => p.col === n.col && p.row === n.row).length,
        0,
      );
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#172840";
      ctx.strokeStyle = "#e7bd72";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#e4a840";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.rect(-20, -20, 40, 40);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#fff0d2";
      ctx.textAlign = "center";
      ctx.font = "700 16px system-ui";
      ctx.fillText(`${spent}/${n.charges}`, x, y + 6);
      continue;
    }
    const color = COLORS[n.channel!],
      isTri = n.channel === "triangle",
      isDiamond = n.channel === "diamond";
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    if (isTri) {
      ctx.moveTo(0, -NODE_R);
      ctx.lineTo(NODE_R * 0.88, NODE_R * 0.72);
      ctx.lineTo(-NODE_R * 0.88, NODE_R * 0.72);
      ctx.closePath();
    } else if (isDiamond) {
      ctx.moveTo(0, -NODE_R);
      ctx.lineTo(NODE_R, 0);
      ctx.lineTo(0, NODE_R);
      ctx.lineTo(-NODE_R, 0);
      ctx.closePath();
    } else
      ctx.rect(-NODE_R * 0.78, -NODE_R * 0.78, NODE_R * 1.56, NODE_R * 1.56);
    ctx.fillStyle = n.kind === "lens" ? color : "#0d1727";
    ctx.strokeStyle = color;
    ctx.lineWidth = n.kind === "emitter" ? 4 : 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = n.kind === "lens" ? 13 : 8;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  // Channel completion pips remain beyond the board bounds.
  s.beams.forEach((b, i) => {
    const x = 380 + i * 190;
    const col = COLORS[b.channel];
    ctx.fillStyle = col;
    ctx.font = "700 14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(b.channel.toUpperCase(), x, 678);
    ctx.fillStyle = b.cells.length && complete(s, b.channel) ? col : "#71869a";
    ctx.fillText(complete(s, b.channel) ? "SEALED" : "OPEN", x + 104, 678);
  });
}
function heading(
  ctx: CanvasRenderingContext2D,
  title: string,
  sub: string,
): void {
  ctx.textAlign = "center";
  ctx.fillStyle = "#eff8ff";
  ctx.font = "800 34px system-ui";
  ctx.fillText(title, 640, 174);
  ctx.fillStyle = "#91a9bd";
  ctx.font = "16px system-ui";
  ctx.fillText(sub, 640, 204);
}
function menuItems(
  ctx: CanvasRenderingContext2D,
  items: readonly string[],
  active: number,
  top: number,
): void {
  items.forEach((item, i) => {
    const y = top + i * 88;
    ctx.save();
    ctx.fillStyle = i === active ? "#163e4c" : "rgba(15,27,43,.8)";
    roundRect(ctx, 490, y, 300, 62, 15, true);
    ctx.strokeStyle = i === active ? "#56e2d0" : "#26394d";
    ctx.lineWidth = i === active ? 2 : 1;
    roundRect(ctx, 490, y, 300, 62, 15, false);
    ctx.fillStyle = i === active ? "#e9fffb" : "#9aafc2";
    ctx.textAlign = "center";
    ctx.font = `${i === active ? 700 : 550} 18px system-ui`;
    ctx.fillText(item, 640, y + 39);
    ctx.restore();
  });
}
function control(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
): void {
  ctx.fillStyle = "#17283a";
  ctx.strokeStyle = "#46637b";
  roundRect(ctx, x, y, 120, 72, 13, true);
  roundRect(ctx, x, y, 120, 72, 13, false);
  ctx.fillStyle = "#d5e4ef";
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, x + 60, y + 43);
}
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) ctx.fill();
  else ctx.stroke();
}
function overlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(5,10,18,.78)";
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
}
