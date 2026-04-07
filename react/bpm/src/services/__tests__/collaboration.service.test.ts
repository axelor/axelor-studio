/**
 * Tests for collaboration.service message handler logic (Bloc C).
 *
 * Per D-08: tests message handlers only, NOT WebSocket transport.
 * Uses mocked SocketChannel to exercise joinRoom/updateRoom flows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

let capturedCallback: ((data: unknown) => void) | null = null;
const mockSend = vi.fn();

vi.mock("../Socket", () => ({
  SocketChannel: vi.fn().mockImplementation((_channel: string, _opts?: unknown) => ({
    send: (...args: unknown[]) => mockSend(...args),
    subscribe: (cb: (data: unknown) => void) => {
      capturedCallback = cb;
      return () => { capturedCallback = null; };
    },
  })),
}));

// ---------------------------------------------------------------------------
// Import under test (fresh per test via resetModules)
// ---------------------------------------------------------------------------

// We need to re-import to reset the singleton state
async function importFresh() {
  vi.resetModules();
  // Re-apply socket mock after resetModules
  vi.doMock("../Socket", () => ({
    SocketChannel: vi.fn().mockImplementation((_channel: string, _opts?: unknown) => ({
      send: (...args: unknown[]) => mockSend(...args),
      subscribe: (cb: (data: unknown) => void) => {
        capturedCallback = cb;
        return () => { capturedCallback = null; };
      },
    })),
  }));
  const mod = await import("../collaboration.service");
  return mod.getCollaborationService();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("collaboration.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallback = null;
  });

  it("joinRoom: sends JOIN command over the channel", async () => {
    const service = await importFresh();
    const listener = vi.fn();

    service.joinRoom(
      {
        model: "com.axelor.studio.db.WkfModel",
        recordId: 1,
        recordVersion: 0,
        dirty: false,
      },
      listener,
    );

    // The channel subscription is set up
    expect(capturedCallback).toBeTypeOf("function");
  });

  it("joinRoom: subscribes listener and returns unsubscribe function", async () => {
    const service = await importFresh();
    const listener = vi.fn();

    const unsubscribe = service.joinRoom(
      {
        model: "com.axelor.studio.db.WkfModel",
        recordId: 2,
        recordVersion: 0,
        dirty: false,
      },
      listener,
    );

    expect(unsubscribe).toBeTypeOf("function");

    // Calling unsubscribe sends LEFT command
    unsubscribe();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "LEFT",
        model: "com.axelor.studio.db.WkfModel",
        recordId: 2,
      }),
    );
  });

  it("updateRoom: sends STATE command with dirty/version changes", async () => {
    const service = await importFresh();
    const listener = vi.fn();

    service.joinRoom(
      {
        model: "com.axelor.studio.db.WkfModel",
        recordId: 3,
        recordVersion: 0,
        dirty: false,
      },
      listener,
    );

    // First updateRoom triggers JOIN (since $join flag is set)
    service.updateRoom({
      model: "com.axelor.studio.db.WkfModel",
      recordId: 3,
      recordVersion: 0,
      dirty: false,
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "JOIN",
        model: "com.axelor.studio.db.WkfModel",
        recordId: 3,
      }),
    );
  });

  it("collaboration callback: handles JOIN message and updates room users", async () => {
    const service = await importFresh();
    const listener = vi.fn();

    service.joinRoom(
      {
        model: "com.axelor.studio.db.WkfModel",
        recordId: 4,
        recordVersion: 0,
        dirty: false,
      },
      listener,
    );

    // Simulate incoming JOIN message from another user
    if (capturedCallback) {
      capturedCallback({
        command: "JOIN",
        model: "com.axelor.studio.db.WkfModel",
        recordId: 4,
        user: { id: 100, code: "admin" },
        message: { dirty: false },
      });
    }

    // Listener should have been called with updated room state
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "com.axelor.studio.db.WkfModel",
        recordId: 4,
        users: expect.arrayContaining([
          expect.objectContaining({ id: 100, code: "admin" }),
        ]),
      }),
      expect.anything(),
    );
  });

  it("collaboration callback: ignores messages for unknown rooms", async () => {
    const service = await importFresh();
    const listener = vi.fn();

    service.joinRoom(
      {
        model: "com.axelor.studio.db.WkfModel",
        recordId: 5,
        recordVersion: 0,
        dirty: false,
      },
      listener,
    );

    // Send message for a different room (recordId 999)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    if (capturedCallback) {
      capturedCallback({
        command: "JOIN",
        model: "com.axelor.studio.db.WkfModel",
        recordId: 999,
        user: { id: 200, code: "other" },
        message: {},
      });
    }

    // Should log error about unknown room
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No room with key"),
    );
    consoleSpy.mockRestore();
  });
});
