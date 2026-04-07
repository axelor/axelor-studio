import { produce } from "immer";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import uniqBy from "lodash/uniqBy";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { createStore } from "../collaboration.store";

import { SocketChannel } from "./Socket";

interface CollaborationUser {
  id: number | string;
  code: string;
  [key: string]: unknown;
}

interface UserState {
  dirty?: boolean;
  dirtyDate?: dayjs.Dayjs;
  joinDate?: dayjs.Dayjs;
  leftDate?: dayjs.Dayjs;
  version?: number;
  versionDate?: dayjs.Dayjs;
  [key: string]: unknown;
}

interface RoomState {
  model: string;
  recordId: string | number;
  recordVersion: number;
  dirty: boolean;
  users: CollaborationUser[];
  states: Record<string, UserState>;
  $join?: boolean;
  [key: string]: unknown;
}

interface RoomStore {
  get(): RoomState;
  set(fn: (prev: RoomState) => RoomState): void;
  subscribe(listener: (state: RoomState, prev: RoomState) => void): () => void;
}

interface CollaborationMessage {
  command: string;
  model?: string;
  recordId?: string | number;
  message?: Record<string, unknown>;
  user?: CollaborationUser;
  users?: CollaborationUser[];
  states?: Record<string, UserState>;
}

const roomStores: Record<string, RoomStore> = {};
const roomJoinCounts: Record<string, number> = {};

