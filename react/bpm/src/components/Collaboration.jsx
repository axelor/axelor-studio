import { useStore } from "../store";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Box, Block, Menu, MenuItem, useClassNames } from "@axelor/ui";
import { translate as _t } from "../utils";

import { getCollaborationService } from "../services/collaboration.service";

import styles from "./collaboration.module.scss";
import Avatar from "./Avatar";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const Collaboration = () => {
  const { state } = useStore();
  const { info, dirty = false, record = null } = state || {};
  const { user, view } = info || {};
  const { canViewCollaboration: canView = true } = user || {};
  const { collaboration } = view || {};
  const { enabled = true } = collaboration || {};

  return (
    canView &&
    enabled &&
    record !== null &&
    record && (
      <CollaborationContainer
        model="com.axelor.studio.db.WkfModel"
        recordId={record?.id}
        recordVersion={record?.version}
        canView={canView}
        dirty={dirty}
      />
    )
  );
};

const CollaborationContainer = memo(
  ({ model, recordId, recordVersion, canView, dirty = false }) => {
    const collaborationService = useMemo(() => getCollaborationService(), []);
    const [users, setUsers] = useState([]);
    const [states, setStates] = useState({});

    const classNames = useClassNames();

    useEffect(() => {
      return collaborationService.joinRoom(
        { model, recordId, recordVersion: 0, dirty: false },
        (room) => {
          setUsers(room.users);
          setStates(room.states);
        }
      );
    }, [collaborationService, model, recordId]);

    useEffect(() => {
      collaborationService.updateRoom({
        model,
        recordId,
        recordVersion,
        dirty,
      });
    }, [collaborationService, model, recordId, recordVersion, dirty]);

    if (!canView || users?.length <= 1) {
      return null;
    }

    return (
      <Box className={classNames(styles.viewCollaboration)}>
        <Users recordVersion={recordVersion} users={users} states={states} />
      </Box>
    );
  }
);

function Users({ recordVersion, users, states }) {
  const sessionUser = useSessionUser();
  const otherUsers = useMemo(
    () => users.filter((user) => user.id !== sessionUser?.id),
    [users, sessionUser]
  );

  const avatarLimit = 3;

  const [inlineUsers, groupedUsers] = useMemo(() => {
    if (avatarLimit <= 0) {
      return [[], []];
    }
    if (otherUsers.length <= avatarLimit) {
      return [otherUsers, []];
    }
    const limit = avatarLimit - 1;
    return [otherUsers.slice(0, limit), otherUsers.slice(limit)];
  }, [otherUsers, avatarLimit]);

  const getClassName = useCallback(
    (state) => {
      if (state.leftDate) {
        return "left";
      }
      if ((state.version ?? 0) > recordVersion && state.versionDate) {
        return "saved";
      }
      if (state.dirty) {
        return "dirty";
      }
      return "joined";
    },
    [recordVersion]
  );

  const getTitle = useCallback(
    (className, userName, state, _currentDate = "") => {
      if (className === "left") {
        return _t(`${userName} left ${formatDate(state.versionDate)}`);
      }
      if (className === "saved") {
        return _t(`${userName} saved ${formatDate(state.versionDate)}`);
      }
      if (className === "dirty") {
        return _t(
          `${userName} is editing since ${formatDate(state.dirtyDate)}`
        );
      }
      return _t(`${userName} joined ${formatDate(state.joinDate)}`);
    },
    []
  );

  return (
    <Box d="flex" flexDirection="row" gap="2">
      {inlineUsers.map((user) => (
        <SingleUser
          key={user.id}
          user={user}
          state={states[user.code]}
          getClassName={getClassName}
          getTitle={getTitle}
        />
      ))}
      {groupedUsers.length ? (
        <GroupedUsers
          users={groupedUsers}
          states={states}
          isAll={!inlineUsers.length}
          getClassName={getClassName}
          getTitle={getTitle}
        />
      ) : null}
    </Box>
  );
}

