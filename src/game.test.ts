import { describe, expect, it, vi } from "vitest";
import { game } from "./game";
import type { RefractState } from "./game";
import { BOARD_CX, BOARD_CY, CELL_PITCH } from "./constants";

async function setup() {
  const diagnostics = new Map<string, (state: RefractState) => unknown>();
  const api = {
    input: { register: vi.fn(), layout: () => null },
    audio: { define: vi.fn(), load: vi.fn() },
    diagnostics: {
      register: (name: string, read: (state: RefractState) => unknown) =>
        diagnostics.set(name, read),
    },
    events: {} as never,
    assets: {} as never,
    viewport: () => ({}) as never,
  } as never;
  const result = await game.initialize(api);
  const [state, debug] = result;
  return { state, debug, diagnostics };
}

describe("Refract state and rule core", () => {
  it("initializes the complete title state and registers the input vocabulary", async () => {
    const { state } = await setup();
    expect(state.screen).toBe("title");
    expect(state.pointer).toEqual({ x: 0, y: 0, down: false, device: "mouse" });
    expect(state.unlockedCount).toBe(1);
  });

  it("loads notation, derives node positions and rejects malformed boards", async () => {
    const { state, debug } = await setup();
    const board = debug.loadBoard(state, ["TtT", "..."]);
    const snap = debug.snapshot(board) as {
      board: { nodes: { x: number; y: number }[] };
    };
    expect(snap.board.nodes[0]).toEqual({
      col: 0,
      row: 0,
      x: BOARD_CX - CELL_PITCH,
      y: BOARD_CY - CELL_PITCH / 2,
      kind: "emitter",
      channel: "triangle",
      charges: null,
      spent: null,
    });
    expect(() => debug.loadBoard(state, ["T.", "..."])).toThrow();
  });

  it("traces a legal route and refuses a jump across an empty cell", async () => {
    const { state, debug } = await setup();
    let current = debug.loadBoard(state, ["TtT"]);
    current = debug.pointerDown(
      current,
      BOARD_CX - CELL_PITCH,
      BOARD_CY,
      "touch",
    );
    current = debug.pointerMove(current, BOARD_CX, BOARD_CY, "touch");
    current = debug.pointerUp(current, "touch");
    expect(debug.snapshot(current)).toMatchObject({
      screen: "playing",
      pointer: { device: "touch", down: false },
      beams: {
        triangle: {
          cells: [
            { col: 0, row: 0 },
            { col: 1, row: 0 },
          ],
          complete: false,
        },
      },
    });
    const empty = debug.loadBoard(state, ["T.T"]);
    let attempted = debug.pointerDown(
      empty,
      BOARD_CX - CELL_PITCH,
      BOARD_CY,
      "mouse",
    );
    attempted = debug.pointerMove(
      attempted,
      BOARD_CX + CELL_PITCH,
      BOARD_CY,
      "mouse",
    );
    expect(debug.snapshot(attempted)).toMatchObject({
      beams: { triangle: { cells: [{ col: 0, row: 0 }] } },
    });
  });

  it("poses independent values and keeps reset progress and mute contract", async () => {
    const { state, debug } = await setup();
    const altered = debug.setTier(debug.setSolvedCount(state, 10), 4);
    expect(state.tier).toBe(1);
    expect(debug.snapshot(altered)).toMatchObject({ tier: 4, solvedCount: 10 });
    expect(
      debug.snapshot(debug.reset({ ...altered, muted: true })),
    ).toMatchObject({ screen: "title", tier: 1, solvedCount: 0, muted: true });
  });

  it("recognizes a completed channel and advances campaign progress", async () => {
    const { state, debug } = await setup();
    let current = debug.loadBoard(state, ["TtT"]);
    current = debug.pointerDown(current, BOARD_CX - CELL_PITCH, BOARD_CY);
    current = debug.pointerMove(current, BOARD_CX, BOARD_CY);
    current = debug.pointerMove(current, BOARD_CX + CELL_PITCH, BOARD_CY);
    current = debug.pointerUp(current);
    const api = {
      input: {
        pressed: () => false,
        pointer: () => ({
          x: BOARD_CX + CELL_PITCH,
          y: BOARD_CY,
          down: false,
          device: "mouse",
          buttons: [],
        }),
        pointerSamples: () => [],
        pointerPressed: () => false,
        pointerReleased: () => false,
      },
      audio: { muted: () => false, setMuted: vi.fn(), play: vi.fn() },
    } as never;
    current = game.update(current, api, 1 / 60);
    expect(debug.snapshot(current)).toMatchObject({
      screen: "solved",
      solved: true,
      solvedBoards: [0],
      unlockedCount: 2,
      tracing: null,
    });
  });
});