const CollaborationService = () => {
  // Rejoin
  function onopen() {
    for (const store of Object.values(roomStores)) {
      const room = store?.get() ?? ({} as RoomState);
      const { model, recordId, dirty } = room;
      let version = 0;
      const currentVersion = room.recordVersion;
      if (currentVersion > version) {
        version = currentVersion;
      }
      channel.send({
        command: "JOIN",
        model,
        recordId,
        message: { dirty, version },
      });
    }
  }

  const channel = new SocketChannel("collaboration", { onopen });
  let unsubscribeCallback: (() => void) | null = null;

  const collaborationCallback = (data: unknown) => {
    const {
      command,
      model,
      recordId,
      message = {},
      user,
      users,
      states,
    } = data as CollaborationMessage;
    if (!model || !recordId) return;
    const key = getKey(model, recordId);
    const roomStore = roomStores[key];

    if (!roomStore) {
      console.error(`[Collaboration] No room with key ${key}`);
      return;
    }

    if (!user) {
      console.error(`[Collaboration] Command ${command} received with no user.`);
      return;
    }

    const room = roomStore.get();

    if (users || states) {
      updateStore(roomStore, (draft) => {
        states && (draft.states = states);
        users && updateUsers(draft, [user, ...users]);
      });
    }

    switch (command) {
      case "JOIN":
        updateStore(roomStore, (draft) => {
          draft.states = draft.states || {};
          const newUserState: UserState = {
            ...omit(draft.states[user.code], "leftDate"),
            ...(message as UserState),
            joinDate: dayjs(),
          };
          if (newUserState.dirty) {
            newUserState.dirtyDate = dayjs();
          }
          draft.states[user.code] = newUserState;
          updateUsers(draft, [user, ...(users ?? [])]);
        });
        break;
      case "LEFT": {
        const state = room.states?.[user.code] || {};
        // Keep user if they saved the record.
        if ((state.version ?? 0) > room.recordVersion) {
          updateStore(roomStore, (draft) => {
            draft.states = draft.states || {};
            draft.states[user.code].leftDate = dayjs();
          });
        } else {
          updateStore(roomStore, (draft) => {
            draft.states = draft.states || {};
            draft.users = (draft.users || []).filter((u) => u.id !== user.id);
            delete draft.states[user.code];
          });
        }
        break;
      }
      case "STATE": {
        const newState: UserState = { ...(message as UserState) };
        if (newState.version != null && newState.dirty == null) {
          newState.dirty = false;
        }
        if (newState.dirty) {
          newState.dirtyDate = dayjs();
        }
        if ((newState.version ?? 0) <= room.recordVersion) {
          delete newState.version;
          delete newState.versionDate;
        } else if (newState.version != null) {
          newState.versionDate = dayjs();
        }
        updateStore(roomStore, (draft) => {
          draft.states = draft.states || {};
          const state: UserState = draft.states[user.code] || {};

          if (state.joinDate == null) {
            state.joinDate = dayjs();
          }

          if (newState.version && newState.version === state.version) {
            delete newState.versionDate;
          }
          if (newState.dirty && newState.dirty === state.dirty) {
            delete newState.dirtyDate;
          }

          draft.states[user.code] = { ...state, ...newState };
          updateUsers(draft, [user, ...(users || [])]);
        });
        break;
      }
    }
  };

  // updating data
  function updateUsers(draft: RoomState, users: CollaborationUser[]) {
    const states = draft.states || {};
    const recordVersion = draft.recordVersion;
    draft.users = uniqBy([...users, ...(draft.users || [])], "id").sort((userA, userB) => {
      const stateA = states[userA?.code] || {};
      const stateB = states[userB?.code] || {};

      const versionDiff = (stateB.version || recordVersion) - (stateA.version || recordVersion);
      if (versionDiff) return versionDiff;

      const versionDateDiff =
        dayjs(stateB.versionDate ?? 0).valueOf() - dayjs(stateA.versionDate ?? 0).valueOf();
      if (versionDateDiff) return versionDateDiff;

      const dirtyDiff = Number(stateB.dirty ?? false) - Number(stateA.dirty ?? false);
      if (dirtyDiff) return dirtyDiff;

      const dirtyDateDiff =
        dayjs(stateB.dirtyDate ?? 0).valueOf() - dayjs(stateA.dirtyDate ?? 0).valueOf();
      if (dirtyDateDiff) return dirtyDateDiff;

      const joinDateDiff =
        dayjs(stateB.joinDate ?? 0).valueOf() - dayjs(stateA.joinDate ?? 0).valueOf();
      if (joinDateDiff) return joinDateDiff;

      return 0;
    });
  }

  function updateRoom(recordState: {
    model: string;
    recordId: string | number;
    recordVersion: number;
    dirty: boolean;
  }) {
    const { model, recordId, recordVersion, dirty } = recordState;
    const key = getKey(model, recordId);
    const roomStore = roomStores[key];

    if (!roomStore) {
      console.error(`[Collaboration] No room with key ${key}`);
      return;
    }

    const room = roomStore.get();
    let command: string | null = room.$join ? "JOIN" : null;
    const oldProps = command === "JOIN" ? null : room;

    if (oldProps) {
      const { dirty: _dirty, recordVersion: _recordVersion } = oldProps;
      if (_dirty === dirty && _recordVersion === recordVersion) {
        return;
      }
    }

    updateStore(roomStore, (draft) => {
      draft.dirty = dirty;
      delete draft.$join;

      if (draft.recordVersion !== recordVersion) {
        draft.recordVersion = recordVersion;

        // Remove left users if version is up-to-date
        const states = draft.states || {};
        const users = (draft.users || []).filter((user) => {
          const state = states[user?.code] || {};
          return !state.leftDate || (state.version ?? 0) > recordVersion;
        });
        if (users.length !== (draft.users || []).length) {
          draft.users = users;
        }
      }
    });

    command = command ?? "STATE";

    if (command) {
      const message: Record<string, unknown> = {};
      if (oldProps && oldProps.dirty !== dirty) {
        message.dirty = dirty;
      }
      const version = recordVersion;
      if (oldProps && version !== oldProps.recordVersion) {
        message.version = version;
      }
      channel.send({
        command,
        model,
        recordId,
        message: isEmpty(message) ? undefined : message,
      });
    }
  }

  const channelSubscribe = (): boolean => {
    if (unsubscribeCallback) return false;
    unsubscribeCallback = channel.subscribe(collaborationCallback);
    return true;
  };

  const channelUnsubscribe = (): boolean => {
    if (!unsubscribeCallback || !isEmpty(roomStores)) return false;
    unsubscribeCallback();
    unsubscribeCallback = null;
    return true;
  };

  // whether a user is joined the room or not
  function joinRoom(
    {
      model,
      recordId,
      recordVersion,
      dirty,
    }: {
      model: string;
      recordId: string | number;
      recordVersion: number;
      dirty: boolean;
    },
    listener: (state: RoomState, prev: RoomState) => void,
  ): () => void {
    const key = getKey(model, recordId);
    // roomStores ==> all stores
    let roomStore = roomStores[key];
    if (roomStore == null) {
      // save that key
      roomStore = roomStores[key] = createStore({
        model,
        recordId,
        recordVersion,
        dirty,
        users: [],
        states: {},
        $join: true,
      }) as unknown as RoomStore; // safety: zustand store shape is dynamic Record
      roomJoinCounts[key] = 1;
    } else {
      ++roomJoinCounts[key];
      const room = roomStore.get();
      listener(room, room);
    }

    roomStore.subscribe(listener);
    channelSubscribe();

    return () => {
      if (--roomJoinCounts[key] <= 0) {
        channel.send({ command: "LEFT", model, recordId });
        delete roomStores[key];
        delete roomJoinCounts[key];
      }
      channelUnsubscribe();
    };
  }

  function updateStore(store: RoomStore, recipe: (draft: RoomState) => void) {
    store.set((prev) => produce(prev, recipe));
  }

  return {
    joinRoom,
    updateRoom,
  };
};

let serviceInstance: ReturnType<typeof CollaborationService> | null = null;

export const getCollaborationService = () => {
  if (!serviceInstance) {
    serviceInstance = CollaborationService();
  }
  return serviceInstance;
};

function getKey(model: string, recordId: string | number): string {
  return `${model}:${recordId}`;
}
