import produce from "immer";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import uniqBy from "lodash/uniqBy";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { SocketChannel } from "./Socket";
import { createStore } from "../collaboration.store";

const roomStores = {};
const roomJoinCounts = {};

const CollaborationService = () => {
  // Rejoin
  function onopen() {
    for (const store of Object.values(roomStores)) {
      const room = store?.get() ?? {};
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
  let unsubscribeCallback = null;

  const collaborationCallback = (data) => {
    const {
      command,
      model,
      recordId,
      message = {},
      user,
      users,
      states,
    } = data;
    const key = getKey(model, recordId);
    const roomStore = roomStores[key];

    if (!roomStore) {
      console.error(`No room with key ${key}`);
      return;
    }

    if (!user) {
      console.error(`Command ${command} received with no user.`);
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
          const newUserState = {
            ...omit(draft.states[user.code], "leftDate"),
            ...message,
            joinDate: dayjs(),
          };
          if (newUserState.dirty) {
            newUserState.dirtyDate = dayjs();
          }
          draft.states[user.code] = newUserState;
          updateUsers(draft, [user, ...(users ?? [])]);
        });
        break;
      case "LEFT":
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
      case "STATE":
        const newState = { ...message };
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
          const state = draft.states[user.code] || {};

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
  };

  // updating data
  function updateUsers(draft, users) {
    const states = draft.states || {};
    const recordVersion = draft.recordVersion;
    draft.users = uniqBy([...users, ...(draft.users || [])], "id").sort(
      (userA, userB) => {
        const stateA = states[userA?.code] || {};
        const stateB = states[userB?.code] || {};

        const versionDiff =
          (stateB.version || recordVersion) - (stateA.version || recordVersion);
        if (versionDiff) return versionDiff;

        const versionDateDiff =
          dayjs(stateB.versionDate ?? 0).valueOf() -
          dayjs(stateA.versionDate ?? 0).valueOf();
        if (versionDateDiff) return versionDateDiff;

        const dirtyDiff =
          Number(stateB.dirty ?? false) - Number(stateA.dirty ?? false);
        if (dirtyDiff) return dirtyDiff;

        const dirtyDateDiff =
          dayjs(stateB.dirtyDate ?? 0).valueOf() -
          dayjs(stateA.dirtyDate ?? 0).valueOf();
        if (dirtyDateDiff) return dirtyDateDiff;

        const joinDateDiff =
          dayjs(stateB.joinDate ?? 0).valueOf() -
          dayjs(stateA.joinDate ?? 0).valueOf();
        if (joinDateDiff) return joinDateDiff;

        return 0;
      }
    );
  }

  function updateRoom(recordState) {
    const { model, recordId, recordVersion, dirty } = recordState;
    const key = getKey(model, recordId);
    const roomStore = roomStores[key];

    if (!roomStore) {
      console.error(`No room with key ${key}`);
      return;
    }

    const room = roomStore.get();
    let command = room.$join ? "JOIN" : null;
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
      const message = {};
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

  const channelSubscribe = () => {
    if (unsubscribeCallback) return false;
    unsubscribeCallback = channel.subscribe(collaborationCallback);
    return true;
  };

  const channelUnsubscribe = () => {
    if (!unsubscribeCallback || !isEmpty(roomStores)) return false;
    unsubscribeCallback();
    unsubscribeCallback = null;
    return true;
  };

  // whether a user is joined the room or not
  function joinRoom({ model, recordId, recordVersion, dirty }, listener) {
    const key = getKey(model, recordId);
    // roomStores ==> all storesstores
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
      });
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

  function updateStore(store, recipe) {
    store.set((prev) => produce(prev, recipe));
  }

  return {
    joinRoom,
    updateRoom,
  };
};

let serviceInstance = null;

export const getCollaborationService = () => {
  if (!serviceInstance) {
    serviceInstance = CollaborationService();
  }
  return serviceInstance;
};

export function getKey(model, recordId) {
  return `${model}:${recordId}`;
}