function SingleUser({
  user,
  state = {},
  getClassName,
  getTitle,
  withUserName = false,
}) {
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const classNames = useClassNames();
  const userName = useUserName(user);
  const className = useMemo(() => getClassName(state), [getClassName, state]);
  const title = useMemo(
    () => getTitle(className, userName, state, currentDate),
    [getTitle, className, userName, state, currentDate]
  );

  const handleMouseEnter = useCallback(
    () => setCurrentDate(getCurrentDate()),
    [setCurrentDate]
  );

  if (withUserName) {
    return (
      <Box
        d="flex"
        alignItems="center"
        title={title}
        onMouseEnter={handleMouseEnter}
      >
        <Box d="flex" alignItems="center" pe={2}>
          <Box
            className={classNames(styles.avatarContainer, styles[className])}
          >
            <Avatar
              user={user}
              title={title}
              className={classNames(styles.avatar)}
            />
          </Box>
        </Box>
        <span>{userName}</span>
      </Box>
    );
  }

  return (
    <Box
      title={title}
      onMouseEnter={handleMouseEnter}
      className={classNames(styles.avatarContainer, styles[className])}
    >
      <Avatar user={user} title={title} className={classNames(styles.avatar)} />
    </Box>
  );
}

function GroupedUsers({
  users = [],
  states = {},
  getClassName,
  getTitle,
  isAll = false,
}) {
  const classNames = useClassNames();
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = useCallback(
    (event) => setAnchorEl(event.currentTarget),
    [setAnchorEl]
  );
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);

  const firstUser = useMemo(() => users[0] || {}, [users]);
  const firstState = states[firstUser.code];
  const firstUserName = useUserName(firstUser);

  const className = useMemo(
    () => getClassName(firstState),
    [firstState, getClassName]
  );
  const [currentDate, setCurrentDate] = useState(getCurrentDate);
  const title = useMemo(
    () => getTitle(className, firstUserName, firstState, currentDate),
    [getTitle, className, firstUserName, firstState, currentDate]
  );
  const handleMouseEnter = useCallback(
    () => setCurrentDate(getCurrentDate()),
    [setCurrentDate]
  );
  const text = useMemo(
    () => `${isAll ? "" : "+"}${users.length}`,
    [isAll, users]
  );

  return (
    <Box>
      <Box
        title={title}
        onMouseEnter={handleMouseEnter}
        className={classNames(styles.avatarContainer, styles[className])}
      >
        <Block onClick={openMenu} className={classNames(styles.menu)}>
          <Avatar
            text={text}
            title={title}
            className={classNames(styles.avatar, styles.grouped)}
          />
        </Block>
      </Box>
      <Menu
        className={styles.viewCollaborationMenu}
        target={anchorEl}
        show={Boolean(anchorEl)}
        onHide={closeMenu}
      >
        {users.map((user) => {
          return (
            <MenuItem key={user.id} onClick={closeMenu}>
              <SingleUser
                key={user.id}
                user={user}
                state={states[user.code]}
                getClassName={getClassName}
                getTitle={getTitle}
                withUserName
              />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

function useSessionUser() {
  const { state } = useStore();
  const data = state.info;
  return useMemo(() => {
    const user = data?.user;
    if (!user) {
      return user;
    }
    const { id, login, name, nameField, image } = user;
    return {
      id,
      code: login,
      [nameField ?? "name"]: name,
      $avatar: image,
    };
  }, [state]);
}

function useUserName(user) {
  const { state } = useStore();
  const { info = {} } = state || {};
  const { user: activeUser = {} } = info || {};
  const nameField = activeUser?.nameField ?? "name";

  const userName = useMemo(() => {
    if (user && nameField in user) {
      return user[nameField];
    } else {
      return null;
    }
  }, [user, nameField]);

  return userName;
}

function formatDate(date) {
  return dayjs(date).fromNow();
}

function getCurrentDate() {
  return dayjs().format("YYYY-MM-DD HH:mm");
}
